// api/search.js — Vercel Serverless Function
// Naver Search API CORS proxy

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { type = 'news', query = '화성시', display = 10 } = req.query;

  const typeMap = {
    news:  'https://openapi.naver.com/v1/search/news.json',
    blog:  'https://openapi.naver.com/v1/search/blog.json',
    cafe:  'https://openapi.naver.com/v1/search/cafearticle.json',
  };

  const url = typeMap[type];
  if (!url) return res.status(400).json({ error: 'Invalid type' });

  try {
    const response = await fetch(
      `${url}?query=${encodeURIComponent(query)}&display=${display}&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id':     process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || 'Naver API error' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
