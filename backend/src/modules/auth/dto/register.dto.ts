import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número o carácter especial',
  })
  password: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}