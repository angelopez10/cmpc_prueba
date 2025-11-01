import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGenreDto {
  @ApiProperty({ description: 'Nombre del género' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: 'Descripción del género', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Estado activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}