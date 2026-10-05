import app from '../server/index.js';
import { URLSearchParams } from 'node:url';

export default function handler(req, res) {
  // 1. If req.originalUrl is provided and begins with /api, normalize req.url
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    req.url = req.originalUrl;
  }
  // 2. If Vercel rewrites captured :path* in req.query.path, reconstruct the exact URL
  else if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    delete req.query.path;
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(req.query)) {
      if (Array.isArray(val)) {
        val.forEach(v => searchParams.append(key, v));
      } else if (val !== undefined) {
        searchParams.append(key, val);
      }
    }
    const qs = searchParams.toString();
    req.url = `/api/${subpath}${qs ? `?${qs}` : ''}`;
  }
  // 3. If x-matched-path header exists from Vercel routing
  else if (req.headers && req.headers['x-matched-path'] && !req.headers['x-matched-path'].endsWith('.js')) {
    req.url = req.headers['x-matched-path'];
  }
  // 4. If req.url is literally /api/index.js or /index.js, map to root /api
  else if (req.url === '/api/index.js' || req.url === '/index.js') {
    req.url = '/api';
  }

  return app(req, res);
}
