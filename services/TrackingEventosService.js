class TrackingEventosService {
  constructor({ repository }) {
    this.repository = repository;
  }

  normalizeEventType(value) {
    if (!value) return null;
    const normalized = String(value).trim().toLowerCase();
    if (['view', 'click', 'conversion'].includes(normalized)) {
      return normalized;
    }
    if (normalized === 'select' || normalized === 'seleccion' || normalized === 'select_product') {
      return 'click';
    }
    if (normalized === 'redeem' || normalized === 'redeem_product' || normalized === 'canje') {
      return 'conversion';
    }
    return null;
  }

  async registrarEvento(payload = {}, options = {}) {
    const tipoEvento = this.normalizeEventType(payload.eventType || payload.tipo_evento);
    if (!tipoEvento) {
      throw new Error('Tipo de evento inválido');
    }

    const productoId = payload.productoId ? Number(payload.productoId) : null;
    const objectId = payload.objectId || payload.algoliaObjectId || (productoId ? String(productoId) : null);
    if (!productoId && !objectId) {
      throw new Error('Falta productoId/objectID para el evento');
    }

    const evento = {
      usuarioId: payload.usuarioId ? Number(payload.usuarioId) : null,
      rut: payload.rut ? String(payload.rut) : null,
      userToken: payload.userToken ? String(payload.userToken) : null,
      productoId,
      objectId,
      tipoEvento,
      source: payload.source || payload.origen || null,
      metadata: payload.metadata || null,
      ocurridoEn: payload.timestamp ? Number(payload.timestamp) : null,
      enviadoAlgolia: payload.enviadoAlgolia === true
    };

    try {
      await this.repository.insert(evento, options.client);
      return { success: true };
    } catch (error) {
      console.error('[TrackingEventosService] Error al registrar evento:', error.message);
      throw error;
    }
  }
}

module.exports = TrackingEventosService;
