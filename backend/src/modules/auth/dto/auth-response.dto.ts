import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'Token JWT de acceso' })
  accessToken: string;

  @ApiProperty({ description: 'Información del usuario' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}