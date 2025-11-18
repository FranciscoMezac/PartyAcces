const Movimiento = require('../models/Movimiento');
const saldoNotifier = require('../utils/saldoNotifier');

class PuntosService {
  constructor({ db, cuentaRepo, productoRepo, movimientoRepo, porcentaje }) {
    this.db = db;
    this.cuentaRepo = cuentaRepo;
    this.productoRepo = productoRepo;
    this.movimientoRepo = movimientoRepo;
    this.porcentaje = typeof porcentaje === 'number'
      ? porcentaje
      : (process.env.PUNTOS_PORCENTAJE ? Number(process.env.PUNTOS_PORCENTAJE) : 0.1);
  }

  calcularAcreditacion(monto) {
    return Math.floor(Number(monto) * this.porcentaje);
  }

  async acumularPuntos(rut, monto) {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await this.cuentaRepo.ensureExists(client, rut);
      const cuenta = await this.cuentaRepo.findByRut(client, rut, { forUpdate: true });
      // usar nombres del diagrama desde el dominio
      const puntos = cuenta.calcularPuntosAcreditacion(monto, this.porcentaje);
      cuenta.acreditar(puntos);
      const nuevoSaldo = await this.cuentaRepo.actualizarSaldo(client, rut, cuenta.saldo);
      const mov = new Movimiento({ rut, tipo: 'COMPRA', monto: Number(monto), puntos, fecha: new Date() });
      await mov.registrar(this.movimientoRepo, client);
      await client.query('COMMIT');
      // notificar saldo actualizado
      try { saldoNotifier.publish(rut, nuevoSaldo); } catch (_) {}
      return { nuevoSaldo, puntos };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
  }

  async canjear(rut, productoId) {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      const cuenta = await this.cuentaRepo.findByRut(client, rut, { forUpdate: true });
      if (!cuenta) { const err = new Error('Cuenta no encontrada'); err.code='CUENTA_NO_ENCONTRADA'; throw err; }
      const Producto = require('../models/Producto');
      const producto = new Producto({ id: Number(productoId) });
      await producto.cargarPorId(this.productoRepo, client);
      const costo = producto.costoEnPuntos();
      if (!cuenta.puedeDebitar(costo)) { const e = new Error('Saldo insuficiente'); e.code='SALDO_INSUFICIENTE'; throw e; }
      cuenta.debitar(costo);
      const nuevoSaldo = await this.cuentaRepo.actualizarSaldo(client, rut, cuenta.saldo);
      const mov = new Movimiento({ rut, tipo: 'CANJE', monto: 0, puntos: -costo, fecha: new Date() });
      await mov.registrar(this.movimientoRepo, client);
      await client.query('COMMIT');
      try { saldoNotifier.publish(rut, nuevoSaldo); } catch (_) {}
      return { nuevoSaldo, canje: { productoId: producto.id, nombre: producto.nombre, costo } };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
  }

  async obtenerHistorial(rut, page = 1, limit = 10) {
    return Movimiento.listarPorRut(this.movimientoRepo, rut, { page, limit });
  }

  async obtenerSaldo(rut) {
    return this.cuentaRepo.getSaldo(rut);
  }
}

module.exports = PuntosService;

