const { Recommend } = require('recommend');
const db = require('../config/database');

class RecommendCFService {
  constructor(options = {}) {
    this.options = {
      limit: Number(options.limit) || 8
    };
    this.dataSet = {};
    this.engine = null;
    this.loadingPromise = null;
  }

  async buildEngine() {
    const sql = `
      SELECT
        user_token AS token,
        producto_id::text AS item,
        COUNT(*)::int AS score
      FROM tracking_eventos
      WHERE user_token IS NOT NULL
        AND producto_id IS NOT NULL
        AND tipo_evento IN ('view', 'click', 'conversion')
      GROUP BY user_token, producto_id
    `;

    const { rows } = await db.query(sql);
    const dataSet = {};
    for (const row of rows) {
      if (!dataSet[row.token]) {
        dataSet[row.token] = {};
      }
      dataSet[row.token][row.item] = row.score;
    }

    this.dataSet = dataSet;
    this.engine = Object.keys(dataSet).length
      ? new Recommend(dataSet, {
          recommendationsCount: this.options.limit,
          recommendedItemsCount: this.options.limit
        })
      : null;

    return this.engine;
  }

  async ensureEngine(force = false) {
    if (!this.loadingPromise || force) {
      this.loadingPromise = this.buildEngine()
        .catch((err) => {
          this.loadingPromise = null;
          throw err;
        });
    }
    await this.loadingPromise;
    return this.engine;
  }

  async recommendForUser(userToken, { forceReload = false } = {}) {
    if (!userToken) return [];
    await this.ensureEngine(forceReload);

    if (!this.engine) return [];
    if (!this.dataSet[userToken]) {
      await this.ensureEngine(true);
      if (!this.engine || !this.dataSet[userToken]) return [];
    }

    return new Promise((resolve, reject) => {
      this.engine.getRecommendations(userToken, (err, result) => {
        if (err) return reject(err);
        resolve(Array.isArray(result) ? result : []);
      });
    });
  }
}

module.exports = RecommendCFService;
