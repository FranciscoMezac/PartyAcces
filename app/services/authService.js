import { withTransaction } from '../config/db.js';
import Usuario from '../models/User.js';
import userRepository from '../models/userModel.js';

export class EmailEnUsoError extends Error {}

export default class AuthService {
  async registrarUsuario({ nombre, email, contrasenia, rol, estado}) {
    if (!nombre || !email || !contrasenia) throw new Error('DATOS_INVALIDOS');

    const existente = await userRepository.findByEmail(email);
    if (existente) throw new EmailEnUsoError('EMAIL_EN_USO');

    const usuario = new Usuario({ nombre, email, contrasenia, rol, estado});

    const usuarioId = await withTransaction(async (tx) => {
      const id = await userRepository.insert(tx, usuario);
      return id;
    });

    return usuarioId;
  }
}