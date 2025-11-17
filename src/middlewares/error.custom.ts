export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}

export class InCorrectOldPasswordError extends Error {
  constructor(message: string = "The old password provided is incorrect.") {
    super(message);
    this.name = "InCorrectOldPasswordError";
    Object.setPrototypeOf(this, InCorrectOldPasswordError.prototype);
  }
}
