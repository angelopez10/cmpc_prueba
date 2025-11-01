import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';

@Entity('publishers')
export class Publisher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ name: 'foundation_year', type: 'int', nullable: true })
  foundationYear: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'website', nullable: true })
  website: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Book, book => book.publisher)
  books: Book[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}