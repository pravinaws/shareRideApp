import crypto from 'node:crypto';

const secret = process.env.JWT_SECRET || 'dev-fastforward-secret';

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function createToken(user) {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64Url({
    sub: user.user_id,
    role: user.role,
    name: user.full_name,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token) {
  if (!token) {
    return null;
  }

  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature || sign(`${header}.${payload}`) !== signature) {
    return null;
  }

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return claims;
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query.token;
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = user;
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient role permission' });
    }

    return next();
  };
}
