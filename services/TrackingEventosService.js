const TrackingEvento = require('../models/TrackingEvento');

/**
 * TrackingEventosService - Capa de Servicio
 * 
 * Patrón de diseño: Service Layer Pattern + Active Record
 * - El servicio COORDINA operaciones, NO accede directamente al repositorio
 * - El servicio USA métodos del MODELO (evento.guardar())
 * - El modelo conoce su repositorio y se persiste a sí mismo
 * 
 * Flujo: Controller -> Service -> Model -> Repository -> DB
 */
class TrackingEventosService {
  #repository;

  constructor({ repository }) {
    this.#repository = repository;
  }

  /**
   * Registra un evento de tracking usando el patrón Active Record
   * El servicio crea el modelo con su repositorio inyectado, y el modelo se guarda a sí mismo.
   * @param {Object} payload - Datos del evento
   * @param {Object} options - Opciones adicionales (ej: client para transacciones)
   * @returns {Promise<TrackingEvento>} El evento registrado con su ID
   */
  async registrarEvento(payload = {}, options = {}) {
    // Crear instancia de TrackingEvento con repositorio inyectado (Active Record Pattern)
    const evento = new TrackingEvento(payload, this.#repository);

    // El MODELO se guarda a sí mismo (incluye validación interna)
    await evento.guardar(options.client);

    // Enviar a Algolia de forma asíncrona (no bloqueante)
    this.#enviarAlgoliaAsync(evento);

    return evento;
  }

  /**
   * Envía el evento a Algolia de forma asíncrona (fire-and-forget)
   * @private
   * @param {TrackingEvento} evento - Instancia del evento a enviar
   */
  #enviarAlgoliaAsync(evento) {
    this.sendToAlgolia(evento).catch((err) => {
      console.warn('[TrackingEventosService] No se pudo enviar a Algolia:', err.message);
    });
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
