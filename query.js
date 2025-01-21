

    const query = `
    WITH filtered_products AS (
      SELECT *
      FROM products p
      WHERE
      p.id_catalog IN (
        SELECT DISTINCT gpc.product_id
        FROM gifts_product_category gpc
        JOIN LATERAL jsonb_array_elements_text(gpc.category) cat_elem ON true
        WHERE cat_elem IN (
            SELECT DISTINCT jsonb_array_elements_text(id_gifts)
            FROM catalog_match
            WHERE id = $1
        )
          UNION
          SELECT DISTINCT opc.product_id
          FROM oasis_product_category opc
          JOIN LATERAL jsonb_array_elements_text(opc.category) cat_elem ON true
          WHERE cat_elem IN (
              SELECT DISTINCT jsonb_array_elements_text(id_oasis)
              FROM catalog_match
              WHERE id = $1
          )
      )
  ),
  first_group AS (
      SELECT DISTINCT ON (fp.product_parent_color_id) id
      FROM filtered_products fp
      ORDER BY fp.product_parent_color_id, fp.id
  ),
  second_group AS (
      SELECT DISTINCT ON (fp.product_parent_size_id) id
      FROM filtered_products fp
      WHERE fp.id NOT IN (SELECT id FROM first_group)
      ORDER BY fp.product_parent_size_id, fp.id
  ),
  temp_products AS (
    SELECT 
      fp.id as id, 
      fp.fullname as fullname, 
      fp.name as name, 
      fp.catalog as catalog, 
      fp.product_parent_color_id as product_parent_color_id, 
      fp.product_parent_size_id as product_parent_size_id,
      fp.code as code,
      CAST(fp.price AS INT) as price,
      fp.images as images
    FROM 
      filtered_products fp
    WHERE 
      fp.id IN (SELECT id FROM first_group)
      OR fp.id IN (SELECT id FROM second_group)
  ),
  colors_data AS (
    SELECT 
        c.parent_id, 
        jsonb_agg(jsonb_build_object(
            'product_id', c.product_id,
            'parent_id', c.parent_id,
            'color_name', c.color_name,
            'product_name', c.product_name,
            'color_hex', c.color_hex,
            'color_filter', c.color_filter,
            'color_image', c.color_image,
            'catalog', c.catalog)) AS colors
    FROM 
        colors c
    JOIN 
        temp_products tp ON c.parent_id = tp.product_parent_color_id AND c.catalog = tp.catalog
    GROUP BY 
        c.parent_id
),
sizes_data AS (
    SELECT 
        s.main_product, 
        jsonb_agg(jsonb_build_object(
            'product_id', s.product_id,
            'main_product', s.main_product,
            'code', s.code,
            'name', s.name,
            'barcode', s.barcode,
            'size_code', s.size_code,
            'weight', s.weight,
            'price', s.price,
            'catalog', s.catalog)) AS sizes
    FROM 
        sizes s
    JOIN 
        temp_products tp ON s.main_product = tp.product_parent_size_id AND s.catalog = tp.catalog
    GROUP BY 
        s.main_product
)
SELECT 
tp.id, 
tp.fullname, 
tp.name, 
tp.catalog,
COALESCE(cd.colors, 'null') AS colors,
COALESCE(sd.sizes, 'null') AS sizes,
tp.catalog, 
tp.product_parent_color_id, 
tp.product_parent_size_id,
tp.code,
CAST(tp.price AS INT),
tp.images,
COUNT(*) OVER () AS total_count
FROM 
    temp_products tp
LEFT JOIN 
    colors_data cd ON tp.product_parent_color_id = cd.parent_id
LEFT JOIN 
    sizes_data sd ON tp.product_parent_size_id = sd.main_product
ORDER BY 
    tp.product_parent_size_id, tp.id
LIMIT $2 OFFSET $3;
    `;