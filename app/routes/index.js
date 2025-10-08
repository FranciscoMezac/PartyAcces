import { Router } from 'express';

import homeController from '../controllers/homeController.js';
// Importar nuevos controladores
//import productController from '../controllers/productController.js';
//import qrController from '../controllers/qrController.js';
//import userController from '../controllers/userController.js';

const router = Router();

router.get('/', homeController.index);

// Nuevas rutas para la navegación
//router.get('/productos', productController.index);
//router.get('/qr', qrController.index);
//router.get('/usuario', userController.index);

export default router;