const db = require('../config/database');
const PuntosService = require('../services/PuntosService');
const CuentaRepository = require('../repositories/CuentaRepository');
const ProductoRepository = require('../repositories/ProductoRepository');
const MovimientoRepository = require('../repositories/MovimientoRepository');

class PuntosController {
  constructor({ porcentaje } = {}) {
    const cuentaRepo = new CuentaRepository(db);
    const productoRepo = new ProductoRepository(db);
    const movimientoRepo = new MovimientoRepository(db);
    this.service = new PuntosService({ db, cuentaRepo, productoRepo, movimientoRepo, porcentaje });

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

      const { nuevoSaldo, puntos } = await this.service.acumularPuntos(rut, montoNum);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, rut, nuevoSaldo, puntos }));
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

      try {
        const result = await this.service.canjear(rut, pid);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, rut, producto: { id: result.canje.productoId, nombre: result.canje.nombre }, costo: result.canje.costo, nuevoSaldo: result.nuevoSaldo }));
      } catch (e) {
        const status = e.code === 'SALDO_INSUFICIENTE' || e.code === 'PRODUCTO_NO_ENCONTRADO' || e.code === 'CUENTA_NO_ENCONTRADA' ? 400 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
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

      const result = await this.service.obtenerHistorial(rut, page, limit);
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

