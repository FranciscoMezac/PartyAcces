export class PuntosCuentaRepository {
  async createForUser(client, usuarioId) {
    const { rows } = await client.query(
      `INSERT INTO puntos_cuenta (usuario_id, saldo, actualizado_en)
       VALUES ($1, 0, NOW())
       RETURNING cuenta_id`,
      [usuarioId]
    );
    return rows[0].cuenta_id;
  }
}

const puntosCuentaRepository = new PuntosCuentaRepository();
export default puntosCuentaRepository;