const TrackingEvento = require('../models/TrackingEvento');

class TrackingEventosService {
  constructor({ repository }) {
    this.repository = repository;
  }

  /**
   * Registra un evento de tracking usando un objeto TrackingEvento
   * @param {Object|TrackingEvento} payload - Datos del evento o instancia de TrackingEvento
   * @param {Object} options - Opciones adicionales (ej: client para transacciones)
   * @returns {Promise<TrackingEvento>} El evento registrado con su ID
   */
  async registrarEvento(payload = {}, options = {}) {
    // Crear instancia de TrackingEvento (si no lo es ya)
    const evento = payload instanceof TrackingEvento
      ? payload
      : new TrackingEvento(payload);

    // Validar el evento usando el método del objeto
    evento.validar();

    try {
      // Insertar usando el repositorio
      const resultado = await this.repository.insert(evento, options.client);
      evento.id = resultado.id;

      // Enviar a Algolia de forma asíncrona (no bloqueante)
      this.sendToAlgolia(evento).catch((err) => {
        console.warn('[TrackingEventosService] No se pudo enviar a Algolia:', err.message);
      });

      return evento;
    } catch (error) {
      console.error('[TrackingEventosService] Error al registrar evento:', error.message);
      throw error;
    }
  }

  /**
   * Envía el evento a Algolia Insights API
   * @param {TrackingEvento} evento - Instancia del evento a enviar
   */
  async sendToAlgolia(evento) {
    const appId = process.env.ALGOLIA_APP_ID;
    const insightsKey = process.env.ALGOLIA_INSIGHTS_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_PRODUCTS;
    if (!appId || !insightsKey || !indexName) {
      return;
    }

    // Usar el método del objeto para obtener el formato Algolia
    const apiEvent = evento.toAlgoliaEvent(indexName);

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
