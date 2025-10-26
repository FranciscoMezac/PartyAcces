(() => {
  const form = document.getElementById('form-acumular');
  const msg = document.getElementById('resultado');
  if (!form) return;

  function show(type, text) {
    msg.className = 'msg ' + (type === 'ok' ? 'ok' : 'err');
    msg.textContent = text;
    msg.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.style.display = 'none';
    const rut = form.rut.value.trim();
    const monto = Number(form.monto.value);

    try {
      const res = await fetch('/api/puntos/acumular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, monto })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        show('ok', `Puntos acreditados: ${data.puntos}. Nuevo saldo: ${data.nuevoSaldo}.`);
        form.monto.value = '';
      } else {
        show('err', data.error || 'No fue posible acreditar puntos.');
      }
    } catch (err) {
      show('err', err.message || 'Error de red');
    }
  });
})();

