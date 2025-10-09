import { Router } from 'express';

import homeController from '../controllers/homeController.js';
import authController from '../controllers/authController.js';

const router = Router();

router.get('/', homeController.index);
router.get('/registro', authController.showRegister);
router.post('/registro', authController.register);

export default router;