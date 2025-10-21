const db = require('../config/database');
const Cuenta = require('../models/Cuenta');
const Movimiento = require('../models/Movimiento');
const Producto = require('../models/Producto');
const MovimientoHistorial = require('../models/MovimientoHistorial');

class PuntosController {
  constructor({ porcentaje } = {}) {
    this.porcentaje = typeof porcentaje === 'number'
      ? porcentaje
      : (process.env.PUNTOS_PORCENTAJE ? Number(process.env.PUNTOS_PORCENTAJE) : 0.1);
    this.acumular = this.acumular.bind(this);
    this.canjear = this.canjear.bind(this);
    this.historial = this.historial.bind(this);
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

  async canjear(req, res) {
    try {
      const { rut, productoId } = req.body || {};
      const pid = Number(productoId);
      if (!rut || !Number.isFinite(pid) || pid <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Datos inválidos' }));
      }

      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Cargar cuenta y producto dentro de la transacción
        const cuenta = new Cuenta({ rut, client });
        // A diferencia de acumular, en canje asumimos que la cuenta debe existir
        await cuenta.lockAndLoad();

        const producto = new Producto({ id: pid, client });
        await producto.load();

        // Validar y debitar
        const costo = producto.puntosRequeridos;
        cuenta.debitar(costo);
        await cuenta.save();

        // Registrar movimiento de canje (puntos negativos)
        const mov = new Movimiento({ rut, tipo: 'CANJE', monto: 0, puntos: -costo, client });
        await mov.save();

        await client.query('COMMIT');

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          rut,
          producto: { id: producto.id, nombre: producto.nombre },
          costo,
          nuevoSaldo: cuenta.saldo
        }));
      } catch (e) {
        await client.query('ROLLBACK');
        const status = e.code === 'SALDO_INSUFICIENTE' || e.code === 'PRODUCTO_NO_ENCONTRADO' ? 400 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('canjear error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Error interno' }));
    }
  }

  async historial(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rut = url.searchParams.get('rut');
      const page = url.searchParams.get('page') || 1;
      const limit = url.searchParams.get('limit') || 10;
      if (!rut) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Falta rut' }));
      }

      const listado = new MovimientoHistorial({ db, rut });
      const result = await listado.listar({ page, limit });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, rut, ...result }));
    } catch (e) {
      console.error('historial error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Error interno' }));
    }
  }
}

module.exports = new PuntosController();
