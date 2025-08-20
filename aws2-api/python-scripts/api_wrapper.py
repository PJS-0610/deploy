#!/usr/bin/env python3
import sys
import json
import traceback
from datetime import datetime

# 기존 챗봇 모듈 import
try:
    from chatbot import (
        # 라우팅 및 분류
        decide_route,
        classify_query_with_llm,
        _deterministic_sensor_signal,
        
        # 문서 검색 및 스코어링
        retrieve_documents_from_s3,
        score_doc,
        detect_schema,
        quick_sensor_evidence,
        
        # 프롬프트 빌딩
        build_prompt,
        build_general_prompt,
        _build_history_block,
        
        # LLM 호출
        generate_answer_with_nova,
        _invoke_claude,
        
        # 세션 관리
        UserSession,
        get_or_create_session,
        cleanup_expired_sessions,
        #reset_session,
        save_session_history,
        load_session_history,
        list_session_files,
        get_session_s3_key,
        
        # 후속질문 처리
        expand_followup_query_with_last_window,
        set_followup_timestamp,
        get_followup_timestamp,
        clear_followup_timestamp,
        set_followup_context,
        get_followup_context,
        
        # 로깅 및 저장
        save_turn_to_s3,
        
        # 센서 데이터 관련
        find_sensor_data_from_s3_logs,
        find_latest_sensor_data_from_s3,
        find_closest_sensor_data,
        find_minavg_data,
        find_closest_available_data,
        detect_fields_in_query,
        
        # 통계 및 분석 기능
        calculate_daily_average_temperature,
        calculate_today_average_all_sensors,
        calculate_daily_average_all_sensors,
        find_extrema_time_in_date,
        
        # 시간 관련
        extract_datetime_strings,
        parse_dt,
        extract_time_range_from_query,
        get_time_range_from_query,
        get_duration_range_from_query,
        parse_time_from_key,
        _to_kst_naive,
        
        # 컨텍스트 관리
        _reset_last_ctx,
        _get_last_ctx,
        
        # 상수 (chatbot.py에서 정의된 것들)
        ENABLE_CHATLOG_SAVE,
        MAX_HISTORY_TURNS,
        RELEVANCE_THRESHOLD,
        TOP_K,
        LIMIT_CONTEXT_CHARS,
        MAX_FILES_TO_SCAN,
        MAX_WORKERS,
        MAX_FILE_SIZE,
        REGION,
        S3_BUCKET_DATA,
        S3_PREFIX,
        CHATLOG_BUCKET,
        CHATLOG_PREFIX,
        FIELD_SYNONYMS,
        FIELD_NAME_KOR,
        KST,
        ISO_PAT,
        SESSION_TIMEOUT,
        INFERENCE_PROFILE_ARN,
        
        # 전역 변수
        USER_SESSIONS,
        LAST_SENSOR_CTX,
        
        # 기타 유틸리티
        tokenize,
        normalize_query_tokens,
        minute_requested,
        hour_bucket_requested,
        hourly_average_requested,
        daily_summary_requested,
        is_recent_query,
        extract_time_offset,
        requested_granularity
    )
    
    # 만료된 세션 정리
    cleanup_expired_sessions()
    
except ImportError as e:
    print(json.dumps({
        "error": "Failed to import chatbot module",
        "details": str(e)
    }), file=sys.stderr)
    sys.exit(1)

def process_query(query: str, session_id: str = None) -> dict:
    """
    단일 질의를 처리하고 결과를 반환 (다중 사용자 지원, 고도화된 센서 데이터 분석)
    """
    try:
        start_time = datetime.now()
        
        # 세션 가져오기 또는 생성
        session = get_or_create_session(session_id)
        
        # 후속질문 확장
        expanded_query = expand_followup_query_with_last_window(query, session=session)
        if expanded_query != query:
            query = expanded_query

        # 라우팅 결정
        route = decide_route(query)

        if route == "general":
            # 일반 질문 처리
            prompt = build_general_prompt(query, history=session.history)
            answer = generate_answer_with_nova(prompt)
            
            turn_id = session.increment_turn()
            result = {
                "answer": answer,
                "route": "general",
                "session_id": session.session_id,
                "turn_id": turn_id,
                "processing_time": (datetime.now() - start_time).total_seconds(),
                "mode": "general_llm"
            }
            
            session.add_to_history(query, answer, "general")
            if ENABLE_CHATLOG_SAVE:
                save_turn_to_s3(session.session_id, turn_id, "general", query, answer, top_docs=[])
            
            return result

        # 센서 질문 처리 - 고도화된 분석 시도
        _reset_last_ctx(session=session)
        
        # 1. 일별 평균 온도 요청 검사
        if daily_summary_requested(query) and ("온도" in query or "temperature" in query.lower()):
            daily_temp_result = calculate_daily_average_temperature(query)
            if daily_temp_result:
                turn_id = session.increment_turn()
                result = {
                    "answer": daily_temp_result,
                    "route": "sensor_daily_temp",
                    "session_id": session.session_id,
                    "turn_id": turn_id,
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "mode": "daily_statistics"
                }
                session.add_to_history(query, daily_temp_result, "sensor_daily_temp")
                if ENABLE_CHATLOG_SAVE:
                    save_turn_to_s3(session.session_id, turn_id, "sensor_daily_temp", query, daily_temp_result, top_docs=[])
                return result
        
        # 2. 일별 전체 센서 평균 요청 검사
        if daily_summary_requested(query):
            daily_all_result = calculate_daily_average_all_sensors(query)
            if daily_all_result:
                turn_id = session.increment_turn()
                result = {
                    "answer": daily_all_result,
                    "route": "sensor_daily_all",
                    "session_id": session.session_id,
                    "turn_id": turn_id,
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "mode": "daily_statistics"
                }
                session.add_to_history(query, daily_all_result, "sensor_daily_all")
                if ENABLE_CHATLOG_SAVE:
                    save_turn_to_s3(session.session_id, turn_id, "sensor_daily_all", query, daily_all_result, top_docs=[])
                return result
        
        # 3. 오늘 전체 센서 평균 요청 검사
        if "오늘" in query and any(keyword in query for keyword in ["평균", "전체", "모든"]):
            today_all_result = calculate_today_average_all_sensors()
            if today_all_result:
                turn_id = session.increment_turn()
                result = {
                    "answer": today_all_result,
                    "route": "sensor_today_all",
                    "session_id": session.session_id,
                    "turn_id": turn_id,
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "mode": "today_statistics"
                }
                session.add_to_history(query, today_all_result, "sensor_today_all")
                if ENABLE_CHATLOG_SAVE:
                    save_turn_to_s3(session.session_id, turn_id, "sensor_today_all", query, today_all_result, top_docs=[])
                return result
        
        # 4. 최고/최저값 시간 찾기 요청 검사
        if any(keyword in query for keyword in ["최고", "최저", "가장.*더운", "가장.*차가운", "가장.*높은", "가장.*낮은"]):
            extrema_result = find_extrema_time_in_date(query)
            if extrema_result:
                turn_id = session.increment_turn()
                result = {
                    "answer": extrema_result,
                    "route": "sensor_extrema",
                    "session_id": session.session_id,
                    "turn_id": turn_id,
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "mode": "extrema_analysis"
                }
                session.add_to_history(query, extrema_result, "sensor_extrema")
                if ENABLE_CHATLOG_SAVE:
                    save_turn_to_s3(session.session_id, turn_id, "sensor_extrema", query, extrema_result, top_docs=[])
                return result
        
        # 5. 시간 범위 쿼리 처리
        time_range = get_time_range_from_query(query) or get_duration_range_from_query(query)
        if time_range:
            # 시간 범위가 있는 경우 특별 처리
            set_followup_context("time_range", {"start": time_range[0], "end": time_range[1]}, session=session)
        
        # 6. S3 로그에서 캐시된 데이터 확인
        cached_sensor_data = find_sensor_data_from_s3_logs(query)
        
        if cached_sensor_data:
            # 캐시된 데이터로 빠른 응답
            cached_dt = datetime.strptime(cached_sensor_data['timestamp'], '%Y-%m-%d %H:%M:%S')
            set_followup_timestamp(cached_dt, session=session)
            
            need_fields = detect_fields_in_query(query)
            response_parts = []
            timestamp_str = cached_sensor_data['timestamp']
            
            if 'temperature' in need_fields and cached_sensor_data.get('temperature') is not None:
                response_parts.append(f"온도 {cached_sensor_data['temperature']}℃")
            if 'humidity' in need_fields and cached_sensor_data.get('humidity') is not None:
                response_parts.append(f"습도 {cached_sensor_data['humidity']}%")
            if 'gas' in need_fields and cached_sensor_data.get('gas') is not None:
                response_parts.append(f"CO2 {cached_sensor_data['gas']}ppm")
            
            if response_parts:
                quick_answer = f"{timestamp_str}: {', '.join(response_parts)}"
                
                turn_id = session.increment_turn()
                result = {
                    "answer": quick_answer,
                    "route": "sensor_cache",
                    "session_id": session.session_id,
                    "turn_id": turn_id,
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "mode": "cached_data",
                    "fields": need_fields
                }
                
                session.add_to_history(query, quick_answer, "sensor_cache")
                if ENABLE_CHATLOG_SAVE:
                    save_turn_to_s3(session.session_id, turn_id, "sensor_cache", query, quick_answer, top_docs=[])
                
                return result
        
        # 7. 최신 센서 데이터 빠른 검색 (최근 요청시)
        if is_recent_query(query):
            latest_data = find_latest_sensor_data_from_s3(query)
            if latest_data:
                turn_id = session.increment_turn()
                result = {
                    "answer": latest_data,
                    "route": "sensor_latest",
                    "session_id": session.session_id,
                    "turn_id": turn_id,
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "mode": "latest_data"
                }
                session.add_to_history(query, latest_data, "sensor_latest")
                if ENABLE_CHATLOG_SAVE:
                    save_turn_to_s3(session.session_id, turn_id, "sensor_latest", query, latest_data, top_docs=[])
                return result

        # 8. 일반 RAG 검색 (위의 특별 처리가 적용되지 않은 경우)
        top_docs, context = retrieve_documents_from_s3(query)
        
        # RAG 또는 일반 LLM 선택
        has_sensor_data = top_docs and any(
            d.get("schema") in {"raw_list","minavg","houravg","mintrend"} or 
            any(pattern in d.get("id", "").lower() 
                for pattern in ["rawdata", "houravg", "minavg", "mintrend"])
            for d in top_docs
        )
        use_rag = has_sensor_data and (top_docs[0]["score"] >= RELEVANCE_THRESHOLD)
        
        if use_rag:
            prompt = build_prompt(query, context, history=session.history)
            
            # 타임스탬프 추출 및 저장
            dt_strings = extract_datetime_strings(query)
            for ds in dt_strings:
                dt = parse_dt(ds)
                if dt:
                    set_followup_timestamp(dt, session=session)
                    break
        else:
            prompt = build_general_prompt(query, history=session.history)
        
        answer = generate_answer_with_nova(prompt)
        
        turn_id = session.increment_turn()
        result = {
            "answer": answer,
            "route": "sensor" if use_rag else "general",
            "session_id": session.session_id,
            "turn_id": turn_id,
            "processing_time": (datetime.now() - start_time).total_seconds(),
            "mode": "rag" if use_rag else "general_llm",
            "docs_found": len(top_docs) if top_docs else 0,
            "top_score": top_docs[0]["score"] if top_docs else 0
        }
        
        session.add_to_history(query, answer, "sensor" if use_rag else "general")
        if ENABLE_CHATLOG_SAVE:
            save_turn_to_s3(session.session_id, turn_id, "sensor" if use_rag else "general", query, answer, top_docs=top_docs)
        
        return result

    except Exception as e:
        # 세션이 생성되지 않은 경우를 위한 fallback
        try:
            session = get_or_create_session(session_id)
            error_session_id = session.session_id
            error_turn_id = session.turn_id
        except:
            error_session_id = "error"
            error_turn_id = 0
            
        error_msg = f"챗봇 처리 중 오류가 발생했습니다: {str(e)}"
        return {
            "answer": error_msg,
            "route": "error",
            "session_id": error_session_id,
            "turn_id": error_turn_id,
            "processing_time": (datetime.now() - start_time).total_seconds(),
            "mode": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def main():
    """
    메인 실행 함수
    명령행 인자 또는 stdin으로 질문을 받고 JSON 응답 출력
    """
    try:
        query = ""
        session_id = None
        
        # 명령행 인자로 질문을 받는 경우
        if len(sys.argv) > 1:
            query = " ".join(sys.argv[1:])
        else:
            # stdin으로 JSON 입력을 받는 경우
            try:
                input_data = json.loads(sys.stdin.read())
                query = input_data.get("query", "")
                session_id = input_data.get("session_id")  # 세션 ID 추출
            except json.JSONDecodeError:
                # 단순 텍스트 입력인 경우
                query = sys.stdin.read().strip()
        
        if not query:
            # 세션 생성해서 에러 응답에 포함
            session = get_or_create_session(session_id)
            result = {
                "error": "No query provided",
                "session_id": session.session_id,
                "turn_id": session.turn_id
            }
        else:
            result = process_query(query, session_id)
        
        # JSON 응답 출력
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        # 에러 시에도 기본 세션 생성
        try:
            session = get_or_create_session(None)
            error_session_id = session.session_id
            error_turn_id = session.turn_id
        except:
            error_session_id = "error"
            error_turn_id = 0
            
        error_result = {
            "error": "API wrapper error",
            "details": str(e),
            "traceback": traceback.format_exc(),
            "session_id": error_session_id,
            "turn_id": error_turn_id
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()