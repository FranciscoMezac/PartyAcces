/**
 * Clase TrackingEvento
 * Representa un evento de seguimiento (click, view, conversion) en el catálogo.
 * Encapsula los datos del evento y proporciona validación y normalización.
 */
class TrackingEvento {
  /**
   * @param {Object} data - Datos del evento
   * @param {number} [data.usuarioId] - ID del usuario autenticado (opcional)
   * @param {string} [data.rut] - RUT del usuario (opcional)
   * @param {string} [data.userToken] - Token anónimo del usuario (opcional)
   * @param {number} [data.productoId] - ID del producto
   * @param {string} [data.objectId] - ObjectID de Algolia
   * @param {string} data.tipoEvento - Tipo de evento: 'click', 'view', 'conversion'
   * @param {string} [data.source] - Origen del evento (ej: 'canjear-ui', 'home', etc.)
   * @param {Object} [data.metadata] - Metadatos adicionales en formato JSON
   * @param {number} [data.ocurridoEn] - Timestamp en milisegundos (default: Date.now())
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.usuarioId = data.usuarioId ? Number(data.usuarioId) : null;
    this.rut = data.rut ? String(data.rut) : null;
    this.userToken = data.userToken ? String(data.userToken) : null;
    this.productoId = data.productoId ? Number(data.productoId) : null;
    this.objectId = data.objectId || (this.productoId ? String(this.productoId) : null);
    this.tipoEvento = this._normalizarTipoEvento(data.tipoEvento || data.eventType || data.tipo_evento);
    this.source = data.source || data.origen || null;
    this.metadata = data.metadata || null;
    this.ocurridoEn = data.ocurridoEn || data.timestamp || Date.now();
    this.enviadoAlgolia = data.enviadoAlgolia === true || data.enviado_algolia === true;
  }

  /**
   * Normaliza el tipo de evento a los valores estándar
   * @private
   * @param {string} value - Valor a normalizar
   * @returns {string} - Tipo de evento normalizado ('click', 'view', 'conversion')
   */
  _normalizarTipoEvento(value) {
    if (!value) return null;
    const normalized = String(value).trim().toLowerCase();
    
    // Valores directos
    if (['view', 'click', 'conversion'].includes(normalized)) {
      return normalized;
    }
    
    // Aliases para 'click'
    if (['select', 'seleccion', 'select_product', 'selected'].includes(normalized)) {
      return 'click';
    }
    
    // Aliases para 'conversion'
    if (['redeem', 'redeem_product', 'canje', 'canjeado'].includes(normalized)) {
      return 'conversion';
    }
    
    return null;
  }

  /**
   * Valida que el evento tenga los datos mínimos requeridos
   * @throws {Error} Si la validación falla
   */
  validar() {
    if (!this.tipoEvento) {
      throw new Error('Tipo de evento inválido o no proporcionado');
    }

    if (!['click', 'view', 'conversion'].includes(this.tipoEvento)) {
      throw new Error(`Tipo de evento no soportado: ${this.tipoEvento}`);
    }

    if (!this.productoId && !this.objectId) {
      throw new Error('Falta productoId o objectID para el evento');
    }

    return true;
  }

  /**
   * Convierte el objeto a un formato plano para inserción en BD
   * @returns {Object} Objeto con los campos para la BD
   */
  toDatabase() {
    return {
      id: this.id,
      usuarioId: this.usuarioId,
      rut: this.rut,
      userToken: this.userToken,
      productoId: this.productoId,
      objectId: this.objectId,
      tipoEvento: this.tipoEvento,
      source: this.source,
      metadata: this.metadata,
      ocurridoEn: this.ocurridoEn,
      enviadoAlgolia: this.enviadoAlgolia
    };
  }

  /**
   * Convierte el objeto al formato requerido por Algolia Insights API
   * @param {string} indexName - Nombre del índice de Algolia
   * @returns {Object} Objeto en formato Algolia Insights
   */
  toAlgoliaEvent(indexName) {
    const eventTypeMap = {
      view: 'view',
      click: 'click',
      conversion: 'conversion'
    };

    const eventNameMap = {
      view: 'Producto visto',
      click: 'Producto seleccionado',
      conversion: 'Producto canjeado'
    };

    return {
      eventType: eventTypeMap[this.tipoEvento] || 'click',
      eventName: eventNameMap[this.tipoEvento] || 'Evento de producto',
      index: indexName,
      userToken: this.userToken || `anon_${this.rut || 'guest'}`,
      objectIDs: [this.objectId],
      timestamp: this.ocurridoEn
    };
  }

  /**
   * Crea una instancia de TrackingEvento desde los datos de la BD
   * @static
   * @param {Object} row - Fila de la base de datos
   * @returns {TrackingEvento} Nueva instancia del evento
   */
  static fromDatabase(row) {
    return new TrackingEvento({
      id: row.id,
      usuarioId: row.usuario_id,
      rut: row.rut,
      userToken: row.user_token,
      productoId: row.producto_id,
      objectId: row.object_id,
      tipoEvento: row.tipo_evento,
      source: row.source,
      metadata: row.metadata,
      ocurridoEn: row.ocurrido_en ? new Date(row.ocurrido_en).getTime() : null,
      enviadoAlgolia: row.enviado_algolia
    });
  }

  /**
   * Obtiene una representación legible del evento
   * @returns {string}
   */
  toString() {
    return `TrackingEvento{tipo=${this.tipoEvento}, productoId=${this.productoId}, source=${this.source}}`;
  }
}

module.exports = TrackingEvento;
