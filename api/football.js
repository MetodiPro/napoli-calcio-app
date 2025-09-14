module.exports = async function handler(req, res) {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { endpoint = 'teams/113' } = req.query;
    const apiKey = process.env.FOOTBALL_API_KEY || 'ecefe79f13b44346a96ab4fbec3398c8';

    const response = await fetch(
      `https://api.football-data.org/v4/${endpoint}`,
      {
        headers: {
          'X-Auth-Token': apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Football API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Football API error:', error);
    res.status(500).json({ error: error.message });
  }
};