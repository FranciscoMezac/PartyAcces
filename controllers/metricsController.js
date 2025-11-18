const BaseController = require('./BaseController');

class MetricsController extends BaseController {
  constructor(metricsService) {
    super();
    this.metricsService = metricsService;
  }

  async overview(req, res) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const rangeDays = Number(urlObj.searchParams.get('rangeDays')) || 7;
      const qrHours = Number(urlObj.searchParams.get('qrHours')) || 24;
      const data = await this.metricsService.getDashboardMetrics({ rangeDays, qrHours });
      return this.sendSuccess(res, { data });
    } catch (error) {
      return this.handleError(res, error, 'obtención de métricas');
    }
  }
}

module.exports = MetricsController;
