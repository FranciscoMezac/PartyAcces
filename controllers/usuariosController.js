const db = require('../config/database');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const UsuarioService = require('../services/UsuarioService');
const { verify } = require('../utils/jwtUtil');

const usuarioRepo = new UsuarioRepository(db);
const usuarioService = new UsuarioService({ usuarioRepo });

async function listar(req, res) {
  try {
    // Autenticación simple con Bearer <token>
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No autenticado' }));
    }

    let payload;
    try {
      payload = verify(auth.slice('Bearer '.length));
    } catch (e) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No autenticado' }));
    }

    if (!payload || payload.rol !== 'ADMIN') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No autorizado' }));
    }

    // Query params
    const url = new URL(req.url, 'http://localhost');
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Number(url.searchParams.get('limit') || 10);
    const estado = url.searchParams.get('estado') || 'all';
    const search = url.searchParams.get('search') || '';

    const result = await usuarioService.listarUsuarios({ page, limit, estado, search });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, data: result }));
  } catch (e) {
    console.error('listar usuarios error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'No se pudo listar usuarios' }));
  }
}

async function bloquear(req, res) {
  try {
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No autenticado' }));
    }
    let payload;
    try { payload = verify(auth.slice('Bearer '.length)); } catch (_) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No autenticado' }));
    }
    if (!payload || payload.rol !== 'ADMIN') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No autorizado' }));
    }

    // body: { rut, motivo }
    const { rut, motivo } = req.body || {};
    try {
      const u = await usuarioService.bloquearUsuario({ rut, motivo, adminId: payload.id });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, usuario: { rut: u.rut, estado: u.estado } }));
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Usuario no encontrado' }));
      }
      if (e.code === 'ALREADY_BLOCKED') {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Ya está bloqueado' }));
      }
      console.error('bloquear repo error:', e);
      throw e;
    }
  } catch (e) {
    console.error('bloquear usuario error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'No se pudo bloquear usuario' }));
  }
}

module.exports = { listar, bloquear };
