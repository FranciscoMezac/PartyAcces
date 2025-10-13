// Archivo principal de JavaScript para PartyAccess

console.log('🎉 PartyAccess cargado correctamente');

// Función para mostrar mensajes
function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado completamente');
    showMessage('Aplicación iniciada', 'success');
});
