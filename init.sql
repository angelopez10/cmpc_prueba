-- =============================================
-- CMPC Book Management System Database
-- Initialization Script (UUID-based IDs)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;
DROP TABLE IF EXISTS genres CASCADE;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create index on email for faster login queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =============================================
-- AUTHORS TABLE
-- =============================================
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    biography TEXT,
    nationality VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create indexes for author queries
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_authors_last_name ON authors(last_name);
CREATE INDEX idx_authors_is_active ON authors(is_active);

-- =============================================
-- PUBLISHERS TABLE
-- =============================================
CREATE TABLE publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100),
    foundation_year INTEGER CHECK (foundation_year >= 1000 AND foundation_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create indexes for publisher queries
CREATE INDEX idx_publishers_name ON publishers(name);
CREATE INDEX idx_publishers_country ON publishers(country);
CREATE INDEX idx_publishers_is_active ON publishers(is_active);

-- =============================================
-- GENRES TABLE
-- =============================================
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create indexes for genre queries
CREATE INDEX idx_genres_name ON genres(name);
CREATE INDEX idx_genres_is_active ON genres(is_active);

-- =============================================
-- BOOKS TABLE
-- =============================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    isbn VARCHAR(20) UNIQUE,
    publication_year INTEGER CHECK (publication_year >= 1000 AND publication_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    price DECIMAL(10,2) CHECK (price >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    author_id UUID NOT NULL,
    publisher_id UUID,
    genre_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_books_author 
        FOREIGN KEY (author_id) REFERENCES authors(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_books_publisher 
        FOREIGN KEY (publisher_id) REFERENCES publishers(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    CONSTRAINT fk_books_genre 
        FOREIGN KEY (genre_id) REFERENCES genres(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for book queries
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_publisher_id ON books(publisher_id);
CREATE INDEX idx_books_genre_id ON books(genre_id);
CREATE INDEX idx_books_is_available ON books(is_available);
CREATE INDEX idx_books_publication_year ON books(publication_year);

-- =============================================
-- SAMPLE DATA INSERTION
-- =============================================

-- Insert sample genres
INSERT INTO genres (name, description) VALUES
('Fiction', 'Literary works of fiction and imagination'),
('Non-Fiction', 'Factual and educational content'),
('Science Fiction', 'Futuristic and scientific themes'),
('Mystery', 'Suspenseful and mysterious stories'),
('Romance', 'Love stories and romantic themes'),
('Biography', 'Life stories of notable people'),
('History', 'Historical events and periods'),
('Technology', 'Technical and computing topics'),
('Self-Help', 'Personal development and improvement'),
('Fantasy', 'Magical and fantastical worlds');

-- Insert sample authors
INSERT INTO authors (name, last_name, birth_date, biography, nationality) VALUES
('Gabriel', 'García Márquez', '1927-03-06', 'Colombian novelist, short-story writer, and journalist', 'Colombian'),
('George', 'Orwell', '1903-06-25', 'English novelist and essayist, journalist and critic', 'British'),
('Jane', 'Austen', '1775-12-16', 'English novelist known for her social commentary', 'British'),
('Isaac', 'Asimov', '1920-01-02', 'American science fiction writer and biochemist', 'American'),
('Agatha', 'Christie', '1890-09-15', 'English writer known for her detective novels', 'British'),
('Stephen', 'King', '1947-09-21', 'American author of horror, supernatural fiction, and fantasy', 'American'),
('J.K.', 'Rowling', '1965-07-31', 'British author, best known for the Harry Potter series', 'British'),
('Ernest', 'Hemingway', '1899-07-21', 'American novelist, short story writer, and journalist', 'American'),
('Toni', 'Morrison', '1931-02-18', 'American novelist, editor, and professor', 'American'),
('Haruki', 'Murakami', '1949-01-12', 'Japanese writer and translator', 'Japanese');

-- Insert sample publishers
INSERT INTO publishers (name, country, foundation_year, description, website) VALUES
('Penguin Random House', 'United States', 1927, 'World''s largest trade book publisher', 'https://www.penguinrandomhouse.com'),
('HarperCollins', 'United States', 1989, 'One of the Big Five English-language publishers', 'https://www.harpercollins.com'),
('Macmillan Publishers', 'United Kingdom', 1843, 'International publishing company', 'https://www.macmillan.com'),
('Simon & Schuster', 'United States', 1924, 'American publishing company', 'https://www.simonandschuster.com'),
('Hachette Book Group', 'France', 1826, 'French publisher and the world''s second-largest trade publisher', 'https://www.hachettebookgroup.com'),
('Oxford University Press', 'United Kingdom', 1586, 'Largest university press in the world', 'https://global.oup.com'),
('Cambridge University Press', 'United Kingdom', 1534, 'Publishing business of the University of Cambridge', 'https://www.cambridge.org'),
('Bloomsbury Publishing', 'United Kingdom', 1986, 'British independent publishing house', 'https://www.bloomsbury.com'),
('Scholastic Corporation', 'United States', 1920, 'American multinational publishing company', 'https://www.scholastic.com'),
('Vintage Books', 'United States', 1954, 'Publishing imprint of Random House', 'https://www.vintage-books.com');

-- Insert sample books with foreign keys resolved by names
INSERT INTO books (title, description, isbn, publication_year, price, stock_quantity, image_url, is_available, author_id, publisher_id, genre_id) VALUES
('One Hundred Years of Solitude', 'A multi-generational story of the Buendía family', '978-0-06-088328-7', 1967, 24.99, 50, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Magical%20realism%20book%20cover%20with%20vibrant%20colors%20and%20mystical%20elements&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Gabriel' AND last_name='García Márquez'),
 (SELECT id FROM publishers WHERE name='Penguin Random House'),
 (SELECT id FROM genres WHERE name='Fiction')),
('1984', 'Dystopian social science fiction novel', '978-0-452-28423-4', 1949, 18.99, 75, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Dark%20dystopian%20book%20cover%20with%20surveillance%20themes%20and%20ominous%20atmosphere&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='George' AND last_name='Orwell'),
 (SELECT id FROM publishers WHERE name='HarperCollins'),
 (SELECT id FROM genres WHERE name='Fiction')),
('Pride and Prejudice', 'Romantic novel of manners', '978-0-14-143951-8', 1813, 16.99, 60, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Elegant%20regency%20era%20book%20cover%20with%20romantic%20elements%20and%20classic%20design&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Jane' AND last_name='Austen'),
 (SELECT id FROM publishers WHERE name='Macmillan Publishers'),
 (SELECT id FROM genres WHERE name='Romance')),
('Foundation', 'Science fiction novel about the collapse of a galactic empire', '978-0-553-29335-0', 1951, 22.99, 40, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Futuristic%20sci-fi%20book%20cover%20with%20space%20themes%20and%20advanced%20technology&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Isaac' AND last_name='Asimov'),
 (SELECT id FROM publishers WHERE name='Simon & Schuster'),
 (SELECT id FROM genres WHERE name='Science Fiction')),
('Murder on the Orient Express', 'Detective fiction featuring Hercule Poirot', '978-0-00-711931-8', 1934, 19.99, 55, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Mysterious%20detective%20book%20cover%20with%20train%20elements%20and%20suspenseful%20atmosphere&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Agatha' AND last_name='Christie'),
 (SELECT id FROM publishers WHERE name='Hachette Book Group'),
 (SELECT id FROM genres WHERE name='Mystery')),
('The Shining', 'Horror novel about a haunted hotel', '978-0-385-12167-5', 1977, 21.99, 45, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Horror%20book%20cover%20with%20haunted%20hotel%20themes%20and%20dark%20atmospheric%20elements&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Stephen' AND last_name='King'),
 (SELECT id FROM publishers WHERE name='Oxford University Press'),
 (SELECT id FROM genres WHERE name='Fiction')),
('Harry Potter and the Sorcerer''s Stone', 'Fantasy novel about a young wizard', '978-0-439-70818-8', 1997, 25.99, 100, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Magical%20fantasy%20book%20cover%20with%20wizard%20themes%20and%20enchanting%20elements&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='J.K.' AND last_name='Rowling'),
 (SELECT id FROM publishers WHERE name='Scholastic Corporation'),
 (SELECT id FROM genres WHERE name='Fantasy')),
('The Old Man and the Sea', 'Story of an aging fisherman''s struggle with a giant marlin', '978-0-684-80122-3', 1952, 17.99, 35, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Maritime%20literature%20book%20cover%20with%20fishing%20themes%20and%20ocean%20elements&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Ernest' AND last_name='Hemingway'),
 (SELECT id FROM publishers WHERE name='HarperCollins'),
 (SELECT id FROM genres WHERE name='Fiction')),
('Beloved', 'Novel about the legacy of slavery', '978-1-4000-3341-6', 1987, 23.99, 30, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Powerful%20literary%20fiction%20book%20cover%20with%20historical%20themes%20and%20emotional%20depth&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Toni' AND last_name='Morrison'),
 (SELECT id FROM publishers WHERE name='Penguin Random House'),
 (SELECT id FROM genres WHERE name='Fiction')),
('Norwegian Wood', 'Coming-of-age novel set in 1960s Tokyo', '978-0-375-70402-4', 1987, 20.99, 40, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Contemporary%20literary%20fiction%20book%20cover%20with%20Japanese%20aesthetic%20and%20introspective%20mood&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Haruki' AND last_name='Murakami'),
 (SELECT id FROM publishers WHERE name='Bloomsbury Publishing'),
 (SELECT id FROM genres WHERE name='Fiction')),
('The Great Gatsby', 'Classic American novel about the Jazz Age', '978-0-7432-7356-5', 1925, 18.99, 65, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Classic%20American%20literature%20book%20cover%20with%201920s%20Art%20Deco%20style%20and%20elegant%20design&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Ernest' AND last_name='Hemingway'),
 (SELECT id FROM publishers WHERE name='Cambridge University Press'),
 (SELECT id FROM genres WHERE name='Fiction')),
('To Kill a Mockingbird', 'Novel about racial injustice in the American South', '978-0-06-112008-4', 1960, 19.99, 70, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Classic%20American%20literature%20book%20cover%20with%20Southern%20themes%20and%20justice%20symbolism&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Toni' AND last_name='Morrison'),
 (SELECT id FROM publishers WHERE name='HarperCollins'),
 (SELECT id FROM genres WHERE name='Fiction')),
('Dune', 'Epic science fiction novel', '978-0-441-01359-3', 1965, 26.99, 50, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Epic%20sci-fi%20book%20cover%20with%20desert%20planets%20and%20futuristic%20elements&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Isaac' AND last_name='Asimov'),
 (SELECT id FROM publishers WHERE name='Simon & Schuster'),
 (SELECT id FROM genres WHERE name='Science Fiction')),
('The Catcher in the Rye', 'Controversial novel about teenage rebellion', '978-0-316-76948-0', 1951, 17.99, 55, 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Classic%20coming-of-age%20book%20cover%20with%20urban%20themes%20and%20youthful%20angst&image_size=portrait_4_3', true,
 (SELECT id FROM authors WHERE name='Ernest' AND last_name='Hemingway'),
 (SELECT id FROM publishers WHERE name='Hachette Book Group'),
 (SELECT id FROM genres WHERE name='Fiction'));

-- =============================================
-- TEST USERS
-- =============================================

-- Regular test users (password: Test123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('admin@cmpc.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'ADMIN', true),
('user@cmpc.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'User', 'USER', true),
('john.doe@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'USER', true),
('jane.smith@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'USER', true);

-- Inactive test user
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('inactive@cmpc.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Inactive', 'User', 'USER', false);

-- =============================================
-- DATABASE VERIFICATION QUERIES
-- =============================================

-- Uncomment to verify data insertion
-- SELECT 'Users count:' as table_name, COUNT(*) as total FROM users;
-- SELECT 'Authors count:' as table_name, COUNT(*) as total FROM authors;
-- SELECT 'Publishers count:' as table_name, COUNT(*) as total FROM publishers;
-- SELECT 'Genres count:' as table_name, COUNT(*) as total FROM genres;
-- SELECT 'Books count:' as table_name, COUNT(*) as total FROM books;

-- Sample query to test relationships
-- SELECT 
--     b.title,
--     a.name || ' ' || a.last_name as author,
--     p.name as publisher,
--     g.name as genre
-- FROM books b
-- LEFT JOIN authors a ON b.author_id = a.id
-- LEFT JOIN publishers p ON b.publisher_id = p.id
-- LEFT JOIN genres g ON b.genre_id = g.id
-- LIMIT 5;

-- =============================================
-- CREDENTIALS FOR TESTING
-- =============================================
-- Admin User: admin@cmpc.com / Test123!
-- Regular User: user@cmpc.com / Test123!
-- John Doe: john.doe@example.com / Test123!
-- Jane Smith: jane.smith@example.com / Test123!
-- Inactive User: inactive@cmpc.com / Test123!
-- =============================================