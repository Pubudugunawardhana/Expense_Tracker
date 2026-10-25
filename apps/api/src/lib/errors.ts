export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new AppError(400, message);
export const unauthorized = (message = 'Please sign in to continue.') => new AppError(401, message);
export const notFound = (message = 'Not found.') => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
