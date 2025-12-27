import { IsString, IsEmail, IsNotEmpty, IsDateString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    birthDate: string;

    @IsString()
    @IsOptional()
    familyName?: string;

    @IsString()
    @IsOptional()
    inviteCode?: string;
}
