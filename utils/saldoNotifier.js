// Simple notificador SSE por RUT
const subscribers = new Map(); // rut -> Set<res>

function subscribe(rut, res) {
  const key = String(rut);
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(res);
  res.on('close', () => {
    const set = subscribers.get(key);
    if (set) {
      set.delete(res);
      if (set.size === 0) subscribers.delete(key);
    }
  });
}

function publish(rut, nuevoSaldo) {
  const key = String(rut);
  const set = subscribers.get(key);
  if (!set) return;
  const payload = JSON.stringify({ rut: key, saldo: nuevoSaldo });
  for (const res of Array.from(set)) {
    try {
      res.write(`event: saldo\n`);
      res.write(`data: ${payload}\n\n`);
    } catch (_) {
      // si falla la conexión, se eliminará en 'close'
    }
  }
}

module.exports = { subscribe, publish };

