export class BusinessError extends Error {
  constructor(public type: string, message: string) {
    super(message);
    this.type = type;
  }
}
