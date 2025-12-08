-- Exporta los productos activos a JSON con el formato que consume Algolia Recommend.
-- Uso desde psql (en la raiz del repo):
--   psql -f scripts/export_algolia_products.sql > algolia_products.json
-- o si prefieres que psql guarde directo el archivo:
--   \copy (SELECT jsonb_pretty(payload) FROM export_algolia_products()) TO 'C:/Users/frank/OneDrive/Escritorio/PartyAcces/algolia_products.json'

-- CTE principal para mapear columnas a las claves esperadas.
WITH rec AS (
  SELECT
    COALESCE(algolia_object_id::text, "objectID"::text) AS "objectID",
    name,
    -- Usa la columna disponible para imagen.
    COALESCE(image, image_url, NULL) AS image,
    price,
    url,
    category,
    brand,
    COALESCE(tags, ARRAY[]::text[]) AS tags,
    activo,
    stock
  FROM productos
  WHERE activo = TRUE
),
json_data AS (
  SELECT COALESCE(jsonb_agg(to_jsonb(rec)), '[]'::jsonb) AS payload
  FROM rec
)
-- Imprime un JSON de nivel raíz con el arreglo completo.
SELECT jsonb_pretty(payload)
FROM json_data;