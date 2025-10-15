import { IsString, IsInt, IsNotEmpty, Min, IsEmail, IsStrongPassword } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsInt()
  @Min(13, { message: 'L\'âge doit être d\'au moins 13 ans' })
  @Type(() => Number)
  age: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  password: string;
}