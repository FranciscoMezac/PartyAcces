class Producto {
  #id; #nombre; #puntosRequeridos; #activo;

  constructor({ id, nombre, puntosRequeridos, activo = true }) {
    this.#id = Number(id);
    this.#nombre = nombre;
    this.#puntosRequeridos = Number(puntosRequeridos);
    this.#activo = !!activo;
  }

  get id() { return this.#id; }
  get nombre() { return this.#nombre; }
  get puntosRequeridos() { return this.#puntosRequeridos; }
  get activo() { return this.#activo; }

  getCostoEnPuntos() {
    return this.#puntosRequeridos;
  }
}

module.exports = Producto;
