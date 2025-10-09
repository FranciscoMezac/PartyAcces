import { withTransaction } from '../config/db.js';
import Usuario from '../models/User.js';
import userRepository from '../models/userModel.js';
import puntosCuentaRepository from '../models/puntosCuentaModel.js';

export class EmailEnUsoError extends Error {}

export default class AuthService {
  async registrarUsuario({ nombre, email, contrasenia }) {
    if (!nombre || !email || !contrasenia) throw new Error('DATOS_INVALIDOS');

    const existente = await userRepository.findByEmail(email);
    if (existente) throw new EmailEnUsoError('EMAIL_EN_USO');

    const usuario = new Usuario({ nombre, email, contrasenia, rol: 'USER', estado: 'ACTIVO' });

    const usuarioId = await withTransaction(async (tx) => {
      const id = await userRepository.insert(tx, usuario);
      await puntosCuentaRepository.createForUser(tx, id); // saldo = 0
      return id;
    });

    return usuarioId;
  }
}