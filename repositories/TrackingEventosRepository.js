const TrackingEvento = require('../models/TrackingEvento');

class TrackingEventosRepository {
  constructor(db) {
    this.db = db;
    this.ensurePromise = this.ensureSchema();
  }

  async ensureSchema() {
    const ddl = `
      CREATE TABLE IF NOT EXISTS tracking_eventos (
        id              BIGSERIAL PRIMARY KEY,
        usuario_id      BIGINT,
        rut             VARCHAR(20),
        user_token      TEXT,
        producto_id     BIGINT,
        object_id       TEXT,
        tipo_evento     TEXT NOT NULL,
        source          TEXT,
        metadata        JSONB,
        ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        enviado_algolia BOOLEAN NOT NULL DEFAULT FALSE
      );
      ALTER TABLE tracking_eventos
        ADD COLUMN IF NOT EXISTS rut VARCHAR(20);
      ALTER TABLE tracking_eventos
        ADD COLUMN IF NOT EXISTS user_token TEXT;
      ALTER TABLE tracking_eventos
        ADD COLUMN IF NOT EXISTS object_id TEXT;
      ALTER TABLE tracking_eventos
        ADD COLUMN IF NOT EXISTS source TEXT;
      ALTER TABLE tracking_eventos
        ADD COLUMN IF NOT EXISTS metadata JSONB;
      ALTER TABLE tracking_eventos
        ADD COLUMN IF NOT EXISTS enviado_algolia BOOLEAN NOT NULL DEFAULT FALSE;
    `;
    await this.db.query(ddl);
  }

  /**
   * Inserta un evento de tracking en la base de datos
   * @param {TrackingEvento} evento - Instancia del evento a insertar
   * @param {Object} client - Cliente de transacción opcional
   * @returns {Promise<Object>} Objeto con el ID generado
   */
  async insert(evento, client) {
    await this.ensurePromise;

    // Usar el método toDatabase() del objeto para obtener los datos
    const data = evento.toDatabase();

    const sql = `
      INSERT INTO tracking_eventos
        (usuario_id, rut, user_token, producto_id, object_id, tipo_evento, source, metadata, ocurrido_en, enviado_algolia)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), COALESCE($10, FALSE))
      RETURNING id
    `;
    const params = [
      data.usuarioId || null,
      data.rut || null,
      data.userToken || null,
      data.productoId || null,
      data.objectId || null,
      data.tipoEvento,
      data.source || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ocurridoEn ? new Date(data.ocurridoEn) : null,
      data.enviadoAlgolia === true
    ];
    const executor = client || this.db;
    const { rows } = await executor.query(sql, params);
    return rows[0];
  }
}

module.exports = TrackingEventosRepository;
