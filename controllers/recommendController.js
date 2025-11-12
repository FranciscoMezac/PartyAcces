const LocalRecommendService = require('../services/LocalRecommendService');

class RecommendController {
  constructor() {
    this.localService = new LocalRecommendService();
    this.localForUser = this.localForUser.bind(this);
  }

  async localForUser(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const userToken = (url.searchParams.get('userToken') || req.headers['x-user-token'] || 'guest').toString();
      const limit = Number(url.searchParams.get('limit') || 8);
      const data = await this.localService.getRecommendations({ userToken, limit });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, userToken, ...data }));
    } catch (error) {
      console.error('[RecommendController] localForUser:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No fue posible obtener recomendaciones locales' }));
    }
  }
}

module.exports = RecommendController;
