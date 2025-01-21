import { pool } from '../../connection.js'
import { StatusCodes } from 'http-status-codes'
import { NotFoundError } from '../../errors/index.js';
import axios from 'axios';

// Данные для авторизации и URL
const API_KEY = 'keye4ec97e5166445c2aa992457419116bd'
const BASE_URL = 'https://api.oasiscatalog.com/v4/products'

export const getCartProduct = async (req, res) => {
  const { ids } = req.body

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Массив ID обязателен и не может быть пустым' })
  }

  const query = `
    SELECT 
        id,
        name, 
        full_name, 
        brand, 
        article, 
        price, 
        description, 
        discount_price, 
        rating, 
        total_stock, 
        outlets, 
        categories, 
        images, 
        attributes, 
        included_branding, 
        full_categories
    FROM albums
    WHERE id = ANY($1);
  `

  try {
    const result = await pool.query(query, [ids])
    res.status(StatusCodes.OK).json(result.rows)
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.stack)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Внутренняя ошибка сервера' })
  }
}

export const cartProducts = async (req, res) => {
  const { arrayId } = req.body

  if (!Array.isArray(arrayId) || arrayId.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Массив ID обязателен и не может быть пустым' })
  }

  const query = `
  WITH initial_product AS (
    SELECT 
        p.id,
        p.id_catalog,
        p.fullname,
        p.name, 
        p.code,
        CAST(p.price AS INT),
        p.images,
        p.print,
        CAST(p.discount_price AS INT),
        p.product_parent_color_id, 
        p.product_parent_size_id,
        p.catalog
    FROM 
        products p
    WHERE 
        p.id = ANY($1)
),
colors_data AS (
    SELECT 
        c.product_id, 
        jsonb_agg(jsonb_build_object(
          'product_id', c.product_id,
          'parent_id', c.parent_id,
          'color_name', c.color_name,
          'color_hex', c.color_hex,
          'catalog', c.catalog)) AS colors
    FROM 
        colors c
    JOIN 
        initial_product ip ON c.product_id = ip.id_catalog AND c.catalog = ip.catalog
    GROUP BY 
        c.product_id
),
sizes_data AS (
    SELECT 
        s.product_id, 
        jsonb_agg(jsonb_build_object(
          'product_id', s.product_id,
          'main_product', s.main_product,
          'code', s.code,
          'size_code', s.size_code,
          'price', s.price,
          'catalog', s.catalog)) AS sizes
    FROM 
        sizes s
    JOIN 
        initial_product ip ON s.product_id = ip.id_catalog AND s.catalog = ip.catalog
    GROUP BY 
        s.product_id
)
SELECT 
    ip.id,
    ip.id_catalog,
    ip.fullname,
    ip.name, 
    ip.code,
    CAST(ip.price AS INT),
    ip.images,
    ip.print,
    CAST(ip.discount_price AS INT),
    ip.product_parent_color_id, 
    ip.product_parent_size_id,
    ip.catalog,
    COALESCE(cd.colors, 'null') AS colors,
    COALESCE(sd.sizes, 'null') AS sizes
FROM 
    initial_product ip
LEFT JOIN 
    colors_data cd ON ip.id_catalog = cd.product_id
LEFT JOIN 
    sizes_data sd ON ip.id_catalog = sd.product_id;
  `
  try {
    const result = await pool.query(query, [arrayId])
    res.status(StatusCodes.OK).json(result.rows)
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.stack)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Внутренняя ошибка сервера' })
  }
}

// export const findCategory = async (req, res) => {
//   const query = `WITH album_info AS (
//   SELECT

//     array_agg(DISTINCT c.name) AS categories
//   FROM
//     albums a
//   LEFT JOIN LATERAL
//     jsonb_array_elements_text(a.categories) AS category_id_text ON true
//   LEFT JOIN
//     categories c ON (category_id_text)::integer = c.id
//   GROUP BY
//     a.id,
//     a.name
// )
// SELECT * FROM album_info;
// `

//   try {
//     const result = await pool.query(query)
//     res.status(StatusCodes.OK).json(result.rows)
//   } catch (error) {
//     console.error('Ошибка при выполнении запроса:', error.stack)
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Внутренняя ошибка сервера' })
//   }
// }



export const getAllCountProducts = async (req, res) => {
  const query = `select count(*) from products`
  const result = await pool.query(query)
  // if (result.rowCount < 1) throw new res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Ошибка' })
  res.status(StatusCodes.OK).json(result.rows)
}

// let query = `
//   SELECT
//   id,
//   name,
//   full_name,
//   brand,
//   article,
//   price,
//   description,
//   discount_price,
//   rating,
//   total_stock,
//   outlets,
//   categories,
//   images,
//   attributes,
//   included_branding,
//   full_categories
//   FROM albums`

export async function findMany(req, res) {
  const { start, end } = req.query

  let query = `
  WITH album_info AS (
    SELECT
        a.id,
        a.name,
        a.full_name,
        a.brand,
        a.article,
        a.price,
        a.description,
        a.discount_price,
        a.rating,
        a.total_stock,
        a.outlets,
        array_agg(DISTINCT c.name) AS categories,
        a.images,
        a.attributes,
        a.included_branding,
        a.full_categories
    FROM
        albums a
    LEFT JOIN LATERAL
        jsonb_array_elements_text(a.categories) AS category_id_text ON true
    LEFT JOIN
        categories c ON (category_id_text)::integer = c.id
    GROUP BY
        a.id,
        a.name,
        a.full_name,
        a.brand,
        a.article,
        a.price,
        a.description,
        a.discount_price,
        a.rating,
        a.total_stock,
        a.outlets,
        a.images,
        a.attributes,
        a.included_branding,
        a.full_categories
)

SELECT *
FROM album_info
ORDER BY
    CASE
        WHEN 'Топы и безрукавки' = ANY(album_info.categories) THEN 1
        WHEN 'Футболки' = ANY(album_info.categories) THEN 2
        WHEN 'Поло' = ANY(album_info.categories) THEN 3
        WHEN 'Свитеры и Толстовки' = ANY(album_info.categories) THEN 4
        WHEN 'Спортивные костюмы' = ANY(album_info.categories) THEN 5
        WHEN 'Юбки' = ANY(album_info.categories) THEN 6
        WHEN 'Куртки' = ANY(album_info.categories) THEN 7
        WHEN 'Ветровки' = ANY(album_info.categories) THEN 8
        WHEN 'Дождевики' = ANY(album_info.categories) THEN 9
        WHEN 'Жилеты' = ANY(album_info.categories) THEN 10
        WHEN 'Головные уборы' = ANY(album_info.categories) THEN 11
        WHEN 'Бейсболки и панамы' = ANY(album_info.categories) THEN 12
        WHEN 'Козырьки от солнца' = ANY(album_info.categories) THEN 13
        WHEN 'Повязки на голову' = ANY(album_info.categories) THEN 14
        WHEN 'Шляпы' = ANY(album_info.categories) THEN 15
        WHEN 'Шапки' = ANY(album_info.categories) THEN 16
        WHEN 'Обувь' = ANY(album_info.categories) THEN 17
        WHEN 'Носки' = ANY(album_info.categories) THEN 18
        WHEN 'Варежки и перчатки' = ANY(album_info.categories) THEN 19
        WHEN 'Шарфы' = ANY(album_info.categories) THEN 20
        WHEN 'Ремни' = ANY(album_info.categories) THEN 21
        WHEN 'Платки' = ANY(album_info.categories) THEN 22
        WHEN 'Профессиональная одежда' = ANY(album_info.categories) THEN 23
        WHEN 'Сигнальная одежда' = ANY(album_info.categories) THEN 24
        WHEN 'Рабочая одежда' = ANY(album_info.categories) THEN 25
        WHEN '' = ANY(album_info.categories) THEN 26
    END
    LIMIT $1
    OFFSET (($2 - 1) * $2);
    `

  /*   if (count) {
      const parsedCount = parseInt(count, 10)
      if (!isNaN(parsedCount) && parsedCount > 0) {
        query += ` LIMIT ${parsedCount}`
      }
    }
  
    if (start && end) {
      const parsedStart = parseInt(start, 10)
      const parsedEnd = parseInt(end, 10)
  
      if (!isNaN(parsedStart) && !isNaN(parsedEnd) && parsedStart >= 0 && parsedEnd >= parsedStart) {
        query += ` LIMIT ${parsedEnd - parsedStart + 1} OFFSET ${parsedStart}`
      }
    } */

  const result = await pool.query(query, [parseInt(start, 10), parseInt(end, 10)])
  // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function findOne(req, res) {
  const { id } = req.params;
  const query = `
  WITH initial_product AS (
    SELECT 
        p.id,
        p.id_catalog,
        p.fullname,
        p.name, 
        p.code,
        p.size,
        p.color,
        p.product_size,
        p.material,
        p.content,
        p.brand,
        CAST(p.weight AS INT),
        CAST(p.price AS INT),
        p.images,
        p.images_more,
        p.pack,
        p.print,
        p.discount_price::numeric, 
        p.product_parent_color_id, 
        p.product_parent_size_id,
        p.catalog
    FROM 
        products p
    WHERE 
        p.id = $1
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
        initial_product ip ON c.parent_id = ip.product_parent_color_id AND c.catalog = ip.catalog
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
        initial_product ip ON s.main_product = ip.product_parent_size_id
    GROUP BY 
        s.main_product
)
SELECT 
    ip.id,
    ip.id_catalog,
    ip.fullname,
    ip.name, 
    ip.code,
    ip.size,
    ip.color,
    ip.product_size,
    ip.material,
    ip.content,
    ip.brand,
    CAST(ip.weight AS INT),
    CAST(ip.price AS INT),
    ip.images,
    ip.images_more,
    ip.pack,
    ip.print,
    ip.discount_price::numeric, 
    ip.product_parent_color_id, 
    ip.product_parent_size_id,
    ip.catalog,
    COALESCE(cd.colors, 'null') AS colors,
    COALESCE(sd.sizes, 'null') AS sizes
FROM 
    initial_product ip
LEFT JOIN 
    colors_data cd ON ip.product_parent_color_id = cd.parent_id
LEFT JOIN 
    sizes_data sd ON ip.product_parent_size_id = sd.main_product;
    `
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError('Товар не найден')
  return res.status(StatusCodes.OK).json(result.rows[0])
}

export async function anotherColorProduct(req, res) {
  const { id, catalog } = req.query;
  console.log(id + ' ' + catalog);
  const query = `
  WITH initial_product AS (
    SELECT 
        p.id,
        p.id_catalog,
        p.fullname,
        p.name, 
        p.code,
        p.size,
        p.color,
        p.product_size,
        p.material,
        p.content,
        p.brand,
        CAST(p.weight AS INT),
        CAST(p.price AS INT),
        p.images,
        p.images_more,
        p.pack,
        p.print,
        p.discount_price::numeric, 
        p.product_parent_color_id, 
        p.product_parent_size_id,
        p.catalog
    FROM 
        products p
    WHERE 
        p.id_catalog = $1 AND p.catalog = $2
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
        initial_product ip ON c.parent_id = ip.product_parent_color_id AND c.catalog = ip.catalog
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
        initial_product ip ON s.main_product = ip.product_parent_size_id
    GROUP BY 
        s.main_product
)
SELECT 
    ip.id,
    ip.id_catalog,
    ip.fullname,
    ip.name, 
    ip.code,
    ip.size,
    ip.color,
    ip.product_size,
    ip.material,
    ip.content,
    ip.brand,
    CAST(ip.weight AS INT),
    CAST(ip.price AS INT),
    ip.images,
    ip.images_more,
    ip.pack,
    ip.print,
    ip.discount_price::numeric, 
    ip.product_parent_color_id, 
    ip.product_parent_size_id,
    ip.catalog,
    COALESCE(cd.colors, 'null') AS colors,
    COALESCE(sd.sizes, 'null') AS sizes
FROM 
    initial_product ip
LEFT JOIN 
    colors_data cd ON ip.product_parent_color_id = cd.parent_id
LEFT JOIN 
    sizes_data sd ON ip.product_parent_size_id = sd.main_product;
    `
  const result = await pool.query(query, [id, catalog])
  if (result.rowCount < 1) throw new NotFoundError('Товар не найден')
  return res.status(StatusCodes.OK).json(result.rows[0])
}

export async function gelAllBrand(req, res) {
  // const { id } = req.params
  const query = `SELECT DISTINCT brand
FROM albums
WHERE brand IS NOT NULL;`
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new Error('Товар не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function findProductToCategoy(req, res) {
  const { category } = req.body
  const { start, end } = req.query
  let query = `
  WITH album_info AS (
    SELECT
      a.id,
      a.name,
      a.full_name,
      a.brand,
      a.article,
      CAST(a.price AS INT),
      a.description,
      CAST(a.discount_price AS INT),
      a.rating,
      a.total_stock,
      a.outlets,
      array_agg(DISTINCT c.name) AS categories,
      a.images,
      a.attributes,
      a.included_branding,
      a.full_categories
    FROM
      albums a
    LEFT JOIN LATERAL
      jsonb_array_elements_text(a.categories) AS category_id_text ON true
    LEFT JOIN
      categories c ON (category_id_text)::integer = c.id
    GROUP BY
      a.id,
      a.name,
      a.full_name,
      a.brand,
      a.article,
      CAST(a.price AS INT),
      a.description,
      CAST(a.discount_price AS INT),
      a.rating,
      a.total_stock,
      a.outlets,
      a.images,
      a.attributes,
      a.included_branding,
      a.full_categories
)
SELECT DISTINCT ON (name) *
FROM album_info
WHERE $1 = ANY(categories)
ORDER BY name, RANDOM()
LIMIT $2
OFFSET (($3 - 1) * $2);
`
  /*   if (start && end) {
      const parsedStart = parseInt(start, 10)
      const parsedEnd = parseInt(end, 10)
  
      if (!isNaN(parsedStart) && !isNaN(parsedEnd) && parsedStart >= 0 && parsedEnd >= parsedStart) {
        query += ` LIMIT ${parsedEnd - parsedStart + 1} OFFSET ${parsedStart}`
      }
    } */

  const result = await pool.query(query, [category, parseInt(start, 10), parseInt(end, 10)])
  // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function getCategoryProducts(req, res) {
  const { category } = req.body
  const { pagination, page } = req.query

  const offset = (page - 1) * pagination;

  try {
    //тут кустарно добавлено условие, что если идет запрос всего каталога, то есть номер категории = 1, то убираем условие WHERE
    //надо поприличнее сделать
    let query = `
    SELECT 
      id, 
      name,
      code,
      catalog,
      price,
      discount_price,
      colors, 
      sizes,
      images,
      total_count
    FROM (
      SELECT 
        id, 
        name,
        code,
        catalog,
        price,
        discount_price,
        colors, 
        sizes,
        images,
        COUNT(*) OVER() AS total_count
      FROM products_filter
      ${category !== '1' ? 'WHERE categories @> to_jsonb(ARRAY[$1]::text[])' : ''}
    ) AS subquery
    ${category !== '1' ? 'LIMIT $2 OFFSET $3' : 'LIMIT $1 OFFSET $2'};
  `;

    const result = await pool.query(query, category !== '1' ? [category, pagination, offset] : [pagination, offset]);

    return res.status(StatusCodes.OK).json(result.rows);
  } catch (err) {
    console.error('Ошибка выполнения запроса:', err);
    throw err;
  }
  /*   const result = await pool.query(query, [category, parseInt(start, 10), parseInt(end, 10)])
    // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
    return res.status(StatusCodes.OK).json(result.rows) */
}

export async function getCategoryInfo(req, res) {
  const { id } = req.query;
  
  if (id === '1') {
    res.status(StatusCodes.OK).json({id:"1",name:"Каталог",parent:null})
  }; 
  const query = `
  WITH RECURSIVE category_hierarchy AS (
    SELECT 
      id, 
      name, 
      parent_id
    FROM 
      catalog
    WHERE 
      id = $1
  
    UNION ALL
  
    SELECT 
      c.id, 
      c.name, 
      c.parent_id
    FROM 
      catalog c
    JOIN 
      category_hierarchy ch ON c.id = ch.parent_id::text
  )
  SELECT 
    ch.id,
    ch.name,
    (
      SELECT jsonb_agg(jsonb_build_object('id', ch2.id, 'name', ch2.name)) 
      FROM category_hierarchy ch2
      WHERE ch2.id <> ch.id
    ) AS parent
  FROM 
    category_hierarchy ch
  WHERE 
    ch.id = $1;
    `
  const result = await pool.query(query, [id]);
  if (result.rowCount < 1) throw new NotFoundError('Категория не найдена')
  return res.status(StatusCodes.OK).json(result.rows[0])
}

export async function getAllCategories(req, res) {

  try {
    const query = `
    WITH RECURSIVE category_tree AS (
      SELECT 
          id,
          name,
          name_eng,
          parent_id
      FROM 
          catalog
      WHERE 
          parent_id = '1'
      
      UNION ALL
      
      SELECT 
          c.id,
          c.name,
          c.name_eng,
          c.parent_id
      FROM 
          catalog c
      JOIN 
          category_tree ct ON ct.id = c.parent_id
  ),
  category_hierarchy AS (
      SELECT 
          ct.id,
          ct.name,
          ct.name_eng,
          ct.parent_id,
          (
              SELECT 
                  COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
                      'id', sc.id,
                      'name', sc.name,
                      'name_eng', sc.name_eng,
                      'child', (
                          SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
                              'id', ssc.id,
                              'name', ssc.name,
                              'name_eng', ssc.name_eng
                          )), '[]'::json)
                          FROM catalog ssc
                          WHERE ssc.parent_id = sc.id
                      )
                  )), '[]'::json)
              FROM 
                  catalog sc
              WHERE 
                  sc.parent_id = ct.id
          ) AS child
      FROM 
          category_tree ct
  )
  SELECT 
      id,
      name,
      name_eng,
      parent_id,
      child
  FROM 
      category_hierarchy
  ORDER BY 
      id;
    `;

    const result = await pool.query(query);

    return res.status(StatusCodes.OK).json(result.rows);
  } catch (err) {
    console.error('Ошибка выполнения запроса:', err);
    throw err;
  }
  /*   const result = await pool.query(query, [category, parseInt(start, 10), parseInt(end, 10)])
    // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
    return res.status(StatusCodes.OK).json(result.rows) */
}

export async function getGroupProducts(req, res) {
  const { arrayId } = req.body

  if (!Array.isArray(arrayId) || arrayId.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Массив ID обязателен и не может быть пустым' })
  }

  try {
    const query = `
    WITH initial_product AS (
      SELECT 
          p.id,
          p.id_catalog,
          p.fullname,
          p.name, 
          p.code,
          CAST(p.price AS INT),
          p.images,
          p.print,
          CAST(p.discount_price AS INT),
          p.product_parent_color_id, 
          p.product_parent_size_id,
          p.catalog
      FROM 
          products p
      WHERE 
          p.id = ANY($1)
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
        initial_product ip ON c.parent_id = ip.product_parent_color_id AND c.catalog = ip.catalog
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
        initial_product ip ON s.main_product = ip.product_parent_size_id
    GROUP BY 
        s.main_product
)
  SELECT 
      ip.id,
      ip.id_catalog,
      ip.fullname,
      ip.name, 
      ip.code,
      CAST(ip.price AS INT),
      ip.images,
      ip.print,
      CAST(ip.discount_price AS INT),
      ip.product_parent_color_id, 
      ip.product_parent_size_id,
      ip.catalog,
      COALESCE(cd.colors, 'null') AS colors,
      COALESCE(sd.sizes, 'null') AS sizes
  FROM 
      initial_product ip
  LEFT JOIN 
      colors_data cd ON ip.product_parent_color_id = cd.parent_id
  LEFT JOIN 
      sizes_data sd ON ip.product_parent_size_id = sd.main_product
    `;

    const result = await pool.query(query, [arrayId]);
    //console.dir(result.rows,{ depth: null });
    return res.status(StatusCodes.OK).json(result.rows);
  } catch (err) {
    console.error('Ошибка выполнения запроса:', err);
    throw err;
  }
  /*   const result = await pool.query(query, [category, parseInt(start, 10), parseInt(end, 10)])
    // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
    return res.status(StatusCodes.OK).json(result.rows) */
}

export async function getCategoryProductsCount(req, res) {
  const { category } = req.body

  console.log('category: ' + category);
  /*   const result = await pool.query(query, [category, parseInt(start, 10), parseInt(end, 10)])
    // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
    return res.status(StatusCodes.OK).json(result.rows) */
}


export async function findSimilarProducts(req, res) {
  const { id } = req.params
  let query = `
  WITH initial_product AS (
    -- Получаем первоначальные товары (за исключением исходного id)
    WITH category_number_cte AS (
      SELECT 
        CASE 
          WHEN catalog = 'gifts' THEN 
            (SELECT category->>0
             FROM gifts_product_category
             WHERE product_id = products.id_catalog)
          WHEN catalog = 'oasis' THEN 
            (SELECT category->>0
             FROM oasis_product_category
             WHERE product_id = products.id_catalog)
          ELSE NULL 
        END AS category_number
      FROM 
        products
      WHERE 
        id = $1
    )
    SELECT 
        p.id,
        p.id_catalog,
        p.fullname,
        p.name, 
        p.code,
        CAST(p.price AS INT),
        p.images,
        p.print,
        CAST(p.discount_price AS INT),
        p.product_parent_color_id, 
        p.product_parent_size_id,
        p.catalog
    FROM 
        products p
    WHERE 
        p.id_catalog IN (
          SELECT product_id 
          FROM gifts_product_category
          WHERE category->>0 = (SELECT category_number FROM category_number_cte)
          UNION ALL
          SELECT product_id 
          FROM oasis_product_category
          WHERE category->>0 = (SELECT category_number FROM category_number_cte)
        )
        AND p.id != $1
    LIMIT 10
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
        initial_product ip ON c.parent_id = ip.product_parent_color_id AND c.catalog = ip.catalog
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
        initial_product ip ON s.main_product = ip.product_parent_size_id
    GROUP BY 
        s.main_product
  )
  SELECT 
      ip.id,
      ip.id_catalog,
      ip.fullname,
      ip.name, 
      ip.code,
      CAST(ip.price AS INT),
      ip.images,
      ip.print,
      CAST(ip.discount_price AS INT),
      ip.product_parent_color_id, 
      ip.product_parent_size_id,
      ip.catalog,
      COALESCE(cd.colors, 'null') AS colors,
      COALESCE(sd.sizes, 'null') AS sizes
  FROM 
      initial_product ip
  LEFT JOIN 
      colors_data cd ON ip.product_parent_color_id = cd.parent_id
  LEFT JOIN 
      sizes_data sd ON ip.product_parent_size_id = sd.main_product;
`
  /*   if (start && end) {
      const parsedStart = parseInt(start, 10)
      const parsedEnd = parseInt(end, 10)
  
      if (!isNaN(parsedStart) && !isNaN(parsedEnd) && parsedStart >= 0 && parsedEnd >= parsedStart) {
        query += ` LIMIT ${parsedEnd - parsedStart + 1} OFFSET ${parsedStart}`
      }
    } */

  const result = await pool.query(query, [id])
  // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function searchProduct(req, res) {
  const { name } = req.body
  const { pagination, page } = req.query

  const offset = (page - 1) * pagination;

  let substrings = name.split(' ').map(substring => substring.replace(/['"«»]/g, ''));

  let resRows = [];

  function loop() {
    const params = [
      ...substrings.map(substring => `%${substring}%`),
      pagination,
      offset.toString()
    ];

    const query = `
    WITH initial_product AS (
      SELECT 
          p.id,
          p.id_catalog,
          p.fullname,
          p.name, 
          p.code,
          CAST(p.price AS INT),
          p.images,
          p.print,
          CAST(p.discount_price AS INT),
          p.product_parent_color_id, 
          p.product_parent_size_id,
          p.catalog
      FROM 
          products p
      WHERE ${substrings.map((_, index) => `LOWER(p.name) LIKE LOWER($${index + 1})`).join(' AND ')}
  ),
  colors_data AS (
      SELECT 
          c.parent_id, 
          jsonb_agg(DISTINCT jsonb_build_object(
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
          initial_product ip ON c.parent_id = ip.product_parent_color_id AND c.catalog = ip.catalog
          -- Ensure distinction based on parent_id
      GROUP BY 
          c.parent_id
  ),
  sizes_data AS (
      SELECT 
          s.main_product, 
          jsonb_agg(DISTINCT jsonb_build_object(
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
          initial_product ip ON s.main_product = ip.product_parent_size_id
          -- Ensure distinction based on main_product
      GROUP BY 
          s.main_product
  )
  SELECT 
      DISTINCT ON (ip.product_parent_color_id, ip.product_parent_size_id) 
      ip.id,
      ip.id_catalog,
      ip.fullname,
      ip.name, 
      ip.code,
      CAST(ip.price AS INT),
      ip.images,
      ip.print,
      CAST(ip.discount_price AS INT),
      ip.product_parent_color_id, 
      ip.product_parent_size_id,
      ip.catalog,
      COALESCE(cd.colors, 'null') AS colors,
      COALESCE(sd.sizes, 'null') AS sizes
  FROM 
      initial_product ip
  LEFT JOIN 
      colors_data cd ON ip.product_parent_color_id = cd.parent_id
  LEFT JOIN 
      sizes_data sd ON ip.product_parent_size_id = sd.main_product
  LIMIT $${substrings.length + 1} OFFSET $${substrings.length + 2}
    `
    if (resRows.length > 0 || substrings.length === 0) return res.status(StatusCodes.OK).json(resRows);
    return pool.query(query, params).then((result) => {
      resRows = result.rows;
      substrings.pop();
      if (substrings.length > 0 || resRows.length === 0) {
        return loop(); // Повторяем, пока не найдем результат или поисковая строка не станет пустой
      } else {
        return res.status(StatusCodes.OK).json(resRows);
      }
    });
  }
  loop();
}

export async function findProductOtherColor(req, res) {

  const { name } = req.body
  console.log(name);
  let query = `WITH album_info AS (
  SELECT
    a.id,
    a.name,
    a.full_name,
    a.brand,
    a.article,
    a.price,
    a.description,
    a.discount_price,
    a.rating,
    a.total_stock,
    a.outlets,
    array_agg(DISTINCT c.name) AS categories,
    a.images,
    a.attributes,
    a.included_branding,
    a.full_categories
  FROM
    albums a
  LEFT JOIN LATERAL
    jsonb_array_elements_text(a.categories) AS category_id_text ON true
  LEFT JOIN
    categories c ON (category_id_text)::integer = c.id
  GROUP BY
    a.id,
    a.name,
    a.full_name,
    a.brand,
    a.article,
    a.price,
    a.description,
    a.discount_price,
    a.rating,
    a.total_stock,
    a.outlets,
    a.images,
    a.attributes,
    a.included_branding,
    a.full_categories
)
SELECT *
FROM album_info
WHERE LOWER(full_name) LIKE LOWER($1)`

  /*   if (start && end) {
      const parsedStart = parseInt(start, 10)
      const parsedEnd = parseInt(end, 10)
  
      if (!isNaN(parsedStart) && !isNaN(parsedEnd) && parsedStart >= 0 && parsedEnd >= parsedStart) {
        query += ` LIMIT ${parsedEnd - parsedStart + 1} OFFSET ${parsedStart}`
      }
    } */

  const result = await pool.query(query, [name])
  console.log(result.rowCount);
  if (result.rowCount < 1) throw new res.status(StatusCodes.NOT_FOUND).json({ error: 'Товар по категории не найден' })
  console.log(2);
  return res.status(StatusCodes.OK).json({ data: result.rows, count: result.rows.length })
}

export async function searchProductCount(req, res) {
  const { name } = req.body
  const { start, end } = req.query
  let query = `WITH album_info AS (
  SELECT
    a.id,
    a.name,
    a.full_name,
    a.brand,
    a.article,
    a.price,
    a.description,
    a.discount_price,
    a.rating,
    a.total_stock,
    a.outlets,
    array_agg(DISTINCT c.name) AS categories,
    a.images,
    a.attributes,
    a.included_branding,
    a.full_categories
  FROM
    albums a
  LEFT JOIN LATERAL
    jsonb_array_elements_text(a.categories) AS category_id_text ON true
  LEFT JOIN
    categories c ON (category_id_text)::integer = c.id
  GROUP BY
    a.id,
    a.name,
    a.full_name,
    a.brand,
    a.article,
    a.price,
    a.description,
    a.discount_price,
    a.rating,
    a.total_stock,
    a.outlets,
    a.images,
    a.attributes,
    a.included_branding,
    a.full_categories
)
SELECT count(*)
FROM album_info
WHERE name LIKE $1`
  const result = await pool.query(query, [name])
  if (result.rowCount < 1) throw new res.status(StatusCodes.NOT_FOUND).json({ error: 'Товар по категории не найден' })
  return res.status(StatusCodes.OK).json(result.rows)
}

export const countCategory = async (req, res) => {
  const { category } = req.body
  let query = `WITH album_info AS (
  SELECT
    a.id,
    a.name,
    a.full_name,
    a.brand,
    a.article,
    a.price,
    a.description,
    a.discount_price,
    a.rating,
    a.total_stock,
    a.outlets,
    array_agg(DISTINCT c.name) AS categories,
    a.images,
    a.attributes,
    a.included_branding,
    a.full_categories
  FROM
    albums a
  LEFT JOIN LATERAL
    jsonb_array_elements_text(a.categories) AS category_id_text ON true
  LEFT JOIN
    categories c ON (category_id_text)::integer = c.id
  GROUP BY
    a.id,
    a.name,
    a.full_name,
    a.brand,
    a.article,
    a.price,
    a.description,
    a.discount_price,
    a.rating,
    a.total_stock,
    a.outlets,
    a.images,
    a.attributes,
    a.included_branding,
    a.full_categories
)
SELECT COUNT(*)
FROM album_info
WHERE $1 = ANY(categories);
`

  const result = await pool.query(query, [category])
  // if (result.rowCount < 1) throw new NotFoundError('Товар по категории не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export const filterProduct = async (req, res) => {
  const { start_price, end_price, brand } = req.body
  const { start, end } = req.query

  let query = `SELECT * FROM albums WHERE 1=1`
  let countQuery = `SELECT COUNT(*) FROM albums WHERE 1=1`
  const params = []

  if (start_price !== undefined && end_price !== undefined) {
    query += ` AND discount_price::numeric BETWEEN $1 AND $2`
    countQuery += ` AND discount_price::numeric BETWEEN $1 AND $2`
    params.push(start_price, end_price)
  }

  if (brand && brand.length > 0) {
    const brandPlaceholders = brand.map((_, index) => `$${params.length + index + 1}`).join(', ')
    query += ` AND brand IN (${brandPlaceholders})`
    countQuery += ` AND brand IN (${brandPlaceholders})`
    params.push(...brand)
  }

  if (start && end) {
    const parsedStart = parseInt(start, 10)
    const parsedEnd = parseInt(end, 10)

    if (!isNaN(parsedStart) && !isNaN(parsedEnd) && parsedStart >= 0 && parsedEnd >= parsedStart) {
      query += ` LIMIT ${parsedEnd - parsedStart + 1} OFFSET ${parsedStart}`
    }
  }

  try {
    // Выполнение запроса на подсчет строк
    const countResult = await pool.query(countQuery, params)
    const totalRows = countResult.rows[0].count

    // Выполнение основного запроса
    const result = await pool.query(query, params)
    if (result.rowCount < 1) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Товар по категории не найден' })
    }

    return res.status(StatusCodes.OK).json({
      rows: result.rows,
      totalRows: totalRows,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Ошибка при выполнении запроса' })
  }
}

export async function findFiles(req, res) {
  const { id } = req.params;

  try {

    const response = await axios.get(`${BASE_URL}/${id}?key=${API_KEY}&fields=cdr`);
    return res.json(response.data);

  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Ошибка при выполнении запроса' })
  }
}

export async function getImageGifts(req, res) {
  const imageUrl = `https://api2.gifts.ru/export/v2/catalogue/${req.query.url}`;

  try {
    const username = '89922_xmlexport';
    const password = 'ZAamnRJM';
    const auth = `${username}:${password}`;
    const authEncoded = Buffer.from(auth).toString('base64');

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Basic ${authEncoded}`
      }
    });

    const contentType = response.headers['content-type'];
    res.set('Content-Type', contentType);
    res.send(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при получении изображения');
  }
}

export async function findPrintOptions(req, res) {

  const { id } = req.params;

  console.log(id);

  try {
    const catalogReq = await pool.query(`
    SELECT url 
    FROM print_options_url 
    WHERE catalog = (SELECT catalog FROM products WHERE id = $1);`, [id]);
    console.log(`${catalogReq.rows[0].url}`);
    if (catalogReq.rowCount < 1) throw new NotFoundError('Товар не найден');

    return res.status(StatusCodes.OK).json(catalogReq.rows[0].url)

  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Ошибка при выполнении запроса' })
  }
}
