import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Author } from '../../authors/entities/author.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Genre } from '../../genres/entities/genre.entity';

@Entity('books')
@Index(['title', 'authorId', 'genreId'])
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'isbn', length: 20, unique: true, nullable: true })
  isbn: string;

  @Column({ name: 'publication_year', type: 'int', nullable: true })
  publicationYear: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ name: 'publisher_id' })
  publisherId: string;

  @Column({ name: 'genre_id' })
  genreId: string;

  @ManyToOne(() => Author, author => author.books, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author: Author;

  @ManyToOne(() => Publisher, publisher => publisher.books, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'publisher_id' })
  publisher: Publisher;

  @ManyToOne(() => Genre, genre => genre.books, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}