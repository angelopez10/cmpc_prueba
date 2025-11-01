import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Book } from '../modules/books/entities/book.entity';
import { Author } from '../modules/authors/entities/author.entity';
import { Publisher } from '../modules/publishers/entities/publisher.entity';
import { Genre } from '../modules/genres/entities/genre.entity';
import { User } from '../modules/auth/entities/user.entity';

export default (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'cmpc_user',
  password: process.env.DB_PASSWORD || 'cmpc_password',
  database: process.env.DB_NAME || 'cmpc_books',
  entities: [User, Book, Author, Publisher, Genre],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});