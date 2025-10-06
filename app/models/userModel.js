// Ejemplo de modelo. Sustituye por integraciones reales a base de datos.
const users = [];

const findAll = async () => users;

const findById = async (id) => users.find((user) => user.id === id) ?? null;

export default {
  findAll,
  findById
};

