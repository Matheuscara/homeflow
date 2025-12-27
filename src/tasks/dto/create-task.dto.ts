import { IsString, IsNotEmpty, IsBoolean, IsInt, IsOptional } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;



    @IsBoolean()
    @IsOptional()
    isRotation?: boolean;

    @IsInt()
    @IsOptional()
    frequencyDays?: number;
}
