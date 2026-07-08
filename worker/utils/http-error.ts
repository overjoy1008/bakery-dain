export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "DATE_CLOSED"
  | "DEADLINE_PASSED"
  | "OUT_OF_STOCK"
  | "CONFLICT"
  | "INTERNAL_ERROR";

type ErrorDetails = Record<string, unknown>;

export class HttpError extends Error {
  code: ErrorCode;
  details?: ErrorDetails;
  status: number;

  constructor(status: number, code: ErrorCode, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return {
      body: {
        error: {
          code: error.code,
          details: error.details,
          message: error.message,
        },
      },
      status: error.status,
    };
  }

  return {
    body: {
      error: {
        code: "INTERNAL_ERROR" as const,
        message: "잠시 후 다시 시도해 주세요.",
      },
    },
    status: 500,
  };
}
