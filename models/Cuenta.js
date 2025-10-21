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
    if (!r.rows[0]) throw new Error('Cuenta no encontrada');
    this.#saldo = Number(r.rows[0].saldo);
    return this.#saldo;
  }

  acreditar(puntos) {
    this.#saldo += Number(puntos);
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