
import express from 'express';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

const PORT = process.env.PORT || 8080;
const KEY = process.env.FOOTBALL_API_KEY;
const UPSTREAM = 'https://live-football-api.com/api/v1';
const TIMEOUT_MS = 15000;

async function proxy(path, res) {
  if (!KEY) {
    return res.status(503).json({
      error: 'FOOTBALL_API_KEY is not configured'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = new URL(UPSTREAM + path);
    url.searchParams.set('api_key', KEY);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    const body = await response.text();

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      console.error('Invalid JSON from football provider');

      return res.status(502).json({
        error: 'The football data provider returned invalid JSON'
      });
    }

    if (!response.ok) {
      console.error(
        'Football provider error:',
        response.status,
        data
      );

      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Football API error:', error.message);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'The football data provider took too long to respond',
        retryable: true
      });
    }

    return res.status(502).json({
      error: 'Unable to contact the football data provider'
    });

  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'FootScore CI'
  });
});

app.get('/api/matches', (req, res) => {
  return proxy('/matches', res);
});

app.get('/api/live-details', (req, res) => {
  return proxy('/matches', res);
});

app.get('/api/standings', (req, res) => {
  return proxy(
    '/league_standings?league_id=lfa-premier-league&lang=en',
    res
  );
});

app.listen(PORT, () => {
  console.log(`FootScore CI server on port ${PORT}`);
});
