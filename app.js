require("dotenv").config();
const express = require("express");
const db = require("./db");
const path = require("path");

const app = express();

// STATIC FILES
app.use("/books", express.static(path.resolve(__dirname, "bookworm_books")));

// TEST ROUTE
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "bookworm_books", "self_help", "Atomichabits.pdf"));
});

// ✅ ADD THIS
app.get("/api/books", (req, res) => {
  res.json([
    {
      name: "Atomic Habits",
      category: "self_help",
      url: "/books/self_help/Atomichabits.pdf"
    },
    {
      name: "Bhagavad Gita",
      category: "self_help",
      url: "/books/self_help/BhagvadGita.pdf"
    },
    {
      name: "Ultimate Self Help Book",
      category: "self_help",
      url: "/books/self_help/UltimateSelfHelpBook.pdf"
    }
  ]);
});

// DB CHECK
app.get("/", (req, res) => {
  db.query("SELECT 1", (err, result) => {
    if (err) {
      return res.send("❌ Database Error");
    }
    res.send("🚀 DB Connected Successfully");
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});