import { IsString, IsEmail, IsOptional, IsBoolean } from "class-validator";

export class AdminUpdateUserDto {
    @IsString()
    @IsOptional()
    nom?: string;

    @IsString()
    @IsOptional()
    prenom?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
