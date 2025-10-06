import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import morgan from 'morgan';

import router from './app/routes/index.js';
import errorHandler from './app/middleware/errorHandler.js';
import notFoundHandler from './app/middleware/notFound.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('views', path.join(__dirname, 'app', 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.locals.site = {
  name: 'PartyAccess',
  description: 'Plataforma para gestionar el acceso a eventos.'
};

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
