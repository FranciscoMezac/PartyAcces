# PartyAccess 2.0

Aplicación web desarrollada con **Node.js puro** siguiendo la arquitectura **MVC tradicional**.

## 🚀 Características

- ✅ **Node.js puro** - Sin frameworks (sin Express, Nest, etc.)
- ✅ **Arquitectura MVC** - Separación clara de responsabilidades
- ✅ **Programación Orientada a Objetos (POO)** - Implementación con clases
- ✅ **Router manual** - Implementado desde cero
- ✅ **PostgreSQL** - Base de datos relacional sin ORM
- ✅ **Frontend vanilla** - HTML, CSS, JavaScript puro
- ✅ **Bootstrap 5** - Solo para estilos
- ✅ **Fetch API** - Comunicación cliente-servidor

## 📁 Estructura del Proyecto

```
PartyAccess2/
├── app.js                  # Servidor HTTP principal
├── package.json
├── README.md
├── /config/
│   ├── database.js         # Configuración de PostgreSQL
│   └── settings.js         # Configuración general
├── /controllers/
│   └── userController.js   # Controlador de usuarios
├── /models/
│   └── userModel.js        # Modelo de usuarios
├── /views/
│   ├── home.html          # Página principal
│   ├── login.html          # Página de login
│   └── dashboard.html      # Dashboard de usuarios
├── /routes/
│   └── router.js           # Enrutador manual
└── /public/
    ├── /css/
    │   └── styles.css      # Estilos personalizados
    ├── /js/
    │   ├── main.js         # JavaScript principal
    │   ├── login.js        # Lógica del login
    │   └── dashboard.js    # Lógica del dashboard
    └── /img/               # Imágenes estáticas
```

## 📋 Requisitos Previos

- Node.js v14 o superior
- PostgreSQL v12 o superior

## 🔧 Configuración de la Base de Datos

1. Crear la base de datos:

```sql
CREATE DATABASE partyaccess;
```

2. Ejecutar el script SQL ubicado en `database/create_usuario_table.sql`:

```sql
-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasenia VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'USER' CHECK (rol IN ('USER', 'ADMIN')),
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. Configurar las credenciales en archivo `.env` (crear en la raíz del proyecto):

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=partyaccess
DB_SSL=false
```

## 🚀 Instalación y Ejecución

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar el servidor:

```bash
npm start
```

3. Abrir en el navegador:

```
http://localhost:3000
```

## 📡 Rutas de la API

### GET Routes
- `GET /` - Página principal
- `GET /login` - Página de login
- `GET /register` - Página de registro
- `GET /dashboard` - Dashboard de usuarios
- `GET /api/users` - Obtener todos los usuarios

### POST Routes
- `POST /api/login` - Autenticación de usuario
- `POST /api/register` - Registro de nuevo usuario (con transacciones)
- `POST /api/users` - Crear nuevo usuario

## 🎯 Ejemplo de Uso

### Registro de Usuario

```javascript
const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        contrasenia: '123456',
        rol: 'USER',
        estado: 'ACTIVO'
    })
});

const data = await response.json();
console.log(data); // { success: true, usuarioId: 1 }
```

### Login con Fetch API

```javascript
const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'juan@example.com',
        password: '123456'
    })
});

const data = await response.json();
console.log(data);
```

### Obtener Usuarios

```javascript
const response = await fetch('/api/users');
const data = await response.json();
console.log(data.data); // Array de usuarios
```

## 🏗️ Patrón MVC

### Model (Modelo)
- Gestiona la lógica de datos
- Interactúa directamente con PostgreSQL
- No depende de controladores ni vistas

### View (Vista)
- Archivos HTML estáticos
- Usan Fetch API para comunicarse con el backend
- JavaScript puro para la lógica del cliente

### Controller (Controlador)
- Maneja la lógica de negocio
- Procesa peticiones HTTP
- Conecta modelos con vistas

## 🔒 Seguridad

⚠️ **Nota**: Este proyecto es un esqueleto educativo. Para producción, implementar:
- Hashing de contraseñas (bcrypt)
- Validación de datos
- Protección CSRF
- Sessions/JWT
- HTTPS
- Prepared statements (ya implementado con pg)

## 📝 Licencia

ISC

## 👨‍💻 Autor

Desarrollado como ejemplo de arquitectura MVC pura con Node.js
