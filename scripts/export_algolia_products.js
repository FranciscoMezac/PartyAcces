/*
  Exporta los productos desde la BD a un JSON listo para Algolia Recommend.
  Mapea columnas locales -> esquema recomendado por el frontend:
    objectID, name, image, price, url, category, brand, tags

  Uso:
    node scripts/export_algolia_products.js [--all]

  - Por defecto exporta solo productos activos (activo = TRUE).
  - Con --all exporta todos.
*/

const fs = require('fs');
const path = require('path');
require('dotenv/config');
const db = require('../config/database');

async function columnExists(table, column) {
  const q = `SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2 LIMIT 1`;
  const r = await db.query(q, [table, column]);
  return r.rowCount > 0;
}

function toAlgoliaRecord(row) {
  return {
    objectID: row.algolia_object_id || String(row.id),
    name: row.nombre,
    image: row.image_url || null,
    price: row.puntos_requeridos,
    url: row.url || null,
    category: row.category || null,
    brand: row.brand || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    // atributos útiles para filtros/guardrails en Recommend
    activo: row.activo === true,
    stock: typeof row.stock === 'number' ? row.stock : null
  };
}

async function main() {
  const exportAll = process.argv.includes('--all');

  const hasAlgoliaId = await columnExists('productos', 'algolia_object_id');
  const hasCategory = await columnExists('productos', 'category');
  const hasBrand = await columnExists('productos', 'brand');
  const hasTags = await columnExists('productos', 'tags');
  const hasImage = await columnExists('productos', 'image_url');
  const hasUrl = await columnExists('productos', 'url');
  const hasStock = await columnExists('productos', 'stock');

  const select = [
    'id',
    'nombre',
    'puntos_requeridos',
    'activo',
    hasAlgoliaId ? 'COALESCE(algolia_object_id::text, id::text) AS algolia_object_id' : "id::text AS algolia_object_id",
    hasCategory ? 'category' : "NULL::varchar AS category",
    hasBrand ? 'brand' : "NULL::varchar AS brand",
    hasTags ? 'tags' : "ARRAY[]::text[] AS tags",
    hasImage ? 'image_url' : "NULL::text AS image_url",
    hasUrl ? 'url' : "NULL::text AS url",
    hasStock ? 'stock' : "NULL::int AS stock"
  ].join(', ');

  const where = exportAll ? '' : 'WHERE activo = TRUE';
  const sql = `SELECT ${select} FROM productos ${where} ORDER BY nombre ASC`;

  const r = await db.query(sql);
  const records = r.rows.map(toAlgoliaRecord);

  const outDir = path.join(process.cwd());
  const outFile = path.join(outDir, 'algolia_products.json');
  fs.writeFileSync(outFile, JSON.stringify(records, null, 2), 'utf8');

  console.log(`Exportados ${records.length} productos -> ${outFile}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fallo la exportación:', err.message);
  process.exit(1);
});
