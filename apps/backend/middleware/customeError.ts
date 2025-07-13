// src/errors/CustomError.ts
export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message = "Not authorized to access this resource") {
    super(message, 403);
  }
}

export class ValidationError extends CustomError {
  constructor(message = "Invalid request data") {
    super(message, 400);
  }
}
