/**
 * Home Admin - Panel de Ingresados Integrado
 * JavaScript Vanilla - No frameworks
 */

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay usuario en localStorage
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userStr);

    // Verificar que sea administrador
    if (user.rol !== 'ADMIN') {
        window.location.href = '/home-usuario';
        return;
    }

    // Elementos del DOM
    const tablaIngresos = document.getElementById('tablaIngresos');
    const totalUsuarios = document.getElementById('totalUsuarios');
    const btnRecargar = document.getElementById('btnRecargar');
    const iconoRecargar = document.getElementById('iconoRecargar');
    const ultimaActualizacion = document.getElementById('ultimaActualizacion');
    const alertaContainer = document.getElementById('alertaContainer');
    const logoutBtn = document.getElementById('logoutBtn');

    let intervaloRecarga = null;

    // Cargar panel inicial
    cargarPanel();

    // Recargar automáticamente cada 30 segundos
    intervaloRecarga = setInterval(cargarPanel, 30000);

    // Botón de recarga manual
    if (btnRecargar) {
        btnRecargar.addEventListener('click', () => {
            cargarPanel(true);
        });
    }

    // Manejar logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    console.log('Sesión cerrada correctamente');
                } else {
                    console.warn('Error al cerrar sesión en el servidor:', data.message);
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            } finally {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        });
    }

    /**
     * Carga el panel de ingresados desde la API
     */
    async function cargarPanel(manual = false) {
        try {
            if (manual && iconoRecargar) {
                iconoRecargar.style.animation = 'spin 1s linear';
                setTimeout(() => {
                    iconoRecargar.style.animation = '';
                }, 1000);
            }

            const response = await fetch('/api/panel/ingresos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                mostrarAlerta('Sesión expirada. Redirigiendo...', 'warning');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }, 2000);
                return;
            }

            if (!response.ok) {
                throw new Error('Error al cargar panel');
            }

            const resultado = await response.json();

            if (resultado.success) {
                const data = resultado.data || resultado;
                renderizarTabla(data.items || []);
                actualizarTotal(data.total || 0);
                actualizarHora();
                if (manual) {
                    mostrarAlerta('Panel actualizado correctamente', 'success', 3000);
                }
            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al cargar panel:', error);
            mostrarAlerta('Error al cargar los datos del panel', 'danger');
            renderizarError();
        }
    }

    /**
     * Renderiza la tabla con los usuarios ingresados
     */
    function renderizarTabla(items) {
        if (!tablaIngresos) return;

        if (!items || items.length === 0) {
            tablaIngresos.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay usuarios en el local actualmente
                    </td>
                </tr>
            `;
            return;
        }

        tablaIngresos.innerHTML = items.map(item => `
            <tr>
                <td class="d-none d-md-table-cell">${item.usuarioId}</td>
                <td><strong>${escapeHtml(item.nombre)}</strong></td>
                <td class="d-none d-lg-table-cell">${escapeHtml(item.rut)}</td>
                <td class="d-none d-lg-table-cell">${escapeHtml(item.email)}</td>
                <td>${formatearFechaHora(item.fechaHora)}</td>
            </tr>
        `).join('');
    }

    /**
     * Renderiza mensaje de error
     */
    function renderizarError() {
        if (!tablaIngresos) return;
        tablaIngresos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    Error al cargar los datos. Intente nuevamente.
                </td>
            </tr>
        `;
    }

    /**
     * Actualiza el contador total
     */
    function actualizarTotal(total) {
        if (totalUsuarios) {
            totalUsuarios.textContent = total || 0;
        }
    }

    /**
     * Actualiza la hora de última actualización
     */
    function actualizarHora() {
        if (ultimaActualizacion) {
            const ahora = new Date();
            ultimaActualizacion.textContent = ahora.toLocaleTimeString('es-CL');
        }
    }

    /**
     * Muestra una alerta temporal
     */
    function mostrarAlerta(mensaje, tipo = 'info', duracion = 0) {
        if (!alertaContainer) return;
        
        alertaContainer.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        if (duracion > 0) {
            setTimeout(() => {
                alertaContainer.innerHTML = '';
            }, duracion);
        }
    }

    /**
     * Formatea fecha y hora
     */
    function formatearFechaHora(fechaHora) {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Limpiar intervalo al salir
    window.addEventListener('beforeunload', () => {
        if (intervaloRecarga) {
            clearInterval(intervaloRecarga);
        }
    });
});

// Animación de rotación para el ícono de recarga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
