// JavaScript para la página de registro usando Fetch API

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alert-container');
    
    // Manejar el envío del formulario
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obtener los valores del formulario
        const nombre = document.getElementById('nombre').value;
        const rut = document.getElementById('rut').value;
        const email = document.getElementById('email').value;
        const contrasenia = document.getElementById('contrasenia').value;
        const rol = document.getElementById('rol').value;
        const estado = document.getElementById('estado').value;
        
        // Deshabilitar el botón durante la petición
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
        
        try {
            // Realizar petición POST usando Fetch API
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nombre,
                    rut: rut,
                    email: email,
                    contrasenia: contrasenia,
                    rol: rol,
                    estado: estado
                })
            });
            
            // Parsear la respuesta JSON
            const data = await response.json();
            
            // Limpiar alertas previas
            alertContainer.innerHTML = '';
            
            if (data.success) {
                // Registro exitoso
                showAlert('¡Usuario registrado exitosamente! Redirigiendo al login...', 'success');
                
                // Limpiar formulario
                registerForm.reset();
                
                // Redireccionar al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                
            } else {
                // Registro fallido
                showAlert(data.message || 'Error al registrar usuario', 'danger');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión con el servidor', 'danger');
        } finally {
            // Rehabilitar el botón
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
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
