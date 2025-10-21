const Cuenta = require('../models/Cuenta');
const Movimiento = require('../models/Movimiento');

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

      // asegurar cuenta y calcular
      await this.cuentaRepo.ensureExists(client, rut);
      const puntos = this.calcularAcreditacion(monto);

      const nuevoSaldo = await this.cuentaRepo.acreditar(client, rut, puntos);

      const mov = new Movimiento({ rut, tipo: 'COMPRA', monto: Number(monto), puntos, fecha: new Date() });
      await this.movimientoRepo.crear(client, mov);

      await client.query('COMMIT');
      return { nuevoSaldo, puntos };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async canjear(rut, productoId) {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const cuenta = await this.cuentaRepo.findByRut(client, rut, { forUpdate: true });
      if (!cuenta) { const err = new Error('Cuenta no encontrada'); err.code='CUENTA_NO_ENCONTRADA'; throw err; }

      const producto = await this.productoRepo.findById(client, Number(productoId));
      if (!producto) { const err = new Error('Producto no encontrado o inactivo'); err.code='PRODUCTO_NO_ENCONTRADO'; throw err; }

      const costo = producto.getCostoEnPuntos();
      // aplicar regla de negocio sobre el dominio
      cuenta.debitar(costo);

      const nuevoSaldo = await this.cuentaRepo.actualizarSaldo(client, rut, cuenta.saldo);

      const mov = new Movimiento({ rut, tipo: 'CANJE', monto: 0, puntos: -costo, fecha: new Date() });
      await this.movimientoRepo.crear(client, mov);

      await client.query('COMMIT');
      return { nuevoSaldo, canje: { productoId: producto.id, nombre: producto.nombre, costo } };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async obtenerHistorial(rut, page = 1, limit = 10) {
    return this.movimientoRepo.findByRutPaginated(rut, { page, limit });
  }
}

module.exports = PuntosService;

