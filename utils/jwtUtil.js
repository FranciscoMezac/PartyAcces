const crypto = require('crypto');

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  return Buffer.from(str + pad, 'base64').toString('utf8');
}

function verify(token, secret = process.env.JWT_SECRET || '') {
  if (!token || typeof token !== 'string') throw new Error('Token vacío');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token inválido');
  const [h, p, s] = parts;
  const header = JSON.parse(base64urlDecode(h));
  const payload = JSON.parse(base64urlDecode(p));

  if (header.alg === 'none' || !secret) {
    return payload; // modo demo: sin verificación de firma
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${h}.${p}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (expected !== s) throw new Error('Firma inválida');

  // exp opcional
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Token expirado');
  return payload;
}

module.exports = { verify };

