// src/pages/Chatbot/hooks/useChatbotHistoryStore.ts
import { useCallback, useMemo, useState } from 'react';
import type {
  ChatbotTurn,
  ChatbotHistoryResponse,
  ChatbotSessionsResponse,
} from './ChatbotHistoryTypes';

// 유틸: 정규화 & 머지
function normalizeTurns(input: any[]): ChatbotTurn[] {
  // 서버 응답 키를 패널에서 쓰는 키로 정규화
  // (현재 패널은 session_id, turn_id, query, answer, ts_kst, route를 사용)
  return (input || []).map((t: any) => {
    const routeValue = String(t.route ?? t.type ?? 'general');
    const validRoute: ChatbotTurn['route'] = 
      ['sensor', 'general', 'sensor_cache', 'sensor_detail', 'error'].includes(routeValue) 
        ? routeValue as ChatbotTurn['route']
        : 'general';

    return {
      session_id: String(t.session_id ?? t.sessionId ?? ''),
      turn_id: Number(t.turn_id ?? t.turnId ?? t.id ?? 0),
      query: String(t.query ?? t.user ?? ''),
      answer: String(t.answer ?? t.assistant ?? ''),
      ts_kst: String(t.ts_kst ?? t.timestamp ?? t.createdAt ?? ''),
      route: validRoute,
      docs: t.docs || [],
      last_sensor_ctx: t.last_sensor_ctx || {},
      s3_key: t.s3_key || ''
    };
  });
}

function mergeTurns(existing: ChatbotTurn[], incoming: ChatbotTurn[]) {
  const byId = new Map<number, ChatbotTurn>();
  for (const t of existing) byId.set(t.turn_id, t);
  for (const t of incoming) byId.set(t.turn_id, t); // 같은 turn_id면 덮어쓰기
  const merged = Array.from(byId.values());
  // 시간 우선 정렬(없으면 turn_id)
  merged.sort((a, b) => {
    const ta = Date.parse(a.ts_kst) || 0;
    const tb = Date.parse(b.ts_kst) || 0;
    return ta === tb ? a.turn_id - b.turn_id : ta - tb;
  });
  return merged;
}

// 훅: 세션별 저장소
export function useChatbotHistoryStore() {
  const [sessionsById, setSessionsById] = useState<Record<string, ChatbotTurn[]>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // 세션 목록 수신(옵션: 최근 요약 표시에 활용)
  const [sessionsList, setSessionsList] = useState<ChatbotSessionsResponse['sessions']>([]);

  // 단일 세션 응답 흡수
  const ingestBySession = useCallback((resp: ChatbotHistoryResponse) => {
    const sid = String(resp.session_id);
    const inc = normalizeTurns(resp.turns || []);
    setSessionsById(prev => ({
      ...prev,
      [sid]: mergeTurns(prev[sid] || [], inc),
    }));
  }, []);

  // 날짜별 응답(여러 세션 섞임) 흡수
  const ingestByDate = useCallback((resps: ChatbotHistoryResponse[]) => {
    setSessionsById(prev => {
      const draft = { ...prev };
      for (const r of resps || []) {
        const sid = String(r.session_id);
        const inc = normalizeTurns(r.turns || []);
        draft[sid] = mergeTurns(draft[sid] || [], inc);
      }
      return draft;
    });
  }, []);

  // 세션 목록 저장(필요 시)
  const setSessions = useCallback((payload: ChatbotSessionsResponse) => {
    setSessionsList(payload.sessions || []);
  }, []);

  // 같은 세션이면 패널 리스트 즉시 반영할 수 있게 selector 제공
  const currentTurns = useMemo(
    () => (selectedSessionId ? sessionsById[selectedSessionId] || [] : []),
    [sessionsById, selectedSessionId]
  );

  return {
    // state
    sessionsById,
    sessionsList,
    selectedSessionId,
    currentTurns,
    // actions
    setSelectedSessionId,
    setSessions,
    ingestBySession,
    ingestByDate,
  };
}

export default useChatbotHistoryStore;
