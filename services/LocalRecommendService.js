const { query } = require('../config/database');

class LocalRecommendService {
  constructor(db = { query }) {
    this.db = db;
    this.schemaPromise = null;
  }

  async getSchema() {
    if (!this.schemaPromise) {
      this.schemaPromise = (async () => {
        try {
          const sql = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'productos'
          `;
          const { rows } = await this.db.query(sql);
          const cols = rows.map((r) => r.column_name);
          const has = (name) => cols.includes(name);
          return {
            hasCategory: has('category'),
            hasDescription: has('descripcion'),
            hasImage: has('image_url'),
            hasStock: has('stock')
          };
        } catch (error) {
          console.warn('[LocalRecommendService] No fue posible detectar columnas opcionales:', error.message);
          return {
            hasCategory: false,
            hasDescription: false,
            hasImage: false,
            hasStock: false
          };
        }
      })();
    }
    return this.schemaPromise;
  }

  async getLastUserInteraction(userToken) {
    if (!userToken) return null;
    const { hasCategory } = await this.getSchema();
    const categorySelect = hasCategory ? 'p.category AS category' : 'NULL::text AS category';
    const groupByCategory = hasCategory ? ', p.category' : '';
    const sql = `
      SELECT
        t.producto_id,
        ${categorySelect},
        MAX(t.ocurrido_en) AS last_click
      FROM tracking_eventos t
      JOIN productos p ON p.id = t.producto_id
      WHERE t.user_token = $1
        AND t.tipo_evento = 'click'
      GROUP BY t.producto_id${groupByCategory}
      ORDER BY last_click DESC
      LIMIT 1
    `;
    const { rows } = await this.db.query(sql, [userToken]);
    return rows[0] || null;
  }

  async getTopProducts({ category = null, excludeId = null, limit = 8 }) {
    const { hasCategory, hasDescription, hasImage, hasStock } = await this.getSchema();

    const baseParams = [];
    const baseWhere = ['p.activo = TRUE'];
    if (hasCategory && category) {
      baseParams.push(category);
      baseWhere.push(`p.category = $${baseParams.length}`);
    }
    if (excludeId) {
      baseParams.push(excludeId);
      baseWhere.push(`p.id <> $${baseParams.length}`);
    }

    const categorySelect = hasCategory ? 'p.category AS category' : 'NULL::text AS category';
    const descriptionSelect = hasDescription ? 'p.descripcion AS description' : 'NULL::text AS description';
    const imageSelect = hasImage ? 'p.image_url AS image' : 'NULL::text AS image';

    const runQuery = async ({ enforceStock = true, take = limit }) => {
      const params = [...baseParams];
      const whereParts = [...baseWhere];
      if (hasStock && enforceStock) {
        whereParts.push('(p.stock IS NULL OR p.stock > 0)');
      }
      const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
      const limitParam = params.length + 1;
      params.push(take);

      const sql = `
        WITH stats AS (
          SELECT
            producto_id,
            COUNT(*) AS clicks,
            MAX(ocurrido_en) AS last_click
          FROM tracking_eventos
          WHERE tipo_evento = 'click'
          GROUP BY producto_id
        )
        SELECT
          p.id,
          p.nombre,
          ${descriptionSelect},
          p.puntos_requeridos AS price,
          ${imageSelect},
          ${categorySelect},
          COALESCE(s.clicks, 0) AS clicks,
          s.last_click
        FROM productos p
        LEFT JOIN stats s ON s.producto_id = p.id
        ${whereSql}
        ORDER BY
          COALESCE(s.clicks, 0) DESC,
          s.last_click DESC NULLS LAST,
          p.nombre ASC
        LIMIT $${limitParam}
      `;
      const { rows } = await this.db.query(sql, params);
      return rows;
    };

    const mapRows = (rows) =>
      rows.map((row) => ({
        objectID: String(row.id),
        id: row.id,
        name: row.nombre,
        description: row.description,
        price: row.price,
        image: row.image,
        category: row.category || null,
        clicks: Number(row.clicks || 0),
        lastClick: row.last_click
      }));

    let items = mapRows(await runQuery({ enforceStock: true, take: limit }));

    if (hasStock && items.length < limit) {
      const relaxedRows = await runQuery({ enforceStock: false, take: limit * 2 });
      const seen = new Set(items.map((it) => it.id));
      for (const row of mapRows(relaxedRows)) {
        if (seen.has(row.id)) continue;
        items.push(row);
        seen.add(row.id);
        if (items.length >= limit) break;
      }
    }

    return items.slice(0, limit);
  }

  async getRecommendations({ userToken, limit = 8 }) {
    const last = await this.getLastUserInteraction(userToken);
    if (last && last.category) {
      const hits = await this.getTopProducts({
        category: last.category,
        excludeId: last.producto_id,
        limit
      });
      if (hits.length) {
        return {
          source: 'category_history',
          context: { category: last.category, lastProduct: last.producto_id },
          hits
        };
      }
    }

    const fallbackHits = await this.getTopProducts({ limit, excludeId: last?.producto_id || null });
    return {
      source: 'global_popular',
      context: last ? { lastProduct: last.producto_id } : null,
      hits: fallbackHits
    };
  }
}

module.exports = LocalRecommendService;
