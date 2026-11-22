import express from 'express';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 8080;
const KEY = process.env.FOOTBALL_API_KEY;
const UPSTREAM = 'https://live-football-api.com/api/v1';
const TIMEOUT_MS = 18000;

async function proxy(path, res) {
  if (!KEY) return res.status(500).json({ error: 'Football API key is missing' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = new URL(UPSTREAM + path);
    url.searchParams.set('api_key', KEY);

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Invalid response from football provider' });
    }

    if (!response.ok) {
      console.error('Football provider:', response.status, data);
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error('Football API:', error.message);
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Le fournisseur de données répond trop lentement.',
        retryable: true
      });
    }
    return res.status(502).json({ error: 'Impossible de contacter le fournisseur.' });
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'FootScore CI' });
});

app.get('/api/matches', (req, res) => proxy('/matches', res));

app.get('/api/live-details', (req, res) => proxy('/matches', res));

app.get('/api/leagues', (req, res) => proxy('/leagues?lang=en', res));

app.get('/api/standings', (req, res) => {
  const leagueId = String(req.query.league_id || 'lfa-premier-league');
  // Accept only provider league IDs, not arbitrary URL fragments.
  if (!/^lfa-[a-z0-9-]+$/.test(leagueId)) {
    return res.status(400).json({ error: 'Identifiant de compétition invalide.' });
  }
  return proxy(`/league_standings?league_id=${encodeURIComponent(leagueId)}&lang=en`, res);
});

app.listen(PORT, () => console.log(`FootScore CI server on port ${PORT}`));
