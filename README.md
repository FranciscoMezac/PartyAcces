# PartyAccess - Primera Iteración

Plantilla inicial con arquitectura MVC para aplicaciones Node.js + Express. Incluye una vista de ejemplo con EJS, capas separadas por responsabilidad y utilidades para comenzar rápido.

## Estructura

- `app/` código de aplicación
  - `controllers/` controladores Express
  - `models/` modelos o acceso a datos
  - `views/` plantillas EJS (layouts, parciales y páginas)
  - `routes/` definición de rutas
  - `services/` lógica de negocio reutilizable
  - `middleware/` middleware personalizados
  - `utils/` utilidades compartidas
- `config/` configuración centralizada
- `public/` archivos estáticos (CSS, JS, imágenes)
- `tests/` pruebas unitarias e integración
- `scripts/` automatizaciones y herramientas auxiliares

## Primeros Pasos

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia las variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

La aplicación quedará disponible en `http://localhost:3000`.

## Buenas Prácticas

- Mantén los controladores delgados delegando reglas de negocio en servicios.
- Centraliza la configuración en `config/` para evitar valores mágicos en el código.
- Agrega nuevas rutas dentro de `app/routes/` y enlázalas desde `app/routes/index.js`.
- Utiliza `tests/` para asegurar el comportamiento de servicios y controladores.

¡Listo para iterar sobre PartyAccess! Ajusta las capas según crezca el proyecto.
