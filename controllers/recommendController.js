const LocalRecommendService = require('../services/LocalRecommendService');
const RecommendCFService = require('../services/RecommendCFService');
const db = require('../config/database');

class RecommendController {
  constructor() {
    this.localService = new LocalRecommendService();
    this.cfService = new RecommendCFService();
    this.localForUser = this.localForUser.bind(this);
    this.collaborativeForUser = this.collaborativeForUser.bind(this);
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

  async collaborativeForUser(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const userToken = (url.searchParams.get('userToken') || req.headers['x-user-token'] || 'guest').toString();
      const limit = Number(url.searchParams.get('limit') || 8);
      const reload = url.searchParams.get('reload') === '1';

      const rawHits = await this.cfService.recommendForUser(userToken, { forceReload: reload });
      let hits = [];

      const columnExists = async (column) => {
        const q = await db.query(
          `SELECT 1
             FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'productos'
              AND column_name = $1
            LIMIT 1`,
          [column]
        );
        return q.rowCount > 0;
      };

      if (rawHits.length) {
        const ids = rawHits.map((item) => Number(item.key)).filter((id) => Number.isFinite(id));
        if (ids.length) {
          const hasDescripcion = await columnExists('descripcion');
          const hasImage = await columnExists('image');
          const hasImageUrl = !hasImage && await columnExists('image_url');
          const imageColumn = hasImage ? 'image' : (hasImageUrl ? 'image_url' : null);
          const fields = [
            '"objectID"::text AS "objectID"',
            'name',
            hasDescripcion ? 'descripcion' : "NULL::text AS descripcion",
            'price',
            imageColumn ? `${imageColumn} AS image` : "NULL::text AS image"
          ].join(',\n                ');

          const { rows } = await db.query(
            `
              SELECT
                ${fields}
              FROM productos
              WHERE "objectID" = ANY($1::int[])
            `,
            [ids]
          );
          const map = new Map(rows.map((row) => [Number(row.objectID), row]));
          hits = rawHits
            .map((item) => {
              const details = map.get(Number(item.key));
              if (!details) return null;
              return {
                ...details,
                similarity: item.similarity
              };
            })
            .filter(Boolean)
            .slice(0, limit);
        }
      }

      if (!hits.length) {
        const fallback = await this.localService.getRecommendations({ userToken, limit });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          userToken,
          source: 'local_fallback',
          hits: fallback?.hits || [],
          context: fallback?.context || null
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, userToken, source: 'collaborative', hits }));
    } catch (error) {
      console.error('[RecommendController] collaborativeForUser:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No fue posible obtener recomendaciones colaborativas' }));
    }
  }
}

module.exports = RecommendController;


