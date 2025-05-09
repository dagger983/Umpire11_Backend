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
    origin: [
      "https://umpire11app-50025754771.development.catalystappsail.in", // Production domain
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Use if you handle cookies/sessions
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
// Removed the unnecessary closing brace

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
  db.query(
    "SELECT * FROM upcoming_matches WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
    }
  );
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
  db.query(
    "SELECT * FROM featured_matches WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
    }
  );
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

app.post("/contests", (req, res) => {
  const {
    title,
    time,
    prize_pool,
    entry_fee,
    spot_entry,
    spot_left,
    category,
  } = req.body;
  const sql = `INSERT INTO contest (title, time, prize_pool, entry_fee, spot_entry, spot_left, category)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [title, time, prize_pool, entry_fee, spot_entry, spot_left, category],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ id: result.insertId, ...req.body });
    }
  );
});

app.get("/contests", (req, res) => {
  db.query("SELECT * FROM contest", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get("/contests/:id", (req, res) => {
  db.query(
    "SELECT * FROM contest WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0)
        return res.status(404).send({ message: "Contest not found" });
      res.send(results[0]);
    }
  );
});

app.put("/contests/:id", (req, res) => {
  const {
    title,
    time,
    prize_pool,
    entry_fee,
    spot_entry,
    spot_left,
    category,
  } = req.body;
  const sql = `UPDATE contest SET title=?, time=?, prize_pool=?, entry_fee=?, spot_entry=?, spot_left=?, category=? WHERE id=?`;
  db.query(
    sql,
    [
      title,
      time,
      prize_pool,
      entry_fee,
      spot_entry,
      spot_left,
      category,
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Contest updated successfully" });
    }
  );
});

app.delete("/contests/:id", (req, res) => {
  db.query("DELETE FROM contest WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Contest deleted successfully" });
  });
});

// Create - Add new joined contest
app.post("/joined_contests", (req, res) => {
  const {
    contest_title,
    entry_fee,
    username,
    mobile,
    paymentId,
    contest_time,
  } = req.body;
  const sql =
    "INSERT INTO joined_contests (contest_title, entry_fee, username, mobile, paymentId, contest_time) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [contest_title, entry_fee, username, mobile, paymentId, contest_time],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ id: result.insertId, message: "Contest joined successfully" });
    }
  );
});

// Update - Update a contest entry
app.put("/joined_contests/:id", (req, res) => {
  const {
    contest_title,
    entry_fee,
    username,
    mobile,
    paymentId,
    contest_time,
    joined_at,
  } = req.body;
  const sql = `
    UPDATE joined_contests 
    SET contest_title=?, entry_fee=?, username=?, mobile=?, paymentId=?, contest_time=?, joined_at=? 
    WHERE id=?`;
  db.query(
    sql,
    [
      contest_title,
      entry_fee,
      username,
      mobile,
      paymentId,
      contest_time,
      joined_at,
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Contest updated successfully" });
    }
  );
});

// Read - Get all joined contests
app.get("/joined_contests", (req, res) => {
  db.query("SELECT * FROM joined_contests", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Read - Get a specific contest entry
app.get("/joined_contests/:id", (req, res) => {
  db.query(
    "SELECT * FROM joined_contests WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send(result[0]);
    }
  );
});

// Delete - Delete a contest entry
app.delete("/joined_contests/:id", (req, res) => {
  db.query(
    "DELETE FROM joined_contests WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Contest deleted successfully" });
    }
  );
});

app.post("/players", (req, res) => {
  const { name, role, team, points, contest_title, contest_team } = req.body;
  const sql = `INSERT INTO player (name, role, team, points, contest_title, contest_team) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [name, role, team, points, contest_title, contest_team],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "Player created", id: result.insertId });
    }
  );
});

// READ all players
app.get("/players", (req, res) => {
  db.query("SELECT * FROM player", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// READ one player
app.get("/players:id", (req, res) => {
  const sql = "SELECT * FROM player WHERE id = ?";
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0)
      return res.status(404).send({ message: "Player not found" });
    res.send(results[0]);
  });
});

// UPDATE a player
app.put("/players:id", (req, res) => {
  const { name, role, team, points, contest_title, contest_team } = req.body;
  const sql = `UPDATE player SET name = ?, role = ?, team = ?, points = ?, contest_title = ?, contest_team = ? WHERE id = ?`;
  db.query(
    sql,
    [name, role, team, points, contest_title, contest_team, req.params.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Player updated" });
    }
  );
});

// DELETE a player
app.delete("/players:id", (req, res) => {
  db.query("DELETE FROM player WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Player deleted" });
  });
});


app.post("/user_selected_team/players", (req, res) => {
  const data = req.body;
  console.log("Received payload:", data);

  // Validate required fields
  if (!data.username || !data.mobile || !data.contest_title || !data.contest_entryfee) {
    return res.status(400).json({ message: "Username, mobile, contest title, and entry fee are required." });
  }

  const values = [
    data.username,
    data.mobile,
    data.player1_name,
    data.player2_name,
    data.player3_name,
    data.player4_name,
    data.player5_name,
    data.player6_name,
    data.player7_name,
    data.player8_name,
    data.player9_name,
    data.player10_name,
    data.player11_name,
    data.captain_id,
    data.captain_name,
    data.vice_captain_id,
    data.vice_captain_name,
    data.contest_title,
    data.contest_entryfee,
    data.total_points // Ensure this value is included
  ];

  const sql = `INSERT INTO user_selected_team 
  (username, mobile, 
   player1_name, player2_name, player3_name, player4_name, player5_name, 
   player6_name, player7_name, player8_name, player9_name, player10_name, 
   player11_name, 
   captain_id, captain_name, 
   vice_captain_id, vice_captain_name, 
   contest_title, contest_entryfee, total_points) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  console.log("Final SQL:", mysql.format(sql, values)); 

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Database error.", error: err.message });
    }
    res.status(200).json({ message: "Team saved successfully!", teamId: result.insertId });
  });
});




app.get("/user-players", (req, res) => {
  const sql = "SELECT * FROM user_selected_team";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving data:", err.message);
      return res.status(500).json({
        message: "An error occurred while fetching the teams.",
        error:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal Server Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No teams found." });
    }

    res
      .status(200)
      .json(results);
  });
});

app.get('/api/bots', (req, res) => {
  const query = 'SELECT * FROM bots';
  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching data:', err.message);
          res.status(500).json({ error: 'Failed to fetch data from bots table' });
          return;
      }
      res.json(results); // Return the fetched data as JSON
  });
});

app.post("/results", (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO result (
      ${Object.keys(data).join(", ")}
    ) VALUES (
      ${Object.values(data).map(() => "?").join(", ")}
    )
  `;

  db.query(query, Object.values(data), (err, result) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(201).send({ message: "Result created successfully", id: result.insertId });
  });
});

// Read all results
app.get("/results", (req, res) => {
  const query = "SELECT * FROM result";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(200).send(results);
  });
});

// Read a single result by ID
app.get("/results/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM result WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    if (result.length === 0) {
      res.status(404).send({ message: "Result not found" });
      return;
    }
    res.status(200).send(result[0]);
  });
});

// Update a result by ID
app.put("/results/:id", (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const query = `
    UPDATE result
    SET ${Object.keys(data).map((key) => `${key} = ?`).join(", ")}
    WHERE id = ?
  `;

  db.query(query, [...Object.values(data), id], (err) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(200).send({ message: "Result updated successfully" });
  });
});

// Delete a result by ID
app.delete("/results/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM result WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(200).send({ message: "Result deleted successfully" });
  });
});

app.get("/", (req, res) => {
  res.send("API Works Perferctly 👌🏻😁 ");
});

const listenPort = process.env.X_ZOHO_CATALYST_LISTEN_PORT || port;
app.listen(listenPort, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
