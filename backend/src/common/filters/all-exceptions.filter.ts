import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// mssql driver error numbers (sys.messages)
const MSSQL_UNIQUE_VIOLATION = [2627, 2601];
const MSSQL_FK_VIOLATION = 547;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpException = this.toHttpException(exception);
    const status = httpException.getStatus();
    const body = httpException.getResponse();

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response
      .status(status)
      .json(
        typeof body === 'string' ? { statusCode: status, message: body } : body,
      );
  }

  private toHttpException(exception: unknown): HttpException {
    if (exception instanceof HttpException) return exception;
    if (exception instanceof QueryFailedError) {
      return this.fromQueryFailedError(exception as QueryFailedError<Error>);
    }
    return new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private fromQueryFailedError(error: QueryFailedError): HttpException {
    const driverError = (error as unknown as { number?: number }).number;
    const message = error.message;

    if (
      driverError !== undefined &&
      MSSQL_UNIQUE_VIOLATION.includes(driverError)
    ) {
      return new ConflictException(message);
    }
    if (driverError === MSSQL_FK_VIOLATION) {
      return new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    return new HttpException(message, HttpStatus.BAD_REQUEST);
  }
}
