export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetail[];

  constructor(status: number, message: string, code?: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || statusToCode(status);
    this.details = details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }

  static badRequest(message: string, details?: ApiErrorDetail[]) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ApiError(409, message, 'CONFLICT');
  }

  static internal(message = 'An unexpected error occurred') {
    return new ApiError(500, message, 'INTERNAL');
  }
}

function statusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'INTERNAL',
  };
  return map[status] || 'ERROR';
}

/** Standard API response helpers */
export function successResponse<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(err: ApiError | Error) {
  if (err instanceof ApiError) {
    return { success: false, error: err.toJSON() };
  }
  return {
    success: false,
    error: { code: 'INTERNAL', message: 'An unexpected error occurred' },
  };
}
