import AuthService, { EmailEnUsoError } from '../services/authService.js';
import homeService from '../services/homeService.js';

const service = new AuthService();

const showRegister = (req, res) => {
  const vm = homeService.getLandingViewModel();
  res.render('auth/registro', { title: 'Registro', error: null, values: {}, navigation: vm.navigation });
};

const register = async (req, res, next) => {
  const { nombre, email, contrasenia } = req.body ?? {};
  try {
    await service.registrarUsuario({ nombre, email, contrasenia });
    return res.redirect(302, '/login');
  } catch (e) {
    const vm = homeService.getLandingViewModel();
    if (e instanceof EmailEnUsoError) {
        console.error(e.code, e.message);
      return res.status(409).render('auth/registro', {
        title: 'Registro',
        error: 'El email ya está en uso.',
        values: { nombre, email },
        navigation: vm.navigation
      });
    }
    return res.status(400).render('auth/registro', {
      title: 'Registro',
      error: 'No se pudo registrar. Intenta de nuevo.',
      values: { nombre, email },
      navigation: vm.navigation
    });
  }
};

export default { showRegister, register };