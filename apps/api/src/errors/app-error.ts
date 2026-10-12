export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = "BadRequestError";
  }
}

export class FormClosedError extends AppError {
  constructor() {
    super("This form is no longer accepting responses", 410);
    this.name = "FormClosedError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sign in required") {
    super(message, 401);
    this.name = "UnauthorizedError"
  }
}