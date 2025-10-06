// Logger muy sencillo para centralizar la salida en consola.
const info = (...args) => console.log('[INFO]', ...args);

const error = (...args) => console.error('[ERROR]', ...args);

export default {
  info,
  error
};

