const Usuario = require('../models/Usuario');

/**
 * Servicio de gestión de usuarios
 * Centraliza toda la lógica de negocio relacionada con usuarios
 */
class UsuarioService {
  constructor({ usuarioRepo }) {
    this.usuarioRepo = usuarioRepo;
  }

  /**
   * Listar usuarios con paginación y filtros
   */
  async listarUsuarios({ page = 1, limit = 10, estado = 'all', search = '' }) {
    return this.usuarioRepo.findAllPaginated({ page, limit, estado, search });
  }

  /**
   * Bloquear un usuario por RUT
   */
  async bloquearUsuario({ rut, motivo, adminId }) {
    if (!rut) throw new Error('RUT requerido');
    const usuario = await this.usuarioRepo.findByRut(rut);
    if (!usuario) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (usuario.estado === 'BLOQUEADO') {
      const err = new Error('Ya está bloqueado');
      err.code = 'ALREADY_BLOCKED';
      throw err;
    }
    const bloqueado = await this.usuarioRepo.bloquear(rut, { motivo, adminId });
    if (!bloqueado) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return bloqueado;
  }

  /**
   * Obtener todos los usuarios
   */
  async obtenerTodos() {
    const usuarios = await this.usuarioRepo.findAll();
    return usuarios.map(u => u.toJSON());
  }

  /**
   * Obtener usuario por ID
   */
  async obtenerPorId(id) {
    if (!id) {
      throw new Error('ID de usuario requerido');
    }
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return usuario.toJSON();
  }

  /**
   * Obtener usuario por RUT
   */
  async obtenerPorRut(rut) {
    if (!rut) {
      throw new Error('RUT requerido');
    }
    const usuario = await this.usuarioRepo.findByRut(rut);
    if (!usuario) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return usuario.toJSON();
  }

  /**
   * Crear nuevo usuario
   */
  async crearUsuario({ nombre, email, contrasenia, rut, rol, estado }) {
    // Validaciones
    if (!nombre || !email || !contrasenia) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    // Verificar duplicados
    const existeEmail = await this.usuarioRepo.findByEmail(email.toLowerCase().trim());
    if (existeEmail) {
      const err = new Error('El email ya está en uso');
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    if (rut) {
      const existeRut = await this.usuarioRepo.findByRut(rut.trim());
      if (existeRut) {
        const err = new Error('El RUT ya está en uso');
        err.code = 'DUPLICATE_RUT';
        throw err;
      }
    }

    // Crear instancia de Usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contrasenia,
      rut: rut || '',
      rol: rol || 'USER',
      estado: estado || 'ACTIVO'
    });

    // Validar
    const validacion = nuevoUsuario.validate();
    if (!validacion.isValid) {
      throw new Error(validacion.errors.join(', '));
    }

    // Hashear contraseña
    await nuevoUsuario.hashPassword();

    // Crear en BD
    const creado = await this.usuarioRepo.create(nuevoUsuario);
    return creado.toJSON();
  }

  /**
   * Actualizar usuario existente
   */
  async actualizarUsuario(id, { nombre, email, rol, estado, contrasenia }) {
    if (!id) {
      throw new Error('ID de usuario requerido');
    }

    const usuarioExistente = await this.usuarioRepo.findById(id);
    if (!usuarioExistente) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Preparar datos de actualización
    const updateData = {
      nombre: nombre !== undefined ? nombre : usuarioExistente.nombre,
      email: email !== undefined ? email : usuarioExistente.email,
      rol: rol !== undefined ? rol : usuarioExistente.rol,
      estado: estado !== undefined ? estado : usuarioExistente.estado
    };

    // Si se actualiza contraseña, hashearla
    if (contrasenia !== undefined) {
      const bcrypt = require('bcryptjs');
      const hasheada = await bcrypt.hash(contrasenia, 10);
      updateData.contrasenia = hasheada;
    }

    const actualizado = await this.usuarioRepo.update(id, updateData);
    if (!actualizado) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }

    return actualizado.toJSON();
  }

  /**
   * Eliminar usuario
   */
  async eliminarUsuario(id) {
    if (!id) {
      throw new Error('ID de usuario requerido');
    }

    const resultado = await this.usuarioRepo.delete(id);
    if (!resultado) {
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }

    return { message: 'Usuario eliminado exitosamente' };
  }
}

module.exports = UsuarioService;
