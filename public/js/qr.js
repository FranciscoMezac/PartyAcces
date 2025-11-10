// qr.js: conecta con backend y pinta QR real del usuario
(async function initQR() {
  const $ = (sel) => document.querySelector(sel);
  const setText = (sel, value) => { const el = $(sel); if (el) el.textContent = value; };

  // Mostrar datos básicos del usuario desde localStorage
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      setText('#uName', user.nombre || '');
      setText('#uRun', user.rut || '');
    }
  } catch {}

  const token = localStorage.getItem('token');
  if (!token) {
    // No autenticado
    window.location.href = '/login';
    return;
  }

  // Llamar a la API para obtener/generar el QR
  let qrData = null;
  try {
    const resp = await fetch('/api/qr/generar', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message || 'Error');
    if (!data.qr) throw new Error('Respuesta sin QR');
    qrData = data.qr;
  } catch (err) {
    console.error('Error obteniendo QR:', err);
    setText('#refId', '—');
    return;
  }

  // Pintar referencia
  setText('#refId', qrData.referencia || '');

  // Pintar imagen del QR usando un servicio de generación de imágenes QR
  // Nota: Dependencia externa de red. Si falla, se usa fallback SVG simple.
  const qrImg = $('#qrImg');
  if (qrImg && qrData.data) {
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(qrData.data)}`;
    qrImg.alt = 'Código QR';

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    try {
      const r = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error('QR API error');
      const blob = await r.blob();
      qrImg.src = URL.createObjectURL(blob);
    } catch (e) {
      // Fallback: SVG placeholder con referencia (no escaneable)
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
          <rect width="640" height="640" fill="#fff"/>
          <rect x="40" y="40" width="560" height="560" fill="#000" opacity=".05"/>
          <text x="50%" y="50%" font-size="22" font-family="ui-sans-serif, system-ui, -apple-system" text-anchor="middle" fill="#000">
            QR no disponible
          </text>
          <text x="50%" y="58%" font-size="16" font-family="ui-sans-serif, system-ui, -apple-system" text-anchor="middle" fill="#6c757d">
            ${qrData.referencia || ''}
          </text>
        </svg>
      `.trim();
      const dataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      qrImg.src = dataUri;
    }
  }

  // Última actualización
  const $last = $('#lastUpdated');
  const $rel = $('#lastUpdatedRel');
  if ($last || $rel) {
    const lastUpdated = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const rel = (from) => {
      const s = Math.floor((Date.now() - from.getTime()) / 1000);
      if (s < 60) return `hace ${s}s`;
      const m = Math.floor(s / 60); if (m < 60) return `hace ${m}m`;
      const h = Math.floor(m / 60); if (h < 24) return `hace ${h}h`;
      const d = Math.floor(h / 24); return `hace ${d}d`;
    };
    if ($last) $last.textContent = fmt(lastUpdated);
    if ($rel) { $rel.textContent = rel(lastUpdated); setInterval(() => { $rel.textContent = rel(lastUpdated); }, 30000); }
  }

  // Botón de instrucciones
  const btn = document.querySelector('#btnInstr');
  const box = document.querySelector('#instrBody');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!box) {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        btn.textContent = expanded ? 'Ver instrucciones' : 'Ocultar instrucciones';
        return;
      }
      const isHidden = box.hasAttribute('hidden');
      if (isHidden) {
        box.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = 'Ocultar instrucciones';
      } else {
        box.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Ver instrucciones';
      }
    });
  }
})();

