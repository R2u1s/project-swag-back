import { pool } from '../../connection.js'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors/index.js'
import { UserSchema } from '../../shared/schemas/user.schema'
import { genHash, issueJWT, validPassword } from '../../utils/auth.utils'

export async function register(req: Request, res: Response) {
  const { first_name, last_name, email, contact_number, date_of_birth, password } = UserSchema.parse({
    ...req.body,
    date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : undefined,
  })
  let query = `SELECT email from users WHERE(email=$1)`
  let result = await pool.query(query, [email])
  if (result.rows.length > 0) throw new BadRequestError('Пользователь с таким Email уже зарегистрирован')
  const { hash, salt } = genHash(password)
  query = `INSERT INTO users (first_name, last_name, email, contact_number, date_of_birth, salt, hash) 
  VALUES ($1, $2, $3, $4, $5, $6, $7)`
  const queryParams = [first_name, last_name, email, contact_number, date_of_birth, salt, hash]
  result = await pool.query(query, queryParams)
  return res.status(StatusCodes.OK).json({ message: 'Вы успешно зарегистрировались' })
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  const query = `SELECT first_name, last_name, email, contact_number, date_of_birth, salt, hash FROM users WHERE email=$1`
  const result = await pool.query(query, [email])
  if (result.rows.length < 1) throw new NotFoundError('Пользователь не найден')
  const [dbUser] = result.rows
  const validPass = validPassword(password, dbUser.hash, dbUser.salt)
  if (!validPass) throw new UnauthorizedError('Неверный пароль')
  return res.status(StatusCodes.OK).json(issueJWT(dbUser))
}
