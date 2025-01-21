import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-error'

export default class Forbidden extends CustomAPIError {
  constructor(message) {
    super(message, StatusCodes.FORBIDDEN)
  }
}
