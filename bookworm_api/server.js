const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// SERVE PDF FILES
app.use('/bookworm_books', express.static(path.join(__dirname, '../bookworm_books')));

// DATABASE CONNECTION POOL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
});

// TEST DB
db.getConnection((err, connection) => {
    if (err) {
        console.log('❌ DB Connection Failed:', err);
    } else {
        console.log('✅ Connected to MySQL Database!');
        connection.release();
    }
});

// AUTO CREATE TABLES
db.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => { if(err) console.log('users table error:', err); else console.log('✅ users table ready'); });

db.query(`
    CREATE TABLE IF NOT EXISTS books (
        book_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        author VARCHAR(255),
        genre VARCHAR(100),
        description TEXT,
        rating FLOAT,
        pdf_path VARCHAR(500)
    )
`, (err) => { if(err) console.log('books table error:', err); else console.log('✅ books table ready'); });

db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT,
        reviewer_name VARCHAR(255),
        rating INT,
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => { if(err) console.log('reviews table error:', err); else console.log('✅ reviews table ready'); });

// ROOT
app.get('/', (req, res) => {
    res.send('🚀 Bookworm API is running');
});

// GET ALL BOOKS
app.get('/api/books', (req, res) => {
    db.query('SELECT * FROM books', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// GET SINGLE BOOK
app.get('/api/books/:id', (req, res) => {
    db.query('SELECT * FROM books WHERE book_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Book not found' });
        res.json(results[0]);
    });
});

// GET REVIEWS
app.get('/api/reviews/:bookId', (req, res) => {
    db.query('SELECT * FROM reviews WHERE book_id = ?', [req.params.bookId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// ADD REVIEW
app.post('/api/reviews', (req, res) => {
    const { bookId, reviewerName, rating, reviewText } = req.body;
    if (!bookId || !reviewerName || !rating || !reviewText) {
        return res.status(400).json({ message: 'All fields required' });
    }
    db.query(
        'INSERT INTO reviews (book_id, reviewer_name, rating, review_text) VALUES (?, ?, ?, ?)',
        [bookId, reviewerName, rating, reviewText],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ success: true, message: '✅ Review saved!', id: result.insertId });
        }
    );
});

// REGISTER
app.post('/api/register', (req, res) => {
    const { username, email } = req.body;
    db.query('INSERT INTO users (username, email) VALUES (?, ?)', [username, email], (err) => {
        if (err) return res.json({ success: false, message: 'User already exists' });
        res.json({ success: true });
    });
});

// LOGIN
app.post('/api/login', (req, res) => {
    db.query('SELECT * FROM users WHERE email = ?', [req.body.email], (err, result) => {
        if (err) return res.json({ success: false });
        if (result.length > 0) return res.json({ success: true, user: result[0] });
        res.json({ success: false, message: 'User not found' });
    });
});

// START SERVER
app.listen(3000, () => {
    console.log('🔥 Server running at http://localhost:3000');
});