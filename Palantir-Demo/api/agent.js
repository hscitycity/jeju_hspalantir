const SYSTEM_PROMPT =
  '당신은 화성시 도시 인텔리전스 분석 에이전트입니다. 수집된 뉴스·블로그·카페·민원 데이터를 기반으로 화성시의 현안, 민원 트렌드, 지역 이슈를 분석해 답변하세요.';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const context = String(body.context || '').slice(0, 3000);

  const sanitizedMessages = rawMessages
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
    .map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : String(msg.content || ''),
    }));

  const requestMessages = [
    {
      role: 'user',
      content: `수집 데이터 요약(최대 3000자):\n${context || '수집 데이터 없음'}\n\n위 요약은 분석 참고용 컨텍스트입니다.`,
    },
    ...sanitizedMessages,
  ].slice(-20);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: requestMessages,
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      return res.status(response.status || 500).json({ error: errorText || 'Anthropic stream error' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    return res.end();
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}
