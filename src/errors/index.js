/* import CustomAPIError from './custom-error'
import BadRequestError from './bad-request'
import UnauthorizedError from './unauthorized'
import NotFoundError from './not-found' */
import { StatusCodes } from 'http-status-codes'

class CustomAPIError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message, StatusCodes.BAD_REQUEST)
  }
}

class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message, StatusCodes.UNAUTHORIZED)
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message, StatusCodes.NOT_FOUND)
  }
}


export { CustomAPIError, BadRequestError, UnauthorizedError, NotFoundError }
