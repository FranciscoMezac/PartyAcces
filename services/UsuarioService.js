class UsuarioService {
  constructor({ usuarioRepo }) {
    this.usuarioRepo = usuarioRepo;
  }

  async listarUsuarios({ page = 1, limit = 10, estado = 'all', search = '' }) {
    return this.usuarioRepo.findAllPaginated({ page, limit, estado, search });
  }

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
      // Si no regresó fila ni lanzó error, tratamos como NOT_FOUND por seguridad
      const err = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return bloqueado;
  }
}

module.exports = UsuarioService;
