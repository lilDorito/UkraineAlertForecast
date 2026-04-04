export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiUrl = process.env.VITE_API_URL || 'http://13.63.184.88/latest';
  const apiKey = process.env.VITE_API_KEY;

  if (!apiKey) {
    console.error('VITE_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}