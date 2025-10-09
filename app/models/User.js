export default class Usuario {
  constructor({ usuarioId = null, nombre, email, contrasenia, rol = 'USER', estado = 'ACTIVO' }) {
    this.usuarioId = usuarioId;
    this.nombre = nombre;
    this.email = email;
    this.contrasenia = contrasenia;
    this.rol = rol;
    this.estado = estado;
  }
}