// api/extract.js — Vercel Serverless Function
// Claude API: 텍스트에서 장소명 + 위도/경도 추출

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'No items' });

  const text = items
    .map((it, i) => `[${i}] ${it.title} / ${it.description}`)
    .join('\n');

  const prompt = `다음은 경기도 화성시 관련 포스트 목록입니다.
각 항목에서 언급된 화성시 내 장소명을 추출하고, 해당 장소의 위도·경도를 반환하세요.
장소가 없거나 불분명하면 null로 처리하세요.

반드시 아래 JSON 배열만 반환하세요 (마크다운 없이):
[
  { "index": 0, "place": "장소명 또는 null", "lat": 위도 또는 null, "lng": 경도 또는 null }
]

화성시 중심 좌표: 위도 37.1996, 경도 126.8312

포스트 목록:
${text}`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || 'Anthropic API error' });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '[]';

    let locations;
    try {
      locations = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      locations = [];
    }

    res.status(200).json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
