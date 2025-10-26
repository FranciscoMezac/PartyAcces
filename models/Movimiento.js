class Movimiento {
  #rut; #tipo; #monto; #puntos; #fecha;

  constructor({ rut, tipo, monto, puntos, fecha = new Date() }) {
    this.#rut = rut;
    this.#tipo = tipo;                 // 'COMPRA' | 'CANJE'
    this.#monto = Number(monto);
    this.#puntos = Number(puntos);
    this.#fecha = fecha;
  }

  get rut() { return this.#rut; }
  get tipo() { return this.#tipo; }
  get monto() { return this.#monto; }
  get puntos() { return this.#puntos; }
  get fecha() { return this.#fecha; }
}

module.exports = Movimiento;
