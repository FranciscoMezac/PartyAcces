export default class Usuario {
  constructor({ usuarioId, nombre, email, contrasenia, rol, estado }) {
    this.usuarioId = usuarioId;
    this.nombre = nombre;
    this.email = email;
    this.contrasenia = contrasenia;
    this.rol = rol;
    this.estado = estado;
  }
}