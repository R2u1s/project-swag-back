import axios from 'axios'
import pkg from 'pg'
const { Pool } = pkg

// Подключение к базе данных PostgreSQL
const pool = new Pool({
  host: '77.238.247.8',
  user: 'swag_user',
  port: '5432',
  password: 'admin123',
  database: 'swag',
})

try {
  // Подключение к базе данных
  console.log('Подключение к БД');
  await pool.connect();

  console.log('Успешно подключились к БД');
  // Очистка таблицы
  await pool.query(`
  ALTER TABLE albums
  ALTER COLUMN id TYPE VARCHAR;`);

  console.log('Таблица albums успешно очищена.');
  await pool.end();
} catch (err) {
  console.error('Ошибка при очистке таблицы:', err);
} finally {
  // Закрытие соединения
  await pool.release();
}

// Вызов функции
clearAlbumsTable();

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
