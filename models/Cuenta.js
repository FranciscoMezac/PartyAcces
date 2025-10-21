class Cuenta {
  #rut; #saldo; #client;

  constructor({ rut, saldo = 0, client }) {
    this.#rut = rut;
    this.#saldo = Number(saldo);
    this.#client = client;
  }

  get rut()   { return this.#rut; }
  get saldo() { return this.#saldo; }

  async ensureExists() {
    await this.#client.query(
      `INSERT INTO cuentas (rut, saldo, actualizado_en)
       VALUES ($1, 0, NOW())
       ON CONFLICT (rut) DO NOTHING`,
      [this.#rut]
    );
  }

  async lockAndLoad() {
    const r = await this.#client.query(
      'SELECT saldo FROM cuentas WHERE rut = $1 FOR UPDATE',
      [this.#rut]
    );
    if (!r.rows[0]) {
      const err = new Error('Cuenta no encontrada');
      err.code = 'CUENTA_NO_ENCONTRADA';
      throw err;
    }
    this.#saldo = Number(r.rows[0].saldo);
    return this.#saldo;
  }

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

  async save() {
    await this.#client.query(
      'UPDATE cuentas SET saldo = $1, actualizado_en = NOW() WHERE rut = $2',
      [this.#saldo, this.#rut]
    );
  }
}

module.exports = Cuenta;
