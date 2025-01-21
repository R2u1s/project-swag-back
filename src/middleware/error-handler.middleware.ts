import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { CustomAPIError } from '../errors'
import { ZodError } from 'zod'

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.log(err)
  if (err instanceof ZodError) {
    console.log('zod error')
    let message = ''
    for (const error of err.errors) {
      message += error.message + '\n'
    }
    message = message.slice(0, -1)
    return res.status(StatusCodes.BAD_REQUEST).json({ message })
  }
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ message: err.message })
  }
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: err.message ? err.message : 'Something went wrong!', err })
}
