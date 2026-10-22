export class AppError extends Error {
  readonly status: number;
  readonly chaveI18n: string;
  readonly extra?: Record<string, unknown>;

  constructor(status: number, chaveI18n: string, extra?: Record<string, unknown>) {
    super(chaveI18n);
    this.name = 'AppError';
    this.status = status;
    this.chaveI18n = chaveI18n;
    this.extra = extra;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
