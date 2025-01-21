import { UnauthorizedError } from '../errors'
import { Request, Response, NextFunction } from 'express'

export default function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (res.locals.user.role_name == 'admin') next()
  else throw new UnauthorizedError('You are not authorized to visit this route')
}
