const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

class MetricsService {
  constructor({ repository, cacheTtlMs = 15000 }) {
    this.repository = repository;
    this.cacheTtlMs = cacheTtlMs;
    this.cache = { expires: 0, data: null, lastKey: null };
  }

  async getDashboardMetrics({ rangeDays = 7, qrHours = 24 } = {}) {
    const cacheKey = `${rangeDays}:${qrHours}`;
    if (this.cacheTtlMs > 0 && this.cache.lastKey === cacheKey && Date.now() < this.cache.expires) {
      return this.cache.data;
    }

    const now = new Date();
    const from = new Date(now.getTime() - rangeDays * DAY_MS);
    const qrFrom = new Date(now.getTime() - qrHours * HOUR_MS);

    const [
      kpisRaw,
      pointsSeriesRaw,
      funnelSeriesRaw,
      qrActivityRaw,
      topProductsRaw
    ] = await Promise.all([
      this.repository.fetchKpis({ from, to: now }),
      this.repository.fetchPointsSeries({ from, to: now }),
      this.repository.fetchFunnelSeries({ from, to: now }),
      this.repository.fetchQrActivity({ from: qrFrom, to: now }),
      this.repository.fetchTopProducts({ from, to: now, limit: 5 })
    ]);

    const kpis = this.formatKpis(kpisRaw);
    const pointsSeries = this.fillDailySeries(pointsSeriesRaw, rangeDays, ['emitidos', 'canjeados']);
    const funnelSeries = this.fillDailySeries(funnelSeriesRaw, rangeDays, ['views', 'clicks', 'conversions']);
    const qrSeries = this.fillHourlySeries(qrActivityRaw, qrHours);
    const topProducts = topProductsRaw.map((row) => ({
      productId: row.product_id,
      name: row.name,
      views: Number(row.views || 0),
      clicks: Number(row.clicks || 0),
      conversions: Number(row.conversions || 0)
    }));

    const payload = {
      generatedAt: now.toISOString(),
      rangeDays,
      kpis,
      charts: {
        points: pointsSeries,
        funnel: funnelSeries,
        qr: qrSeries
      },
      tables: {
        topProducts
      }
    };

    if (this.cacheTtlMs > 0) {
      this.cache = {
        data: payload,
        expires: Date.now() + this.cacheTtlMs,
        lastKey: cacheKey
      };
    }

    return payload;
  }

  formatKpis(row = {}) {
    const views = Number(row.views || 0);
    const clicks = Number(row.clicks || 0);
    const conversions = Number(row.conversions || 0);
    const ctr = clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0;

    return {
      totalUsers: Number(row.total_users || 0),
      activeUsers: Number(row.active_users || 0),
      pointsIssued: Number(row.puntos_emitidos || 0),
      pointsRedeemed: Number(row.puntos_canjeados || 0),
      ingresosHoy: Number(row.ingresos_hoy || 0),
      salidasHoy: Number(row.salidas_hoy || 0),
      funnel: {
        views,
        clicks,
        conversions,
        ctr
      }
    };
  }

  fillDailySeries(rows, days, keys) {
    const map = new Map();
    rows.forEach((row) => {
      const label = this.formatDate(row.dia || row.day || row.fecha);
      if (!label) return;
      map.set(label, row);
    });

    const series = [];
    const today = this.clearTime(new Date());
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * DAY_MS);
      const label = this.formatDate(date);
      const row = map.get(label) || {};
      const point = { date: label };
      keys.forEach((k) => { point[k] = Number(row[k] || 0); });
      series.push(point);
    }
    return series;
  }

  fillHourlySeries(rows, hours) {
    const map = new Map();
    rows.forEach((row) => {
      const isoBucket = row.bucket ? new Date(row.bucket) : null;
      if (!isoBucket || Number.isNaN(isoBucket.getTime())) return;
      const key = isoBucket.toISOString();
      map.set(key, {
        ingresos: Number(row.ingresos || 0),
        salidas: Number(row.salidas || 0),
        raw: isoBucket
      });
    });

    const series = [];
    const now = new Date();
    const rounded = new Date(Math.floor(now.getTime() / HOUR_MS) * HOUR_MS);
    for (let i = hours - 1; i >= 0; i--) {
      const bucketDate = new Date(rounded.getTime() - i * HOUR_MS);
      const key = bucketDate.toISOString();
      const entry = map.get(key);
      series.push({
        hour: this.formatHour(bucketDate),
        ingresos: entry ? entry.ingresos : 0,
        salidas: entry ? entry.salidas : 0
      });
    }
    return series;
  }

  formatDate(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatHour(date) {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  clearTime(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

module.exports = MetricsService;
