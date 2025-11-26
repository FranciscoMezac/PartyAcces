# Análisis de Rutas Redundantes en router.js

## Rutas Redundantes/Innecesarias Encontradas

### 1. **`/home` - REDUNDANTE**
- **Línea:** 81
- **Actual:** `'/home': serveView('home.html')`
- **Problema:** No se utiliza en ninguna parte de la aplicación. Los usuarios logueados van a `/home-usuario` o `/home-admin`
- **Vista asociada:** `home.html` (archivo no utilizado)
- **Recomendación:** ❌ ELIMINAR

### 2. **`/home_client` - REDUNDANTE**
- **Línea:** 82
- **Actual:** `'/home_client': serveView('home_client.html')`
- **Problema:** No se utiliza. El flow actual usa `/home-usuario` (guión, no guion bajo)
- **Vista asociada:** `home_client.html` (archivo legacy)
- **Recomendación:** ❌ ELIMINAR

### 3. **`/home_admin` - REDUNDANTE**
- **Línea:** 83
- **Actual:** `'/home_admin': serveView('home_admin.html')`
- **Problema:** No se utiliza. El flow actual usa `/home-admin` (guión, no guion bajo)
- **Vista asociada:** `home_admin.html` (archivo legacy)
- **Recomendación:** ❌ ELIMINAR

---

## Rutas Duplicadas (Mismo Contenido, Rutas Diferentes)

### 4. **`/home-usuario` y `/home-usuario`** - DUPLICADAS PERO CORRECTAS
- Ambas apuntan a `home-usuario.html` - Esto es correcto, no hay duplicidad real

### 5. **`/home-admin` y `/home-admin`** - DUPLICADAS PERO CORRECTAS
- Ambas apuntan a `home-admin.html` - Esto es correcto, no hay duplicidad real

---

## Rutas Que NO Redirigen a Nada Útil

### 6. **`/usuario` - INCORRECTO**
- **Línea:** 85
- **Actual:** `'/usuario': serveView('login.html')`
- **Problema:** Redirige al login en lugar del perfil. El usuario clickea "Mi perfil" y va a `/usuario`, pero termina en login.html
- **Corrección necesaria:** Debería ser `serveView('perfil-usuario.html')`
- **Estado:** ⚠️ YA CORREGIDO en correcciones anteriores (debe verificarse)

---

## Resumen de Cambios Necesarios

| Ruta | Acción | Razón |
|------|--------|-------|
| `/home` | ELIMINAR | No utilizado, reemplazado por `/home-usuario` y `/home-admin` |
| `/home_client` | ELIMINAR | Legacy, reemplazado por `/home-usuario` |
| `/home_admin` | ELIMINAR | Legacy, reemplazado por `/home-admin` |
| `/usuario` | VERIFICAR | Debería apuntar a `perfil-usuario.html`, no `login.html` |

---

## Rutas Actuales Que SÍ Se Usan (MANTENER)

✅ `/` - Index (landing page)
✅ `/login` - Login
✅ `/register` - Registro
✅ `/dashboard` - Dashboard admin
✅ `/home-usuario` - Home autenticado para usuarios
✅ `/home-admin` - Home autenticado para admins
✅ `/perfil-usuario` - Perfil de usuario
✅ `/perfil-admin` - Perfil de admin
✅ `/qr` - Pantalla QR
✅ `/puntos/acumular`, `/puntos/canjear`, `/puntos/historial` - Puntos
✅ Todas las rutas API (`/api/*`)

