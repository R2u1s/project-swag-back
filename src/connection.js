// import { Pool } from 'pg'
import * as dotenv from 'dotenv'
dotenv.config()
import pkg from 'pg'
const { Pool } = pkg

export const pool = new Pool({
  host: '77.238.250.70',
  user: 'postgres',
  port: '5432',
  password: 'admin123',
  database: 'swag'
})

// export const pool = new Pool({
//   host: 'localhost',
//   port: 5432,
//   user: 'student',
//   password: 'student',
//   database: 'swag'
//   // ssl: true
// })
