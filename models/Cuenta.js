class Cuenta {
  #rut; #saldo;

  constructor({ rut, saldo = 0 }) {
    this.#rut = rut;
    this.#saldo = Number(saldo);
  }

  get rut()   { return this.#rut; }
  get saldo() { return this.#saldo; }

  acreditar(puntos) {
    this.#saldo += Number(puntos);
    return this.#saldo;
  }

  debitar(costo) {
    const valor = Number(costo);
    if (!Number.isFinite(valor) || valor <= 0) throw new Error('Costo inválido');
    if (this.#saldo < valor) {
      const err = new Error('Saldo insuficiente');
      err.code = 'SALDO_INSUFICIENTE';
      throw err;
    }
    this.#saldo -= valor;
    return this.#saldo;
  }
}

module.exports = Cuenta;
