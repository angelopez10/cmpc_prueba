import { IsString, IsOptional, IsNumber, Length, IsUrl, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePublisherDto {
  @ApiProperty({ description: 'Nombre de la editorial' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: 'País de origen', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @ApiProperty({ description: 'Año de fundación', required: false })
  @IsOptional()
  @IsNumber()
  foundationYear?: number;

  @ApiProperty({ description: 'Descripción de la editorial', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Sitio web de la editorial', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'Estado activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}