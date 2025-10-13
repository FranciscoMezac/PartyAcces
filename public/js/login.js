// JavaScript para la página de login usando Fetch API

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alert-container');
    
    // Manejar el envío del formulario
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obtener los valores del formulario
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Deshabilitar el botón durante la petición
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cargando...';
        
        try {
            // Realizar petición POST usando Fetch API
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            // Parsear la respuesta JSON
            const data = await response.json();
            
            // Limpiar alertas previas
            alertContainer.innerHTML = '';
            
            if (data.success) {
                // Login exitoso
                showAlert('¡Login exitoso! Redirigiendo...', 'success');
                
                // Guardar datos del usuario en localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redireccionar al dashboard después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } else {
                // Login fallido
                showAlert(data.message || 'Error al iniciar sesión', 'danger');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión con el servidor', 'danger');
        } finally {
            // Rehabilitar el botón
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión';
        }
    });
    
    // Función para mostrar alertas
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertContainer.appendChild(alert);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
});
