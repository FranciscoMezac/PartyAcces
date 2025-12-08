const url = require('url');

class AlgoliaRecommendService {
    constructor({ appId, apiKey, indexName, db }) {
        this.appId = appId;
        this.apiKey = apiKey;
        this.defaultIndex = indexName;
        this.db = db;
        this.hosts = [
            `${appId}-dsn.algolianet.com`,
            `${appId}-dsn.algolia.net`,
            `${appId}-1.algolianet.com`,
            `${appId}-2.algolianet.com`,
            `${appId}-3.algolianet.com`
        ];
    }

    /**
     * Ejecuta recomendación looking-similar con fallback a related-products y BD.
     * Retorna { ok, hits, usedThreshold, thresholdTried, fallbackModel?, host?, indexName, objectID }.
     */
    async fetchLookingSimilar(req) {
        const parsed = url.parse(req.url, true);
        const indexName = (parsed.query.index || this.defaultIndex || '').toString();
        const objectID = (parsed.query.objectID || '').toString();
        const baseThreshold = Number(parsed.query.threshold ?? 70);
        const category = parsed.query.category ? String(parsed.query.category) : null;
        const nofilters = parsed.query.nofilters === '1';

        if (!this.appId || !this.apiKey || !indexName || !objectID) {
            return { ok: false, status: 400, error: 'Parámetros requeridos: objectID e índice; y variables ALGOLIA_*' };
        }

        const thresholds = [baseThreshold, 50, 30, 10].filter((v, i, self) => Number.isFinite(v) && self.indexOf(v) === i);

        let final = null;
        for (const th of thresholds) {
            // probar varios hosts para cada threshold
            let success = null;
            for (const host of this.hosts) {
                const reqPayload = this.buildRequestPayload({
                    indexName,
                    objectID,
                    model: 'looking-similar',
                    threshold: th,
                    category,
                    nofilters
                });
                success = await this.tryHost(host, reqPayload);
                if (success) break;
            }
            if (success) {
                const hits = success.json?.results?.[0]?.hits ?? [];
                if (hits.length > 0) {
                    final = { threshold: th, host: success.host, hits };
                    break;
                } else {
                    final = final || { threshold: th, host: success.host, hits: [] };
                }
            }
        }

        if (!final) {
            return { ok: false, status: 502, error: 'No se pudo contactar a Algolia Recommend' };
        }

        // Fallback: related-products si no hubo hits
        if (!final.hits || final.hits.length === 0) {
            let rpHits = await this.fetchRelatedProducts({ indexName, objectID, category, nofilters });

            // Fallback final: BD
            if (!rpHits.length) {
                rpHits = await this.fetchDbFallback({ category, limit: 8 });
            }

            return {
                ok: true,
                indexName,
                objectID,
                thresholdTried: thresholds,
                usedThreshold: final.threshold,
                fallbackModel: 'related-products|db',
                hits: rpHits
            };
        }

        return {
            ok: true,
            indexName,
            objectID,
            thresholdTried: thresholds,
            usedThreshold: final.threshold,
            hits: final.hits
        };
    }

    buildRequestPayload({ indexName, objectID, model, threshold, category, nofilters }) {
        const payload = {
            indexName,
            objectID,
            model,
            maxRecommendations: 8
        };
        if (typeof threshold === 'number') payload.threshold = threshold;
        if (!nofilters) {
            payload.queryParameters = { optionalFilters: ['activo:true', 'stock>0'] };
            if (category) {
                payload.queryParameters.facetFilters = [[`category:${category}`]];
            }
        }
        return payload;
    }

    async tryHost(host, payload) {
        try {
            const r = await fetch(`https://${host}/1/indexes/*/recommendations`, {
                method: 'POST',
                headers: {
                    'x-algolia-application-id': this.appId,
                    'x-algolia-api-key': this.apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ requests: [payload] })
            });
            const json = await r.json().catch(() => ({}));
            if (r.ok || r.status !== 0) {
                return { host, status: r.status, ok: r.ok, json };
            }
            return null;
        } catch (_) {
            return null;
        }
    }

    async fetchRelatedProducts({ indexName, objectID, category, nofilters }) {
        for (const host of this.hosts) {
            const payload = this.buildRequestPayload({
                indexName,
                objectID,
                model: 'related-products',
                category,
                nofilters
            });
            const success = await this.tryHost(host, payload);
            const hits = success?.json?.results?.[0]?.hits ?? [];
            if (hits.length) return hits;
        }
        return [];
    }

    async fetchDbFallback({ category, limit = 8 }) {
        if (!this.db) return [];
        try {
            const params = [];
            let sql = `SELECT "objectID"::text AS "objectID", name, image, price, url,
                              category, brand, tags
                       FROM productos
                       WHERE activo = TRUE AND (stock IS NULL OR stock > 0)`;
            if (category) { sql += ' AND category = $1'; params.push(category); }
            sql += ' ORDER BY random() LIMIT $' + (params.length + 1);
            params.push(limit);
            const r = await this.db.query(sql, params);
            return r.rows;
        } catch (_) {
            return [];
        }
    }
}

module.exports = AlgoliaRecommendService;
