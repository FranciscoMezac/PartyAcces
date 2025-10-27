const db = require('../config/database');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const UsuarioService = require('../services/UsuarioService');
const { verify } = require('../utils/jwtUtil');

// Repositorio y servicio locales (se mantienen aquí para compatibilidad con router.js)
const usuarioRepo = new UsuarioRepository(db);
const usuarioService = new UsuarioService({ usuarioRepo });

/**
 * Controlador consolidado de usuarios
 * Contiene: listar (paginado), bloquear, y operaciones CRUD (obtener, crear, actualizar, eliminar)
 * Mantiene el estilo de respuestas con res.writeHead / res.end para ser compatible con el resto del proyecto
 */

async function listar(req, res) {
  try {
    // Autenticación simple con Bearer <token>
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    let payload = null;
    if (!auth || !auth.startsWith('Bearer ')) {
      if (process.env.NODE_ENV !== 'production') {
        // Modo demo: permitir sin token
        payload = { id: 0, email: 'admin@demo', rol: 'ADMIN' };
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'No autenticado' }));
      }
    } else {
      try {
        payload = verify(auth.slice('Bearer '.length));
      } catch (e) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'No autenticado' }));
      }
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
    if (!rut || String(rut).trim().length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'RUT requerido' }));
    }
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

// -------------------------
// CRUD compatibles (unidos desde userController.js)
// Ahora usan UsuarioService para centralizar lógica de negocio
// -------------------------

async function getAllUsers(req, res) {
  try {
    const usuariosJSON = await usuarioService.obtenerTodos();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, data: usuariosJSON }));
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'No se pudo obtener usuarios' }));
  }
}

async function getUserById(req, res) {
  try {
    const bodyOrParams = req.params || req.body || {};
    const id = bodyOrParams.id;
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'ID de usuario requerido' }));
    }
    
    const usuario = await usuarioService.obtenerPorId(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, data: usuario }));
  } catch (error) {
    console.error('getUserById error:', error);
    if (error.code === 'NOT_FOUND') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'No se pudo obtener usuario' }));
  }
}

async function createUser(req, res) {
  try {
    const { name, nombre, email, password, contrasenia, rut, rol, estado } = req.body || {};
    const nombreFinal = nombre || name;
    const contraseniaFinal = contrasenia || password;

    const usuario = await usuarioService.crearUsuario({
      nombre: nombreFinal,
      email,
      contrasenia: contraseniaFinal,
      rut,
      rol,
      estado
    });

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Usuario creado exitosamente', user: usuario }));
  } catch (error) {
    console.error('createUser error:', error);
    if (error.code === 'DUPLICATE_EMAIL') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
    if (error.code === 'DUPLICATE_RUT') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: error.message || 'No se pudo crear usuario' }));
  }
}

async function updateUser(req, res) {
  try {
    const bodyOrParams = req.params || req.body || {};
    const id = bodyOrParams.id;
    const { nombre, email, rol, estado, contrasenia } = req.body || {};

    const usuario = await usuarioService.actualizarUsuario(id, {
      nombre,
      email,
      rol,
      estado,
      contrasenia
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Usuario actualizado exitosamente', user: usuario }));
  } catch (error) {
    console.error('updateUser error:', error);
    if (error.code === 'NOT_FOUND') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: error.message || 'No se pudo actualizar usuario' }));
  }
}

async function deleteUser(req, res) {
  try {
    const bodyOrParams = req.params || req.body || {};
    const id = bodyOrParams.id;

    const resultado = await usuarioService.eliminarUsuario(id);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: resultado.message }));
  } catch (error) {
    console.error('deleteUser error:', error);
    if (error.code === 'NOT_FOUND') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: error.message || 'No se pudo eliminar usuario' }));
  }
}

module.exports = {
  listar,
  bloquear,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
