require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/projects/:projectId/tasks", require("./routes/tasks"));
app.use("/api/dashboard", require("./routes/dashboard"));

// Users search (for adding members)
const { auth } = require("./middleware/auth");
const db = require("./db/database");
app.get("/api/users/search", auth, (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email query required" });
  const user = db.prepare("SELECT id, name, email FROM users WHERE email LIKE ?").get(`%${email}%`);
  res.json({ user: user || null });
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
