require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const util = require("util");
const Razorpay = require("razorpay"); 
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*", // Replace with frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Database Connection
const db = mysql.createConnection({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const query = util.promisify(db.query).bind(db);

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected...");
});


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // amount in paisa
    currency: "INR",
    receipt: `receipt_${Math.random().toString(36).substring(2, 10)}`,
    payment_capture: 1,
  };

  try {
    const response = await razorpay.orders.create(options);
    res.json({ orderId: response.id });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});






app.post("/users", async (req, res) => {
  try {
    const { username, mobile, wallet } = req.body;
    const result = await query(
      "INSERT INTO users (username, mobile, wallet) VALUES (?, ?, ?)",
      [username, mobile, wallet || 0.0]
    );
    res.json({ message: "User created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const results = await query("SELECT * FROM users");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/users/:id", async (req, res) => {
  try {
    const { username, mobile, wallet } = req.body;
    const result = await query(
      "UPDATE users SET username = ?, mobile = ?, wallet = ?, login_at = NOW() WHERE id = ?",
      [username, mobile, wallet, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/users/:id", async (req, res) => {
  try {
    const result = await query("DELETE FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/upcoming-matches", (req, res) => {
  const { team_a, team_b, time, teama_logo, teamb_logo, title } = req.body;
  db.query(
      "INSERT INTO upcoming_matches (team_a, team_b, time, teama_logo, teamb_logo, title) VALUES (?, ?, ?, ?, ?, ?)",
      [team_a, team_b, time, teama_logo, teamb_logo, title],
      (err, result) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ message: "Match added!", id: result.insertId });
      }
  );
});

app.get("/upcoming-matches", (req, res) => {
  db.query("SELECT * FROM upcoming_matches", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
  });
});

app.get("/upcoming-matches/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM upcoming_matches WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
  });
});

app.put("/upcoming-matches/:id", (req, res) => {
  const { id } = req.params;
  const { team_a, team_b, time, teama_logo, teamb_logo, title } = req.body;
  db.query(
      "UPDATE upcoming_matches SET team_a = ?, team_b = ?, time = ?, teama_logo = ?, teamb_logo = ?, title = ? WHERE id = ?",
      [team_a, team_b, time, teama_logo, teamb_logo, title, id],
      (err, result) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ message: "Match updated!" });
      }
  );
});

app.delete("/upcoming-matches/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM upcoming_matches WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Match deleted!" });
  });
});

app.get("/featured-matches", (req, res) => {
  db.query("SELECT * FROM featured_matches", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
  });
});

app.get("/featured-matches/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM featured_matches WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
  });
});

app.put("/featured-matches/:id", (req, res) => {
  const { id } = req.params;
  const { team_a, team_b, time, teama_logo, teamb_logo, title } = req.body;
  db.query(
      "UPDATE featured_matches SET team_a = ?, team_b = ?, time = ?, teama_logo = ?, teamb_logo = ?, title = ? WHERE id = ?",
      [team_a, team_b, time, teama_logo, teamb_logo, title, id],
      (err, result) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ message: "Match updated!" });
      }
  );
});

app.delete("/featured-matches/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM featured_matches WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Match deleted!" });
  });
});

app.post('/contests', (req, res) => {
  const { title, time, prize_pool, entry_fee, spot_entry, spot_left, category } = req.body;
  const sql = `INSERT INTO contest (title, time, prize_pool, entry_fee, spot_entry, spot_left, category)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [title, time, prize_pool, entry_fee, spot_entry, spot_left, category], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ id: result.insertId, ...req.body });
  });
});

app.get('/contests', (req, res) => {
  db.query('SELECT * FROM contest', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/contests/:id', (req, res) => {
  db.query('SELECT * FROM contest WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send({ message: 'Contest not found' });
    res.send(results[0]);
  });
});

app.put('/contests/:id', (req, res) => {
  const { title, time, prize_pool, entry_fee, spot_entry, spot_left, category } = req.body;
  const sql = `UPDATE contest SET title=?, time=?, prize_pool=?, entry_fee=?, spot_entry=?, spot_left=?, category=? WHERE id=?`;
  db.query(sql, [title, time, prize_pool, entry_fee, spot_entry, spot_left, category, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Contest updated successfully' });
  });
});


app.delete('/contests/:id', (req, res) => {
  db.query('DELETE FROM contest WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Contest deleted successfully' });
  });
});

app.post('/joined_contests', (req, res) => {
  const { contest_title, entry_fee, username, mobile, contest_time, joined_at } = req.body;
  const sql = 'INSERT INTO joined_contests (contest_title, entry_fee, username, mobile, contest_time, joined_at) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [contest_title, entry_fee, username, mobile, contest_time, joined_at], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ id: result.insertId, message: 'Contest joined successfully' });
  });
});

// Read - Get all joined contests
app.get('/joined_contests', (req, res) => {
  db.query('SELECT * FROM joined_contests', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Read - Get a specific contest entry
app.get('/joined_contests/:id', (req, res) => {
  db.query('SELECT * FROM joined_contests WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result[0]);
  });
});

// Update - Update a contest entry
app.put('/joined_contests/:id', (req, res) => {
  const { contest_title, entry_fee, username, mobile, contest_time, joined_at } = req.body;
  const sql = `UPDATE joined_contests SET contest_title=?, entry_fee=?, username=?, mobile=?, contest_time=?, joined_at=? WHERE id=?`;
  db.query(sql, [contest_title, entry_fee, username, mobile, contest_time, joined_at, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Contest updated successfully' });
  });
});

// Delete - Delete a contest entry
app.delete('/joined_contests/:id', (req, res) => {
  db.query('DELETE FROM joined_contests WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Contest deleted successfully' });
  });
});

const listenPort = process.env.X_ZOHO_CATALYST_LISTEN_PORT || port;
app.listen(listenPort, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
