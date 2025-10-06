const notFoundHandler = (req, res) => {
  res.status(404);
  const acceptsHtml = req.accepts('html');

  if (acceptsHtml) {
    return res.render('errors/404', {
      title: 'Página no encontrada',
      url: req.originalUrl
    });
  }

  return res.json({
    message: 'Recurso no encontrado',
    url: req.originalUrl
  });
};

export default notFoundHandler;

