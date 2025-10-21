const db = require('../config/database');
const Cuenta = require('../models/Cuenta');
const Movimiento = require('../models/Movimiento');

class PuntosController {
  constructor({ porcentaje } = {}) {
    this.porcentaje = typeof porcentaje === 'number'
      ? porcentaje
      : (process.env.PUNTOS_PORCENTAJE ? Number(process.env.PUNTOS_PORCENTAJE) : 0.1);
    this.acumular = this.acumular.bind(this);
  }

  async acumular(req, res) {
    try {
      const { rut, monto } = req.body || {};
      const montoNum = Number(monto);
      if (!rut || !Number.isFinite(montoNum) || montoNum <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Datos inválidos' }));
      }

      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Instanciar objetos de dominio con el client de la transacción
        const cuenta = new Cuenta({ rut, client });
        await cuenta.ensureExists();
        await cuenta.lockAndLoad();

        const puntos = Math.floor(montoNum * this.porcentaje);
        cuenta.acreditar(puntos);
        await cuenta.save();

        const mov = new Movimiento({ rut, tipo: 'COMPRA', monto: montoNum, puntos, client });
        await mov.save();

        await client.query('COMMIT');

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          rut,
          nuevoSaldo: cuenta.saldo,
          puntos
        }));
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('acumular error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Error interno' }));
    }
  }
}

module.exports = new PuntosController();