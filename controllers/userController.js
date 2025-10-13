const userModel = require('../models/userModel');

// Controlador para login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        // Validar datos
        if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Email y contraseña son requeridos' 
            }));
            return;
        }
        
        // Buscar usuario en la base de datos
        const user = await userModel.findByEmail(email);
        
        if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Credenciales inválidas' 
            }));
            return;
        }
        
        // Validar contraseña (en producción usar bcrypt)
        if (user.password !== password) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Credenciales inválidas' 
            }));
            return;
        }
        
        // Login exitoso
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'Login exitoso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        }));
        
    } catch (error) {
        console.error('Error en login:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'Error interno del servidor' 
        }));
    }
}

// Controlador para obtener todos los usuarios
async function getAllUsers(req, res) {
    try {
        const users = await userModel.findAll();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            data: users 
        }));
        
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'Error al obtener usuarios' 
        }));
    }
}

// Controlador para crear usuario
async function createUser(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Validar datos
        if (!name || !email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            }));
            return;
        }
        
        // Crear usuario
        const newUser = await userModel.create({ name, email, password });
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'Usuario creado exitosamente',
            user: newUser
        }));
        
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'Error al crear usuario' 
        }));
    }
}

module.exports = {
    login,
    getAllUsers,
    createUser
};
