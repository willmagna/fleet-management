import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

const makeHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { method: 'POST', url: '/vehicles' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

const makeQueryFailedError = (
  number: number,
  message: string,
): QueryFailedError => {
  const error = new QueryFailedError('INSERT INTO vehicles ...', [], {
    message,
    number,
  } as unknown as Error);
  return error;
};

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('passes through known HttpExceptions unchanged', () => {
    const { host, status, json } = makeHost();
    filter.catch(new NotFoundException('Vehicle 1 not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Vehicle 1 not found' }),
    );
  });

  it('maps a unique constraint violation (2627) to 409 with the driver message', () => {
    const { host, status, json } = makeHost();
    const error = makeQueryFailedError(
      2627,
      "Violation of UNIQUE KEY constraint 'UQ_7e9fab2e8625b63613f67bd706c'. Cannot insert duplicate key in object 'dbo.vehicles'. The duplicate key value is (abc1d23).",
    );

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
    const [body] = json.mock.calls[0] as [
      { statusCode: number; message: string },
    ];
    expect(body.statusCode).toBe(409);
    expect(body.message).toContain('duplicate key value is (abc1d23)');
  });

  it('maps a unique index violation (2601) to 409', () => {
    const { host, status } = makeHost();
    const error = makeQueryFailedError(2601, 'Cannot insert duplicate key row');

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
  });

  it('maps a foreign key violation (547) to 400', () => {
    const { host, status } = makeHost();
    const error = makeQueryFailedError(
      547,
      'The INSERT statement conflicted with the FOREIGN KEY constraint',
    );

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('falls back to 500 with a generic message for unknown errors', () => {
    const { host, status, json } = makeHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  it('formats BadRequestException array messages as-is', () => {
    const { host, json } = makeHost();
    filter.catch(new BadRequestException(['name should not be empty']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['name should not be empty'] }),
    );
  });
});
