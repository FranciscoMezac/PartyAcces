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
    this.saldo = this.saldo.bind(this);
    this.saldoStream = this.saldoStream.bind(this);
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

  async saldo(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rut = url.searchParams.get('rut');
      if (!rut) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Falta rut' }));
      }
      const saldo = await this.service.obtenerSaldo(rut);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, rut, saldo }));
    } catch (e) {
      console.error('saldo error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Error interno' }));
    }
  }

  async saldoStream(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rut = url.searchParams.get('rut');
      if (!rut) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('rut requerido');
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('\n');
      const { subscribe } = require('../utils/saldoNotifier');
      subscribe(rut, res);
      // envío de ping cada 25s para mantener viva la conexión (opcional)
      const interval = setInterval(() => { try { res.write(':\n\n'); } catch (_) {} }, 25000);
      res.on('close', () => clearInterval(interval));
    } catch (e) {
      console.error('saldoStream error:', e.message);
      try { res.end(); } catch (_) {}
    }
  }
}

module.exports = new PuntosController();

