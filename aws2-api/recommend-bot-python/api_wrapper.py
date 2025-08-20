#!/usr/bin/env python3
import sys
import json
import traceback
from datetime import datetime

# 추천봇 모듈 import
try:
    from recommendbot import answer_query

except ImportError as e:
    print(json.dumps({
        "error": "Failed to import recommendbot module",
        "details": str(e)
    }), file=sys.stderr)
    sys.exit(1)

def process_recommendation_query(query: str) -> dict:
    """
    추천 질의를 처리하고 결과를 반환
    """
    try:
        start_time = datetime.now()

        # 추천봇에 질의 처리
        answer = answer_query(query)

        processing_time = (datetime.now() - start_time).total_seconds()

        result = {
            "answer": answer,
            "status": "success",
            "processing_time": processing_time,
            "mode": "recommend_bot"
        }

        return result

    except Exception as e:
        error_msg = f"추천봇 처리 중 오류가 발생했습니다: {str(e)}"
        return {
            "answer": error_msg,
            "status": "error",
            "processing_time": (datetime.now() - start_time).total_seconds(),
            "mode": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def main():
    """
    메인 실행 함수
    stdin으로 JSON 입력을 받고 JSON 응답 출력
    """
    try:
        query = ""

        # stdin으로 JSON 입력을 받는 경우
        try:
            input_data = json.loads(sys.stdin.read())
            query = input_data.get("query", "")
        except json.JSONDecodeError:
            result = {
                "error": "Invalid JSON input",
                "status": "error"
            }
            print(json.dumps(result, ensure_ascii=False))
            return

        if not query:
            result = {
                "error": "No query provided",
                "status": "error"
            }
        else:
            result = process_recommendation_query(query)

        # JSON 응답 출력
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "error": "API wrapper error",
            "details": str(e),
            "traceback": traceback.format_exc(),
            "status": "error"
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()