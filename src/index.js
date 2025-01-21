import 'express-async-errors'
import express from 'express'
const { urlencoded, json } = express
import * as dotenv from 'dotenv'
import cors from 'cors'
import fs from 'fs/promises' // используем модуль fs/promises для работы с промисами
import morgan from 'morgan'
import http from 'http'
import WebSocket from 'ws'
import { pool } from './connection.js'
// import errorHandler from './middleware/error-handler.middleware.js'
import mainRouter from './mainRouter.js'
import fetch from 'node-fetch';
import { URL } from 'url';

dotenv.config()
const app = express()
const server = http.createServer(app)

app.use(cors())
// app.use(
//   cors({
//     origin: '*', // Или укажите конкретные источники, например: ['http://example.com']
//   })
// )
app.use(urlencoded({ extended: true }))
app.use(json())
app.use(morgan('short'))
app.use(express.json())

app.get('/', (req, res) => res.send('Server working!'))
app.use('/api/', mainRouter)

// app.use(errorHandler)

const port = process.env.PORT || 3000

// app.get('/data', async (req, res) => {
//   try {
//     // Чтение данных из response.json
//     const data = await fs.readFile('response.json', 'utf-8')

//     // Преобразование строки JSON в объект JavaScript
//     const jsonData = JSON.parse(data)

//     // Возвращаем данные в качестве ответа на запрос
//     res.status(200).json(jsonData)
//   } catch (error) {
//     console.error('Ошибка при чтении файла:', error)
//     res.status(500).json({ error: 'Внутренняя ошибка сервера' })
//   }
// })

app.get('/api/imagegifts', async (req, res) => {

  const imageUrl = `https://api2.gifts.ru/export/v2/catalogue/${req.query.url}`;

  try {
    const username = '89922_xmlexport';
    const password = 'ZAamnRJM';
    const auth = `${username}:${password}`;

    const response = await fetch(imageUrl.toString(), {
      headers: {
        'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
      }
    });

    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    response.body.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error fetching image');
  }
});

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
  console.log(`worker pid ${process.pid}`)
})
