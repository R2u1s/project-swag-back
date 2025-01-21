import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-error'

export default class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message, StatusCodes.UNAUTHORIZED)
  }
}
