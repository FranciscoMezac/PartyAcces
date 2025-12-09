const BaseController = require('./BaseController');
const db = require('../config/database');
const TrackingEventosRepository = require('../repositories/TrackingEventosRepository');
const TrackingEventosService = require('../services/TrackingEventosService');

class TrackingController extends BaseController {
  constructor() {
    super();
    const repository = new TrackingEventosRepository(db);
    this.service = new TrackingEventosService({ repository });
    this.registrar = this.registrar.bind(this);
  }

  async registrar(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return this.sendError(res, 'El body de la petición está vacío', 400);
      }
      
      // El servicio ahora devuelve el objeto TrackingEvento registrado
      const eventoRegistrado = await this.service.registrarEvento(req.body);
      
      return this.sendSuccess(res, { 
        message: 'Evento registrado',
        eventoId: eventoRegistrado.id,
        tipoEvento: eventoRegistrado.tipoEvento
      }, 201);
    } catch (error) {
      const msg = error && error.message ? error.message : 'No fue posible registrar el evento';
      const status = msg.includes('Falta producto') || msg.includes('Tipo de evento') || msg.includes('inválido') ? 400 : 500;
      return this.sendError(res, msg, status);
    }
  }
}

module.exports = TrackingController;
