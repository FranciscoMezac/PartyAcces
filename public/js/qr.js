// qr.js — robusto: cada elemento es opcional, no rompe si se elimina del HTML

(function initQR() {
  // Datos de ejemplo para el diseño (reemplaza cuando conectes al backend)
  const data = {
    name: "Agustín R.",
    run: "12.345.678-9",
    refId: "TX-PA-20251025-001",
    qrData: "PA|USER:12345678-9|TX:20251025-001"
  };

  // Helpers seguros
  const $ = (sel) => document.querySelector(sel);
  const setText = (sel, value) => { const el = $(sel); if (el) el.textContent = value; };
  const setAttr = (el, attr, value) => { if (el) el.setAttribute(attr, value); };

  // 1) Pintar info (solo si existe en el DOM)
  setText("#uName", data.name);
  setText("#uRun", data.run);
  setText("#refId", data.refId);

  // 2) QR de muestra en SVG (puedes sustituir por tu generador real)
  const qrImg = $("#qrImg");
  if (qrImg) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
        <rect width="640" height="640" fill="#fff"/>
        <rect x="40" y="40" width="560" height="560" fill="#000" opacity=".05"/>
        <rect x="80" y="80" width="160" height="160" fill="#000"/>
        <rect x="400" y="80" width="160" height="160" fill="#000"/>
        <rect x="80" y="400" width="160" height="160" fill="#000"/>
        <rect x="250" y="250" width="140" height="140" fill="#000"/>
        <rect x="420" y="420" width="80" height="80" fill="#000"/>
        <text x="50%" y="96%" font-size="28" font-family="ui-sans-serif, system-ui, -apple-system" text-anchor="middle" fill="#6c757d">
          QR de muestra · ${data.refId}
        </text>
      </svg>
    `.trim();
    const dataUri = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    qrImg.src = dataUri;
    qrImg.alt = "Código QR";
  }

  // 3) Última actualización (si los spans existen)
  const $last = $("#lastUpdated");
  const $rel  = $("#lastUpdatedRel");
  if ($last || $rel) {
    const lastUpdated = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const rel = (from) => {
      const s = Math.floor((Date.now() - from.getTime()) / 1000);
      if (s < 60) return `hace ${s}s`;
      const m = Math.floor(s / 60); if (m < 60) return `hace ${m}m`;
      const h = Math.floor(m / 60); if (h < 24) return `hace ${h}h`;
      const d = Math.floor(h / 24); return `hace ${d}d`;
    };

    if ($last) $last.textContent = fmt(lastUpdated);
    if ($rel)  {
      $rel.textContent = rel(lastUpdated);
      setInterval(() => { $rel.textContent = rel(lastUpdated); }, 30_000);
    }
  }

  // 4) Botón “Ver instrucciones” (no falla si falta el bloque o el botón)
  const btn = $("#btnInstr");
  const box = $("#instrBody");
  if (btn) {
    btn.addEventListener("click", () => {
      // Si no hay caja de instrucciones, no romper: solo alterna el texto del botón
      if (!box) {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", expanded ? "false" : "true");
        btn.textContent = expanded ? "Ver instrucciones" : "Ocultar instrucciones";
        return;
      }
      const isHidden = box.hasAttribute("hidden");
      if (isHidden) {
        box.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Ocultar instrucciones";
      } else {
        box.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Ver instrucciones";
      }
    });
  }
})();
