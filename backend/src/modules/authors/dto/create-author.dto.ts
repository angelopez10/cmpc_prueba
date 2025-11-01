import { IsString, IsOptional, IsDateString, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthorDto {
  @ApiProperty({ description: 'Nombre del autor' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: 'Apellido del autor' })
  @IsString()
  @Length(2, 100)
  lastName: string;

  @ApiProperty({ description: 'Fecha de nacimiento', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ description: 'Biografía del autor', required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ description: 'Nacionalidad del autor', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  nationality?: string;

  @ApiProperty({ description: 'Estado activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}