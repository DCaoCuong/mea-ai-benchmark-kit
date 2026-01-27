import { IsNotEmpty } from 'class-validator';

export class STTDto {
  @IsNotEmpty()
  audio: string;
}
