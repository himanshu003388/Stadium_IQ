import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", ...(isProduction ? [] : ['http://localhost:5173'])],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  manifestSrc: ["'self'"],
  mediaSrc: ["'none'"],
  workerSrc: ["'none'"],
  upgradeInsecureRequests: [],
};

export function installHelmet(app) {
  app.use(
    helmet({
      contentSecurityPolicy: { directives: cspDirectives },
      crossOriginEmbedderPolicy: !isProduction ? false : { policy: 'require-corp' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xFrameOptions: { action: 'deny' },
      xXssProtection: false,
      ieNoOpen: true,
      noSniff: true,
      hidePoweredBy: true,
    }),
  );
}

export function hppGuard(req, res, next) {
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
}

export function antiPrototypePollution(req, res, next) {
  function checkProto(obj, seen = new WeakSet()) {
    if (!obj || typeof obj !== 'object') return false;
    if (seen.has(obj)) return false;
    seen.add(obj);
    if (Object.getPrototypeOf(obj) !== Object.prototype) return true;
    const keys = Object.keys(obj);
    if (keys.includes('__proto__') || keys.includes('constructor')) return true;
    return Object.values(obj).some((v) => checkProto(v, seen));
  }
  if (checkProto(req.body)) {
    return res.status(400).json({ error: 'Invalid payload structure detected.' });
  }
  next();
}

export function httpsRedirect(req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

export function extraHeaders(req, res, next) {
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}
