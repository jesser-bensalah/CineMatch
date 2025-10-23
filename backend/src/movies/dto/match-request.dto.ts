import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMatchRequestDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;
}

export class RespondMatchRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;
  
  @IsString()
  @IsNotEmpty()
  status: 'accepted' | 'declined';
}
