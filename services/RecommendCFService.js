const { Recommend } = require('recommend'); //Libreria de recomendación colaborativa
const TrackingEvento = require('../models/TrackingEvento');
const Producto = require('../models/Producto');

/**
 * RecommendCFService - Capa de Servicio
 * 
 * Patrón de diseño: Service Layer Pattern + Active Record
 * - El servicio COORDINA operaciones, NO accede directamente a la BD
 * - El servicio USA métodos de instancia del MODELO
 * - El repositorio se inyecta en el constructor
 * 
 * Flujo: Controller -> Service -> Model -> Repository -> DB
 */
class RecommendCFService {
  #trackingRepository;
  #productoRepository;
  #dataSet;
  #engine;
  #loadingPromise;

  constructor({ trackingRepository, productoRepository, limit = 8 }) {
    if (!trackingRepository) {
      throw new Error('trackingRepository es requerido en RecommendCFService');
    }
    if (!productoRepository) {
      throw new Error('productoRepository es requerido en RecommendCFService');
    }
    this.#trackingRepository = trackingRepository;
    this.#productoRepository = productoRepository;
    this.options = { limit: Number(limit) };
    this.#dataSet = {};
    this.#engine = null;
    this.#loadingPromise = null;
  }

  async buildEngine() {
    // Crear instancia de TrackingEvento con repositorio inyectado
    const trackingEvento = new TrackingEvento({}, this.#trackingRepository);
    // Servicio usa método de instancia del MODELO
    this.#dataSet = await trackingEvento.obtenerDatasetColaborativo();

    this.#engine = Object.keys(this.#dataSet).length
      ? new Recommend(this.#dataSet, {
          recommendationsCount: this.options.limit,
          recommendedItemsCount: this.options.limit
        })
      : null;

    return this.#engine;
  }

  async ensureEngine(force = false) {
    if (!this.#loadingPromise || force) {
      this.#loadingPromise = this.buildEngine()
        .catch((err) => {
          this.#loadingPromise = null;
          throw err;
        });
    }
    await this.#loadingPromise;
    return this.#engine;
  }

  async recommendForUser(userToken, { forceReload = false, limit = 8 } = {}) {
    if (!userToken) return [];
    await this.ensureEngine(forceReload);

    if (!this.#engine) return [];
    if (!this.#dataSet[userToken]) {
      await this.ensureEngine(true);
      if (!this.#engine || !this.#dataSet[userToken]) return [];
    }

    const rawHits = await new Promise((resolve, reject) => {
      this.#engine.getRecommendations(userToken, (err, result) => {
        if (err) return reject(err);
        resolve(Array.isArray(result) ? result : []);
      });
    });

    if (!rawHits.length) return [];

    // Extraer IDs de los rawHits
    const ids = rawHits.map((item) => Number(item.key)).filter((id) => Number.isFinite(id));
    if (!ids.length) return [];

    // Crear instancia de Producto con repositorio inyectado
    const producto = new Producto({ id: 0, nombre: '', puntosRequeridos: 0 }, this.#productoRepository);
    // Usar método de instancia del Modelo para obtener productos enriquecidos
    const productos = await producto.buscarPorIds(ids);

    // Combinar rawHits con detalles de productos
    const map = new Map(productos.map((p) => [Number(p.id), p]));
    const hits = rawHits
      .map((item) => {
        const producto = map.get(Number(item.key));
        if (!producto) return null;
        return {
          ...producto.toJSON(),
          similarity: item.similarity
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    return hits;
  }
}

module.exports = RecommendCFService;
