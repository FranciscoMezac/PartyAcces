import logger from '../utils/logger.js';

// Middleware para capturar errores y responder de forma consistente.
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, err.stack ?? '');

  const statusCode = err.status ?? 500;
  res.status(statusCode);

  if (req.accepts('html')) {
    return res.render('errors/500', {
      title: 'Algo salió mal',
      message: statusCode === 500 ? 'Ha ocurrido un error inesperado.' : err.message
    });
  }

  return res.json({
    message: err.message ?? 'Error interno del servidor'
  });
};

export default errorHandler;

