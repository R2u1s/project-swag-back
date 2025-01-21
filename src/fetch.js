import axios from 'axios'
import pkg from 'pg'
const { Pool } = pkg

// Данные для авторизации и URL
const API_KEY = 'keye4ec97e5166445c2aa992457419116bd'
const BASE_URL = 'https://api.oasiscatalog.com/v4/products'

// Пример запросов к API
const urls = [
  `${BASE_URL}?key=${API_KEY}&format=json&currency=rub`,
  `${BASE_URL}?key=${API_KEY}&format=json&currency=rub&category=1906`,
  `${BASE_URL}?key=${API_KEY}&format=json&currency=rub&category=2891&is_vip=0`
]

https://api.oasiscatalog.com/v4/products?key=keye4ec97e5166445c2aa992457419116bd&download=1&format=xml&currency=rub&fields=id%2C%20article%2C%20name%2C%20full_name%2C%20description%2C%20article_base%2C%20parent_color_id%2C%20parent_size_id%2C%20group_id%2C%20color_group_id%2C%20price%2C%20old_price%2C%20size%2C%20images%2C%20colors%2C%20categories%2C%20attributes%2C%20materials%2Cbrand%2Ccdr%2Cpackage%2Ccategories_array%2C%20full_categoriesm%2C%20main_category%2C%20total_stock%2C%20parent_id%2Cdiscount_price%2Cavailable_colors

const categoriesUrl = `https://api.oasiscatalog.com/v4/categories?key=${API_KEY}&format=json`
// // Подключение к базе данных PostgreSQL
// const pool = new Pool({
//   host: '77.238.247.8',
//   user: 'swag_user',
//   port: '5432',
//   password: 'admin123',
//   database: 'swag',
// })

const pool = new Pool({
  host: '77.238.247.8',
  user: 'swag_user',
  port: '5432',
  password: 'admin123',
  database: 'swag',
  // ssl: true
})

const groupedData = (data) => {
  const specificAttributesMap = {};

  data.forEach((product) => {
    const specificAttributes = product.attributes.filter(attr => attr.id === 1000000001 || attr.name === 'Размер');

    if (!specificAttributesMap[product.name]) {
      specificAttributesMap[product.name] = [];
    }

    specificAttributes.forEach(attr => {
      specificAttributesMap[product.name].push({
        ...attr,
        item_id: product.id
      });
    });
  });

  return data.map(product => ({
    ...product,
    attributes: [
      ...product.attributes.map(attr => ({ ...attr, item_id: product.id })),
      ...(specificAttributesMap[product.name] || [])
    ]
  }));
};

async function fetchData(url) {
  try {
    console.log(`Получение данных с API: ${url}`)
    const response = await axios.get(url);
    // if (!response.ok) {
    //   throw new Error('Ошибка сети: ' + response.statusText);
    // }
    console.log(`Успешное получение данных с API: ${url}`)
    const data = response.data
    return data;
  }
  catch (error) {
    console.error('Ошибка выполнения запроса:', error)
  }
}

async function saveData(data) {
  const client = await pool.connect();
  try {
    console.log(`Записываем данные в БД`)
    const queryText = `
    INSERT INTO albums (
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
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) ON CONFLICT (id) DO UPDATE
    SET 
      name = EXCLUDED.name, 
      full_name = EXCLUDED.full_name, 
      brand = EXCLUDED.brand,
      article = EXCLUDED.article,
      price = EXCLUDED.price,
      description = EXCLUDED.description,
      discount_price = EXCLUDED.discount_price,
      rating = EXCLUDED.rating,
      total_stock = EXCLUDED.total_stock,
      outlets = EXCLUDED.outlets,
      categories = EXCLUDED.categories,
      images = EXCLUDED.images,
      attributes = EXCLUDED.attributes,
      included_branding = EXCLUDED.included_branding,
      full_categories = EXCLUDED.full_categories;`;
    await Promise.all(data.map(async (product) => {
      console.log(product.name);
      await client.query(queryText, [
        product.id,
        product.name,
        product.full_name,
        product.brand,
        product.article,
        product.price,
        product.description,
        product.discount_price,
        product.rating,
        product.total_stock,
        JSON.stringify(product.outlets), // Преобразуем в JSON строку
        JSON.stringify(product.categories), // Преобразуем в JSON строку
        JSON.stringify(product.images), // Преобразуем в JSON строку
        JSON.stringify(product.attributes), // Преобразуем в JSON строку
        JSON.stringify(product.included_branding), // Преобразуем в JSON строку
        JSON.stringify(product.full_categories), // Преобразуем в JSON строку
      ]);
    }));
  } catch (error) {
    console.error('Ошибка при записи данных:', error);
  } finally {
    client.release();
  }
}

async function saveDataForCategories(categoriesData) {
  const client = await pool.connect();
  try {
    console.log(`Записываем данные в таблицу categories`);
    const queryText = `
    INSERT INTO categories (
      id,
      parent_id,
      root,
      lft,
      rgt,
      level,
      slug,
      name,
      path,
      sort,
      ltree_path
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    ) ON CONFLICT (id) DO UPDATE
    SET 
      parent_id = EXCLUDED.parent_id, 
      root = EXCLUDED.root, 
      lft = EXCLUDED.lft,
      rgt = EXCLUDED.rgt,
      level = EXCLUDED.level,
      slug = EXCLUDED.slug,
      name = EXCLUDED.name,
      path = EXCLUDED.path,
      sort = EXCLUDED.sort,
      ltree_path = EXCLUDED.ltree_path;
    `;
    await Promise.all(categoriesData.map(async (category) => {
      await client.query(queryText, [
        category.id,
        category.parent_id,
        category.root,
        category.lft,
        category.rgt,
        category.level,
        category.slug,
        category.name,
        category.path,
        category.sort,
        category.ltree_path,
      ]);
    }));
  } catch (error) {
    console.error('Ошибка при записи данных в таблицу categories:', error);
  } finally {
    client.release();
  }
}

async function main() {
  const data = await fetchData(urls[0]);
  if (data) {
    console.log('Попытка записи данных в БД');
    await saveData(groupedData(data));
    console.log('Здесь сообщение об успешной записи');
  }
  const data1 = await fetchData(urls[1]);
  if (data1) {
    console.log('Попытка записи данных в БД');
    await saveData(groupedData(data1));
    console.log('Здесь сообщение об успешной записи');
  }
  const data2 = await fetchData(urls[2]);
  if (data2) {
    console.log('Попытка записи данных в БД');
    await saveData(groupedData(data2));
    console.log('Здесь сообщение об успешной записи');
  }
/*   const data3 = await fetchData(categoriesUrl);
  if (data3) {
    console.log('Попытка записи данных в БД, таблица categories');

    if (Array.isArray(data3)) {
      await saveDataForCategories(data3);
    } else {
      console.error('Ожидался массив, но получен другой тип данных');
    }
    console.log('Здесь сообщение об успешной записи');
  } */
  await pool.end();
}

main().catch(err => console.error('Ошибка в основном процессе:', err));

// fetchAndStoreData(urls[0])

//Обработка каждого URL
// urls.forEach(fetchAndStoreData)

// fetchAndStoreData('https://api.oasiscatalog.com/v4/categories?key=keye4ec97e5166445c2aa992457419116bd&format=json&currency=rub')
// urls.forEach((data) => {
// })

// Закрытие соединения с БД после обработки всех URL
// setTimeout(() => {
//   console.log('Закрываем соединение с БД');
//   pool.end()
// }, 60000) // Увеличенное время ожидания для завершения всех операций

// import axios from 'axios'
// import pkg from 'pg'
// const { Pool } = pkg
// import xml2js from 'xml2js'
// import fs from 'fs/promises'

// // Данные для авторизации и URL
// const username = '89922_xmlexport'
// const password = 'ZAamnRJM'
// const baseAuth = Buffer.from(`${username}:${password}`).toString('base64')
// const urls = ['/response.json']

// // Подключение к базе данных PostgreSQL
// const pool = new Pool({
//   host: '77.238.247.8',
//   user: 'swag_user',
//   port: '5432',
//   password: 'admin123',
//   database: 'swag',
// })

// // Попытка подключения к базе данных
// pool
//   .connect()
//   .then(() => {
//     console.log('Успешно подключено к базе данных PostgreSQL.')
//   })
//   .catch((err) => {
//     console.error('Ошибка подключения к базе данных:', err.stack)
//     pool.end()
//   })

// const fetchAndStoreData = async (url) => {
//   try {
//     console.log(`Получение данных с API: ${url}`)
//     const response = await axios.get(url)
//     // const response = await axios.get(url, {
//     //   headers: { Authorization: `Basic ${baseAuth}` },
//     // })

//     // const parser = new xml2js.Parser()
//     // const result = await parser.parseStringPromise(response.data)
//     console.log('Идет запись в JSON...')
//     console.log(response)
//     // Записываем результат в response.json
//     // await fs.writeFile('response.json', JSON.stringify(result, null, 2))

//     // Сообщение об успешной записи
//     // console.log('Данные успешно записаны в response.json')

//     // Предполагается, что структура XML соответствует структуре JSON в предыдущем примере
//     // const products = result.products.product.slice(3668)

//     console.log(products)

//     // result.forEach(async (product) => {
//     //   const query = `
//     // INSERT INTO albums (
//     //   name,
//     //   full_name,
//     //   brand,
//     //   article,
//     //   price,
//     //   description,
//     //   discount_price,
//     //   rating,
//     //   total_stock,
//     //   outlets,
//     //   categories,
//     //   images,
//     //   attributes,
//     //   included_branding,
//     //   full_categories
//     // ) VALUES (
//     //   $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
//     // )`

//     //   const values = [
//     //     product.name[0],
//     //     product.full_name[0],
//     //     product.brand[0],
//     //     product.article[0],
//     //     product.price[0],
//     //     product.description[0],
//     //     product.discount_price[0],
//     //     product.rating[0],
//     //     product.total_stock[0],
//     //     JSON.stringify(product.outlets),
//     //     JSON.stringify(product.categories),
//     //     JSON.stringify(product.images),
//     //     JSON.stringify(product.attributes),
//     //     JSON.stringify(product.included_branding),
//     //     JSON.stringify(product.full_categories),
//     //   ]

//     //   try {
//     //     console.log('Начало записи данных в базу данных...')
//     //     await pool.query(query, values)
//     //     console.log('Данные успешно вставлены в базу данных.')
//     //   } catch (err) {
//     //     console.error('Ошибка вставки данных:', err.stack)
//     //   }
//     // })
//   } catch (error) {
//     console.error('Ошибка выполнения запроса:', error)
//   }
// }

// // Обработка каждого URL
// fetchAndStoreData('D:/Work/back_template-nodeJS/response.json')
// axios.get('/response.json').then((data) => console.log(data))
// urls.forEach((url) => {
// })

// // Закрытие соединения с БД после обработки всех URL
// setTimeout(() => {
//   pool.end()
// }, 60000) // Увеличенное время ожидания для завершения всех операций

// fetch('/response.json').then((data) => console.log(data))
