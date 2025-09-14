export default async function handler(req, res) {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { q = 'Napoli calcio' } = req.query;
    const apiKey = process.env.NEWS_API_KEY || 'bb766d38f8d447d79aa8ac29ff8d9ffa';

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=it&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ error: error.message });
  }
}