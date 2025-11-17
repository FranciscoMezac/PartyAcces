class MetricsRepository {
  constructor(db) {
    this.db = db;
  }

  async fetchKpis({ from, to }) {
    const sql = `
      WITH movimientos_window AS (
        SELECT
          COALESCE(SUM(CASE WHEN puntos > 0 THEN puntos ELSE 0 END), 0) AS puntos_emitidos,
          COALESCE(SUM(CASE WHEN puntos < 0 THEN ABS(puntos) ELSE 0 END), 0) AS puntos_canjeados
        FROM movimientos
        WHERE fecha >= $1 AND fecha < $2
      ),
      funnel_window AS (
        SELECT
          COALESCE(COUNT(*) FILTER (WHERE tipo_evento = 'view'), 0) AS views,
          COALESCE(COUNT(*) FILTER (WHERE tipo_evento = 'click'), 0) AS clicks,
          COALESCE(COUNT(*) FILTER (WHERE tipo_evento = 'conversion'), 0) AS conversions
        FROM tracking_eventos
        WHERE ocurrido_en >= $1 AND ocurrido_en < $2
      ),
      accesos_hoy AS (
        SELECT
          COALESCE(COUNT(*) FILTER (WHERE tipo_acceso = 'INGRESO'), 0)::int AS ingresos_hoy,
          COALESCE(COUNT(*) FILTER (WHERE tipo_acceso = 'SALIDA'), 0)::int AS salidas_hoy
        FROM acceso
        WHERE DATE(fecha_hora AT TIME ZONE 'America/Santiago') = (NOW() AT TIME ZONE 'America/Santiago')::date
      )
      SELECT
        (SELECT COUNT(*)::int FROM usuario) AS total_users,
        (SELECT COUNT(*)::int FROM usuario WHERE estado = 'ACTIVO') AS active_users,
        movimientos_window.puntos_emitidos,
        movimientos_window.puntos_canjeados,
        accesos_hoy.ingresos_hoy,
        accesos_hoy.salidas_hoy,
        funnel_window.views,
        funnel_window.clicks,
        funnel_window.conversions
      FROM movimientos_window, funnel_window, accesos_hoy
    `;
    const { rows } = await this.db.query(sql, [from, to]);
    return rows[0] || {};
  }

  async fetchPointsSeries({ from, to }) {
    const sql = `
      SELECT
        DATE(fecha) AS dia,
        COALESCE(SUM(CASE WHEN puntos > 0 THEN puntos ELSE 0 END), 0)::int AS emitidos,
        COALESCE(SUM(CASE WHEN puntos < 0 THEN ABS(puntos) ELSE 0 END), 0)::int AS canjeados
      FROM movimientos
      WHERE fecha >= $1 AND fecha < $2
      GROUP BY dia
      ORDER BY dia ASC
    `;
    const { rows } = await this.db.query(sql, [from, to]);
    return rows;
  }

  async fetchFunnelSeries({ from, to }) {
    const sql = `
      SELECT
        DATE(ocurrido_en) AS dia,
        COALESCE(COUNT(*) FILTER (WHERE tipo_evento = 'view'), 0)::int AS views,
        COALESCE(COUNT(*) FILTER (WHERE tipo_evento = 'click'), 0)::int AS clicks,
        COALESCE(COUNT(*) FILTER (WHERE tipo_evento = 'conversion'), 0)::int AS conversions
      FROM tracking_eventos
      WHERE ocurrido_en >= $1 AND ocurrido_en < $2
      GROUP BY dia
      ORDER BY dia ASC
    `;
    const { rows } = await this.db.query(sql, [from, to]);
    return rows;
  }

  async fetchQrActivity({ from, to }) {
    const sql = `
      SELECT
        DATE_TRUNC('hour', fecha_hora AT TIME ZONE 'America/Santiago') AS bucket,
        COALESCE(COUNT(*) FILTER (WHERE tipo_acceso = 'INGRESO'), 0)::int AS ingresos,
        COALESCE(COUNT(*) FILTER (WHERE tipo_acceso = 'SALIDA'), 0)::int AS salidas
      FROM acceso
      WHERE fecha_hora >= $1 AND fecha_hora < $2
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
    const { rows } = await this.db.query(sql, [from, to]);
    return rows;
  }

  async fetchTopProducts({ from, to, limit = 5 }) {
    const sql = `
      SELECT
        te.producto_id AS product_id,
        COALESCE(p.nombre, CONCAT('Producto #', te.producto_id)) AS name,
        COALESCE(SUM(CASE WHEN te.tipo_evento = 'view' THEN 1 ELSE 0 END), 0)::int AS views,
        COALESCE(SUM(CASE WHEN te.tipo_evento = 'click' THEN 1 ELSE 0 END), 0)::int AS clicks,
        COALESCE(SUM(CASE WHEN te.tipo_evento = 'conversion' THEN 1 ELSE 0 END), 0)::int AS conversions
      FROM tracking_eventos te
      LEFT JOIN productos p ON p.id = te.producto_id
      WHERE te.producto_id IS NOT NULL
        AND te.ocurrido_en >= $1 AND te.ocurrido_en < $2
      GROUP BY te.producto_id, p.nombre
      ORDER BY conversions DESC, clicks DESC
      LIMIT $3
    `;
    const { rows } = await this.db.query(sql, [from, to, limit]);
    return rows;
  }
}

module.exports = MetricsRepository;
