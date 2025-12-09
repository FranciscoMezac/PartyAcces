/**
 * Clase TrackingEvento (Active Record Pattern)
 * Representa un evento de seguimiento (click, view, conversion) en el catálogo.
 * Encapsula los datos del evento, proporciona validación, normalización y
 * conoce su repositorio para persistirse a sí mismo.
 * 
 * Patrón de diseño: Active Record / Rich Domain Model
 * - El modelo conoce su repositorio (inyectado en constructor)
 * - El modelo tiene comportamiento de negocio (validar, guardar)
 * - El servicio usa métodos del modelo, NO del repositorio directamente
 */
class TrackingEvento {
  // Propiedades privadas (encapsulación)
  #id;
  #usuarioId;
  #rut;
  #userToken;
  #productoId;
  #objectId;
  #tipoEvento;
  #source;
  #metadata;
  #ocurridoEn;
  #enviadoAlgolia;
  #repository;

  /**
   * @param {Object} data - Datos del evento
   * @param {Object} repository - Instancia de TrackingEventosRepository (inyección de dependencia)
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
  constructor(data = {}, repository = null) {
    this.#id = data.id || null;
    this.#usuarioId = data.usuarioId ? Number(data.usuarioId) : null;
    this.#rut = data.rut ? String(data.rut) : null;
    this.#userToken = data.userToken ? String(data.userToken) : null;
    this.#productoId = data.productoId ? Number(data.productoId) : null;
    this.#objectId = data.objectId || (this.#productoId ? String(this.#productoId) : null);
    this.#tipoEvento = this.#normalizarTipoEvento(data.tipoEvento || data.eventType || data.tipo_evento);
    this.#source = data.source || data.origen || null;
    this.#metadata = data.metadata || null;
    this.#ocurridoEn = data.ocurridoEn || data.timestamp || Date.now();
    this.#enviadoAlgolia = data.enviadoAlgolia === true || data.enviado_algolia === true;
    this.#repository = repository;
  }

  // ========== GETTERS (acceso controlado a propiedades privadas) ==========
  get id() { return this.#id; }
  get usuarioId() { return this.#usuarioId; }
  get rut() { return this.#rut; }
  get userToken() { return this.#userToken; }
  get productoId() { return this.#productoId; }
  get objectId() { return this.#objectId; }
  get tipoEvento() { return this.#tipoEvento; }
  get source() { return this.#source; }
  get metadata() { return this.#metadata; }
  get ocurridoEn() { return this.#ocurridoEn; }
  get enviadoAlgolia() { return this.#enviadoAlgolia; }

  // ========== SETTERS (para propiedades que pueden cambiar) ==========
  set id(value) { this.#id = value; }
  set enviadoAlgolia(value) { this.#enviadoAlgolia = value === true; }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Normaliza el tipo de evento a los valores estándar
   * @private
   * @param {string} value - Valor a normalizar
   * @returns {string} - Tipo de evento normalizado ('click', 'view', 'conversion')
   */
  #normalizarTipoEvento(value) {
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

  // ========== COMPORTAMIENTO DE DOMINIO ==========

  /**
   * Valida que el evento tenga los datos mínimos requeridos
   * @throws {Error} Si la validación falla
   */
  validar() {
    if (!this.#tipoEvento) {
      throw new Error('Tipo de evento inválido o no proporcionado');
    }

    if (!['click', 'view', 'conversion'].includes(this.#tipoEvento)) {
      throw new Error(`Tipo de evento no soportado: ${this.#tipoEvento}`);
    }

    if (!this.#productoId && !this.#objectId) {
      throw new Error('Falta productoId o objectID para el evento');
    }

    return true;
  }

  /**
   * Guarda el evento en la base de datos usando su repositorio (Active Record Pattern)
   * El modelo conoce su repositorio y se persiste a sí mismo.
   * @param {Object} [client] - Cliente de transacción opcional
   * @returns {Promise<number>} El ID asignado al evento
   * @throws {Error} Si no tiene repositorio inyectado o falla la validación
   */
  async guardar(client = null) {
    if (!this.#repository) {
      throw new Error('TrackingEvento no tiene repositorio inyectado. Use new TrackingEvento(data, repository)');
    }

    // Validar antes de guardar
    this.validar();

    // El modelo usa su repositorio para persistirse
    const resultado = await this.#repository.insert(this, client);
    this.#id = resultado.id;

    return this.#id;
  }

  // ========== MÉTODOS DE TRANSFORMACIÓN ==========

  /**
   * Convierte el objeto a un formato plano para inserción en BD
   * @returns {Object} Objeto con los campos para la BD
   */
  toDatabase() {
    return {
      id: this.#id,
      usuarioId: this.#usuarioId,
      rut: this.#rut,
      userToken: this.#userToken,
      productoId: this.#productoId,
      objectId: this.#objectId,
      tipoEvento: this.#tipoEvento,
      source: this.#source,
      metadata: this.#metadata,
      ocurridoEn: this.#ocurridoEn,
      enviadoAlgolia: this.#enviadoAlgolia
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
      eventType: eventTypeMap[this.#tipoEvento] || 'click',
      eventName: eventNameMap[this.#tipoEvento] || 'Evento de producto',
      index: indexName,
      userToken: this.#userToken || `anon_${this.#rut || 'guest'}`,
      objectIDs: [this.#objectId],
      timestamp: this.#ocurridoEn
    };
  }

  // ========== MÉTODOS ESTÁTICOS (para reconstruir desde BD) ==========

  /**
   * Crea una instancia de TrackingEvento desde los datos de la BD
   * @static
   * @param {Object} row - Fila de la base de datos
   * @param {Object} [repository] - Repositorio opcional para inyectar
   * @returns {TrackingEvento} Nueva instancia del evento
   */
  static fromDatabase(row, repository = null) {
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
    }, repository);
  }

  /**
   * Obtiene una representación legible del evento
   * @returns {string}
   */
  toString() {
    return `TrackingEvento{id=${this.#id}, tipo=${this.#tipoEvento}, productoId=${this.#productoId}, source=${this.#source}}`;
  }
}

module.exports = TrackingEvento;
