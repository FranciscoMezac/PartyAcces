class Producto {
  #id; #nombre; #descripcion; #puntosRequeridos; #image; #activo;
  #repository;

  constructor({ id, nombre, descripcion, puntosRequeridos, image, activo = true }, repository = null) {
    this.#id = Number(id);
    this.#nombre = nombre;
    this.#descripcion = descripcion || null;
    this.#puntosRequeridos = Number(puntosRequeridos);
    this.#image = image || null;
    this.#activo = !!activo;
    this.#repository = repository;
  }

  get id() { return this.#id; }
  get nombre() { return this.#nombre; }
  get descripcion() { return this.#descripcion; }
  get puntosRequeridos() { return this.#puntosRequeridos; }
  get image() { return this.#image; }
  get activo() { return this.#activo; }

  getCostoEnPuntos() {
    return this.#puntosRequeridos;
  }

  // Alias del diagrama: costoEnPuntos()
  costoEnPuntos() {
    return this.getCostoEnPuntos();
  }

  /**
   * Convierte el producto a JSON para respuestas
   * @returns {Object}
   */
  toJSON() {
    return {
      objectID: String(this.#id),
      name: this.#nombre,
      descripcion: this.#descripcion,
      price: this.#puntosRequeridos,
      image: this.#image
    };
  }

  // Alias del diagrama: cargarPorId() usando el repository
  async cargarPorId(repo, client) {
    const repository = repo || this.#repository;
    if (!repository) throw new Error('Repositorio no inyectado');
    
    const p = await repository.findById(client, this.#id);
    if (!p) {
      const err = new Error('Producto no encontrado o inactivo');
      err.code = 'PRODUCTO_NO_ENCONTRADO';
      throw err;
    }
    this.#nombre = p.nombre;
    this.#puntosRequeridos = p.puntosRequeridos;
    this.#activo = p.activo;
    return this;
  }

  /**
   * Busca productos por array de IDs usando el repositorio inyectado
   * Método de instancia que usa el repositorio del objeto
   * @param {Array<number>} ids - Array de IDs de productos
   * @param {Object} [client] - Cliente de transacción opcional
   * @returns {Promise<Array<Producto>>} Array de instancias de Producto
   */
  async buscarPorIds(ids, client = null) {
    if (!this.#repository) throw new Error('Repositorio no inyectado');
    if (!ids || ids.length === 0) return [];
    
    return await this.#repository.findByIds(ids, client);
  }
}

module.exports = Producto;
