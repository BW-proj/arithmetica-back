export abstract class ResponseDTO {
  message!: string;
  success!: boolean;
  code!: number;

  abstract toJson(): Record<string, any>;
}
