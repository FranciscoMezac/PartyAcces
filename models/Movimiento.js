class Movimiento {
  #rut; #tipo; #monto; #puntos; #fecha; #client;

  constructor({ rut, tipo, monto, puntos, fecha = new Date(), client }) {
    this.#rut = rut;
    this.#tipo = tipo;                 // 'COMPRA'
    this.#monto = Number(monto);
    this.#puntos = Number(puntos);
    this.#fecha = fecha;
    this.#client = client;
  }

  async save() {
    await this.#client.query(
      `INSERT INTO movimientos (rut, tipo, monto, puntos, fecha)
       VALUES ($1, $2, $3, $4, $5)`,
      [this.#rut, this.#tipo, this.#monto, this.#puntos, this.#fecha]
    );
  }
}

module.exports = Movimiento;