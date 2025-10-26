document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetForm');
    const alertContainer = document.getElementById('alertContainer');
    const resetBtn = document.getElementById('resetBtn');

    /**
     * Muestra una alerta
     * @param {string} message 
     * @param {string} type - 'success' o 'danger'
     */
    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }

    /**
     * Maneja el submit del formulario
     */
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const rut = document.getElementById('rut').value.trim();
        const nuevaContrasena = document.getElementById('nuevaContrasena').value;
        const confirmarContrasena = document.getElementById('confirmarContrasena').value;

        // Validar que las contraseñas coincidan
        if (nuevaContrasena !== confirmarContrasena) {
            showAlert('Las contraseñas no coinciden', 'warning');
            return;
        }

        // Validar longitud mínima
        if (nuevaContrasena.length < 8) {
            showAlert('La contraseña debe tener al menos 8 caracteres', 'warning');
            return;
        }

        try {
            resetBtn.disabled = true;
            resetBtn.textContent = 'Reseteando...';

            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rut: rut,
                    nuevaContrasena: nuevaContrasena
                })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Contraseña reseteada exitosamente. Redirigiendo al login...', 'success');
                
                // Limpiar formulario
                resetForm.reset();

                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showAlert(data.message || 'Error al resetear contraseña', 'danger');
            }

        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión. Intenta nuevamente.', 'danger');
        } finally {
            resetBtn.disabled = false;
            resetBtn.textContent = 'Resetear Contraseña';
        }
    });

    // Validación en tiempo real de contraseñas coincidentes
    document.getElementById('confirmarContrasena').addEventListener('input', (e) => {
        const nuevaContrasena = document.getElementById('nuevaContrasena').value;
        const confirmarContrasena = e.target.value;

        if (confirmarContrasena.length > 0 && nuevaContrasena !== confirmarContrasena) {
            e.target.classList.add('is-invalid');
        } else {
            e.target.classList.remove('is-invalid');
        }
    });
});
