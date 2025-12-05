class AlgoliaRecommendController {
    constructor(service) {
        this.service = service;
    }

    async lookingSimilar(req, res) {
        try {
            const result = await this.service.fetchLookingSimilar(req);
            if (!result.ok) {
                const status = result.status || 500;
                res.writeHead(status, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: result.error || 'Error desconocido' }));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
    }
}

module.exports = AlgoliaRecommendController;
