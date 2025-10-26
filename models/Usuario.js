class Usuario {
  constructor({ id, nombre, correo, rut = null, rol = 'USER', estado = 'ACTIVO', creadoEn = null }) {
    this.id = id;
    this.nombre = nombre;
    this.correo = correo;
    this.rut = rut;
    this.rol = rol;
    this.estado = estado;
    this.creadoEn = creadoEn;
  }
}

module.exports = Usuario;
