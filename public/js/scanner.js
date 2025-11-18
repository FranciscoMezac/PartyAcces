// scanner.js - Escaneo de QR con cámara del dispositivo
(function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    let stream = null;
    let scanning = true;
    let lastScannedCode = null;
    let scanCooldown = false;

    // Verificar autenticación
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        window.location.href = '/login';
        return;
    }

    // Verificar que sea admin o trabajador
    if (user.rol !== 'ADMIN') {
        alert('Solo administradores pueden acceder a esta función');
        window.location.href = '/dashboard';
        return;
    }

    // Iniciar cámara
    async function startCamera() {
        try {
            // Solicitar acceso a la cámara trasera (mejor para escanear)
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Cámara trasera en móviles
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();

            // Cuando el video esté listo, iniciar escaneo
            video.addEventListener('loadedmetadata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                requestAnimationFrame(scan);
            });

        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
            document.getElementById('camera-error').style.display = 'block';
            document.getElementById('scanner-container').style.display = 'none';
        }
    }

    // Escanear continuamente
    function scan() {
        if (!scanning) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (code && !scanCooldown) {
                // QR detectado
                const qrData = code.data;
                
                // Evitar escaneos duplicados inmediatos
                if (qrData !== lastScannedCode) {
                    lastScannedCode = qrData;
                    handleQRCode(qrData);
                }
            }
        }

        requestAnimationFrame(scan);
    }

    // Procesar código QR escaneado
    async function handleQRCode(codigoQr) {
        // Activar cooldown para evitar múltiples escaneos
        scanCooldown = true;
        scanning = false;

        console.log('QR Escaneado:', codigoQr);

        // Ocultar instrucciones y mostrar loading
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
        document.getElementById('result-success').style.display = 'none';
        document.getElementById('result-error').style.display = 'none';

        try {
            console.log('Enviando al backend...');
            
            // Enviar código al backend
            const response = await fetch('/api/acceso/validar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ codigoQr })
            });

            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response body:', result);

            document.getElementById('loading').style.display = 'none';

            if (response.ok && result.success) {
                // Acceso validado exitosamente
                console.log('Mostrando éxito con data:', result.data);
                await mostrarExito(result.data);
            } else {
                // Error en la validación
                console.log('Mostrando error:', result.message);
                mostrarError(result.message || 'Error al validar el acceso');
            }

        } catch (error) {
            console.error('Error completo:', error);
            document.getElementById('loading').style.display = 'none';
            mostrarError('Error de conexión: ' + error.message);
        }
    }

    // Mostrar resultado exitoso
    async function mostrarExito(data) {
        try {
            const acceso = data.acceso || {};
            const usuario = data.usuario || {};
            
            document.getElementById('success-nombre').textContent = usuario.nombre || '—';
            document.getElementById('success-rut').textContent = usuario.rut || '—';
            document.getElementById('success-fecha').textContent = new Date(acceso.fechaHora || Date.now()).toLocaleString('es-CL');
            document.getElementById('success-ref').textContent = acceso.qrReferencia || '—';
            
            document.getElementById('result-success').style.display = 'block';
            
            // Reproducir sonido de éxito (opcional)
            playSuccessSound();
            
        } catch (error) {
            console.error('Error al mostrar datos:', error);
        }
    }

    // Mostrar error
    function mostrarError(mensaje) {
        let titulo = 'Error';
        
        if (mensaje.includes('duplicado') || mensaje.includes('ya ingresó')) {
            titulo = 'Acceso Duplicado';
        } else if (mensaje.includes('no encontrado')) {
            titulo = 'QR No Encontrado';
        } else if (mensaje.includes('inválido')) {
            titulo = 'QR Inválido';
        }
        
        document.getElementById('error-title').textContent = titulo;
        document.getElementById('error-message').textContent = mensaje;
        document.getElementById('result-error').style.display = 'block';
        
        // Reproducir sonido de error (opcional)
        playErrorSound();
    }

    // Reiniciar escáner
    window.resetScanner = function() {
        lastScannedCode = null;
        scanCooldown = false;
        scanning = true;
        
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('result-success').style.display = 'none';
        document.getElementById('result-error').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        
        requestAnimationFrame(scan);
    };

    // Sonidos de feedback (opcional)
    function playSuccessSound() {
        // Vibración en dispositivos móviles
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    }

    function playErrorSound() {
        // Vibración en dispositivos móviles
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    // Detener cámara al salir
    window.addEventListener('beforeunload', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error en logout:', error);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    // Iniciar aplicación
    startCamera();
})();
