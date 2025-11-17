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
      ocurridoEn: payload.timestamp ? Number(payload.timestamp) : Date.now(),
      enviadoAlgolia: false
    };

    try {
      await this.repository.insert(evento, options.client);
      this.sendToAlgolia(evento).catch((err) => {
        console.warn('[TrackingEventosService] No se pudo enviar a Algolia:', err.message);
      });
      return { success: true };
    } catch (error) {
      console.error('[TrackingEventosService] Error al registrar evento:', error.message);
      throw error;
    }
  }

  async sendToAlgolia(evento) {
    const appId = process.env.ALGOLIA_APP_ID;
    const insightsKey = process.env.ALGOLIA_INSIGHTS_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_PRODUCTS;
    if (!appId || !insightsKey || !indexName) {
      return;
    }

    const apiEvent = {
      eventType: evento.tipoEvento === 'view'
        ? 'view'
        : evento.tipoEvento === 'conversion'
          ? 'conversion'
          : 'click',
      eventName: evento.tipoEvento === 'view'
        ? 'Producto visto'
        : evento.tipoEvento === 'conversion'
          ? 'Producto canjeado'
          : 'Producto seleccionado',
      index: indexName,
      userToken: evento.userToken || `anon_${evento.rut || 'guest'}`,
      objectIDs: [evento.objectId],
      timestamp: evento.ocurridoEn || Date.now()
    };

    const response = await fetch('https://insights.algolia.io/1/events', {
      method: 'POST',
      headers: {
        'x-algolia-application-id': appId,
        'x-algolia-api-key': insightsKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ events: [apiEvent] })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Algolia Insights respondió ${response.status}: ${text}`);
    }
  }
}

module.exports = TrackingEventosService;
