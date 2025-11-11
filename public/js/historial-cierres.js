/**
 * Historial de Cierres - Frontend
 * JavaScript Vanilla - No frameworks
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Elementos del DOM
    const tablaHistorial = document.getElementById('tablaHistorial');
    const paginacion = document.getElementById('paginacion');
    const alertaContainer = document.getElementById('alertaContainer');
    const logoutBtn = document.getElementById('logout');

    // Elementos de estadísticas
    const totalCierres = document.getElementById('totalCierres');
    const promedioIngresos = document.getElementById('promedioIngresos');
    const maxIngresos = document.getElementById('maxIngresos');
    const minIngresos = document.getElementById('minIngresos');

    let paginaActual = 1;
    const limite = 10;

    // Cargar datos iniciales
    cargarEstadisticas();
    cargarHistorial(paginaActual);

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        });
    }

    /**
     * Carga estadísticas generales
     */
    async function cargarEstadisticas() {
        try {
            const response = await fetch('/api/historial/estadisticas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error al cargar estadísticas');

            const resultado = await response.json();

            if (resultado.success) {
                const data = resultado.data || resultado;
                if (totalCierres) totalCierres.textContent = data.total_cierres || 0;
                if (promedioIngresos) promedioIngresos.textContent = parseFloat(data.promedio_ingresos || 0).toFixed(0);
                if (maxIngresos) maxIngresos.textContent = data.max_ingresos || 0;
                if (minIngresos) minIngresos.textContent = data.min_ingresos || 0;
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    /**
     * Carga historial paginado
     */
    async function cargarHistorial(page = 1) {
        try {
            const response = await fetch(`/api/historial/cierres?page=${page}&limit=${limite}`, {
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

            if (!response.ok) throw new Error('Error al cargar historial');

            const resultado = await response.json();

            if (resultado.success) {
                const data = resultado.data || resultado;
                renderizarTabla(data.items || []);
                renderizarPaginacion(data.page, data.totalPages);
            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            mostrarAlerta('Error al cargar el historial', 'danger');
            renderizarError();
        }
    }

    /**
     * Renderiza la tabla con el historial
     */
    function renderizarTabla(items) {
        if (!tablaHistorial) return;

        if (!items || items.length === 0) {
            tablaHistorial.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        No hay registros de cierres disponibles
                    </td>
                </tr>
            `;
            return;
        }

        tablaHistorial.innerHTML = items.map(item => `
            <tr style="cursor: pointer;" data-fecha="${item.fechaCierre}">
                <td class="d-none d-md-table-cell">${item.cierreId}</td>
                <td><strong>${formatearFecha(item.fechaCierre)}</strong></td>
                <td class="d-none d-lg-table-cell">${formatearHora(item.horaCierre)}</td>
                <td><span class="badge bg-primary fs-6">${item.totalIngresos}</span></td>
                <td class="d-none d-md-table-cell">${item.usuariosProcesados}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); verDetalle('${item.fechaCierre}')">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `).join('');

        // Event listeners para las filas (click en cualquier parte de la fila)
        tablaHistorial.querySelectorAll('tr[data-fecha]').forEach(row => {
            row.addEventListener('click', () => {
                const fecha = row.dataset.fecha;
                verDetalle(fecha);
            });
        });
    }

    /**
     * Renderiza error en la tabla
     */
    function renderizarError() {
        if (!tablaHistorial) return;
        tablaHistorial.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    Error al cargar los datos. Intente nuevamente.
                </td>
            </tr>
        `;
    }

    /**
     * Renderiza la paginación
     */
    function renderizarPaginacion(paginaActual, totalPaginas) {
        if (!paginacion) return;

        if (totalPaginas <= 1) {
            paginacion.innerHTML = '';
            return;
        }

        let html = '';

        // Botón anterior
        html += `
            <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${paginaActual - 1}">Anterior</a>
            </li>
        `;

        // Páginas
        const maxPaginasVisibles = 5;
        let inicio = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2));
        let fin = Math.min(totalPaginas, inicio + maxPaginasVisibles - 1);

        if (fin - inicio < maxPaginasVisibles - 1) {
            inicio = Math.max(1, fin - maxPaginasVisibles + 1);
        }

        for (let i = inicio; i <= fin; i++) {
            html += `
                <li class="page-item ${i === paginaActual ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Botón siguiente
        html += `
            <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${paginaActual + 1}">Siguiente</a>
            </li>
        `;

        paginacion.innerHTML = html;

        // Event listeners para paginación
        paginacion.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== paginaActual) {
                    cargarHistorial(page);
                }
            });
        });
    }

    /**
     * Muestra una alerta temporal
     */
    function mostrarAlerta(mensaje, tipo = 'info', duracion = 5000) {
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
     * Formatea fecha
     */
    function formatearFecha(fecha) {
        if (!fecha) return '-';
        // Asegurar formato correcto
        const fechaStr = String(fecha).includes('T') ? fecha.split('T')[0] : fecha;
        const date = new Date(fechaStr + 'T00:00:00');
        
        if (isNaN(date.getTime())) return fecha; // Retornar original si no se puede parsear
        
        return date.toLocaleDateString('es-CL', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Formatea hora
     */
    function formatearHora(hora) {
        if (!hora) return '-';
        const [h, m] = hora.split(':');
        return `${h}:${m}`;
    }

    /**
     * Muestra el detalle de usuarios de una fecha
     */
    window.verDetalle = async function(fecha) {
        console.log('verDetalle llamado con fecha:', fecha);
        
        const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
        const modalFecha = document.getElementById('modalFecha');
        const modalTotal = document.getElementById('modalTotal');
        const tablaDetalleUsuarios = document.getElementById('tablaDetalleUsuarios');

        // Limpiar y normalizar fecha (YYYY-MM-DD)
        let fechaLimpia = String(fecha)
            .trim()
            .replace(/[\r\n\t]/g, '')  // Remover saltos de línea y tabs
            .split('T')[0]              // Solo la parte de fecha si hay timestamp
            .split(' ')[0];             // Solo la parte de fecha si hay espacio
        
        console.log('Fecha limpia:', fechaLimpia);

        // Mostrar modal con spinner
        if (modalFecha) modalFecha.textContent = formatearFecha(fechaLimpia);
        if (modalTotal) modalTotal.textContent = '...';
        if (tablaDetalleUsuarios) {
            tablaDetalleUsuarios.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-3">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <span class="ms-2">Cargando usuarios...</span>
                    </td>
                </tr>
            `;
        }
        
        modal.show();

        // Cargar usuarios
        try {
            const url = `/api/historial/usuarios/${fechaLimpia}`;
            console.log('Llamando a URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Response error:', response.status, response.statusText);
                throw new Error(`Error al cargar usuarios: ${response.status}`);
            }

            const resultado = await response.json();
            console.log('Resultado:', resultado);

            if (resultado.success) {
                const data = resultado.data || resultado;
                const usuarios = data.usuarios || [];
                
                if (modalTotal) modalTotal.textContent = data.total || usuarios.length;

                if (!usuarios || usuarios.length === 0) {
                    tablaDetalleUsuarios.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center py-3 text-muted">
                                No hay usuarios registrados para esta fecha
                            </td>
                        </tr>
                    `;
                    return;
                }

                tablaDetalleUsuarios.innerHTML = usuarios.map(u => `
                    <tr>
                        <td class="d-none d-md-table-cell">${u.usuarioId}</td>
                        <td><strong>${escapeHtml(u.nombre)}</strong></td>
                        <td class="d-none d-lg-table-cell">${escapeHtml(u.rut)}</td>
                        <td>${formatearHoraCompleta(u.fechaHora)}</td>
                    </tr>
                `).join('');
            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            if (tablaDetalleUsuarios) {
                tablaDetalleUsuarios.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-3 text-danger">
                            Error al cargar el detalle. Intente nuevamente.
                        </td>
                    </tr>
                `;
            }
        }
    };

    /**
     * Formatea hora completa con minutos
     */
    function formatearHoraCompleta(fechaHora) {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
});
