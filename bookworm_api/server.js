const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

//  SERVE PDF FILES
app.use('/bookworm_books', express.static(path.join(__dirname, '../bookworm_books')));

//  DATABASE CONNECTION POOL (BETTER THAN createConnection)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bookworm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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

// --- ROUTES ---

//  ROOT
app.get('/', (req, res) => {
    res.send('🚀 Bookworm API is running');
});

//  GET ALL BOOKS
app.get('/api/books', (req, res) => {
    const query = 'SELECT * FROM books';

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(results);
    });
});

//  GET SINGLE BOOK (VERY USEFUL FOR DETAILS PAGE)
app.get('/api/books/:id', (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM books WHERE book_id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json(results[0]);
    });
});

//  GET REVIEWS
app.get('/api/reviews/:bookId', (req, res) => {
    const bookId = req.params.bookId;

    db.query('SELECT * FROM reviews WHERE book_id = ?', [bookId], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        res.json(results);
    });
});

//  ADD REVIEW
app.post('/api/reviews', (req, res) => {
    const { bookId, reviewerName, rating, reviewText } = req.body;

    if (!bookId || !reviewerName || !rating || !reviewText) {
        return res.status(400).json({ message: 'All fields required' });
    }

    const query = `
        INSERT INTO reviews (book_id, reviewer_name, rating, review_text)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [bookId, reviewerName, rating, reviewText], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.json({
            success: true,
            message: '✅ Review saved!',
            id: result.insertId
        });
    });
});


// ================= USER REGISTER =================
app.post('/api/register', (req, res) => {
   console.log("Register route HIT", req.body);
    const { username, email } = req.body;

    const sql = "INSERT INTO users (username, email) VALUES (?, ?)";

    db.query(sql, [username, email], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false, message: "User already exists" });
        }
        res.json({ success: true });
    });
});


// ================= USER LOGIN =================
app.post('/api/login', (req, res) => {
    const { email } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], (err, result) => {
        if (err) return res.json({ success: false });

        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    });
});
app.post('/api/reviews', (req, res) => {
    const { user_id, book_id, review_text, rating } = req.body;

    const query = `
        INSERT INTO reviews (user_id, book_id, review_text, rating)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [user_id, book_id, review_text, rating], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
});
app.post('/api/reviews', (req, res) => {
    const { user_id, book_id, review_text, rating } = req.body;

    const query = `
        INSERT INTO reviews (user_id, book_id, review_text, rating)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [user_id, book_id, review_text, rating], (err, result) => {
        if (err) {
            console.log("ERROR:", err);
            return res.json({ success: false, message: "DB error" });
        }

        res.json({ success: true });
    });
});
// --- START SERVER ---
app.listen(3000, () => {
    console.log('🔥 Server running at http://localhost:3000');
});