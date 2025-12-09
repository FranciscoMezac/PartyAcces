const BaseController = require('./BaseController');

/**
 * RecommendController - Capa de Controlador
 * 
 * Patrón: Dependency Injection
 * - Los servicios se inyectan en el constructor
 * - El controller NO accede directamente a la BD
 * - El controller NO instancia sus propias dependencias
 * - El controller NO accede directamente a repositorios
 * 
 * Flujo: Router -> Controller -> Service -> Model -> Repository -> DB
 */
class RecommendController extends BaseController {
  #localService;
  #cfService;

  constructor(localService, cfService) {
    super();
    this.#localService = localService;
    this.#cfService = cfService;
    this.localForUser = this.localForUser.bind(this);
    this.collaborativeForUser = this.collaborativeForUser.bind(this);
  }

  async localForUser(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const userToken = (url.searchParams.get('userToken') || req.headers['x-user-token'] || 'guest').toString();
      const limit = Number(url.searchParams.get('limit') || 8);
      const data = await this.#localService.getRecommendations({ userToken, limit });
      
      return this.sendSuccess(res, { userToken, ...data });
    } catch (error) {
      console.error('[RecommendController] localForUser:', error.message);
      return this.sendError(res, 'No fue posible obtener recomendaciones locales', 500);
    }
  }

  async collaborativeForUser(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const userToken = (url.searchParams.get('userToken') || req.headers['x-user-token'] || 'guest').toString();
      const limit = Number(url.searchParams.get('limit') || 8);
      const reload = url.searchParams.get('reload') === '1';

      // Obtener recomendaciones enriquecidas del servicio
      const hits = await this.#cfService.recommendForUser(userToken, { forceReload: reload, limit });

      // Fallback a recomendaciones locales si no hay resultados
      if (!hits.length) {
        const fallback = await this.#localService.getRecommendations({ userToken, limit });
        return this.sendSuccess(res, {
          userToken,
          source: 'local_fallback',
          hits: fallback?.hits || [],
          context: fallback?.context || null
        });
      }

      return this.sendSuccess(res, { userToken, source: 'collaborative', hits });
    } catch (error) {
      console.error('[RecommendController] collaborativeForUser:', error.message);
      return this.sendError(res, 'No fue posible obtener recomendaciones colaborativas', 500);
    }
  }
}

module.exports = RecommendController;


