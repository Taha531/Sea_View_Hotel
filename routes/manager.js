const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Manager login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username + password required" });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM managers WHERE username=? LIMIT 1`,
        [username]
      );
      if (!rows.length || rows[0].password !== password)
        return res.status(401).json({ error: "Invalid manager credentials" });

      const token = jwt.sign({ role: "manager", username }, JWT_SECRET, {
        expiresIn: "8h",
      });
      res.json({ token, payload: { username } });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Occupied Rooms
router.get("/rooms", auth("manager"), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT r.Room_No, r.Number_of_Guests, r.CheckIn_Date, r.CheckOut_Date, g.Name
        FROM reservation r
        JOIN guest g ON g.Guest_ID = r.Guest_ID
        ORDER BY r.Room_No
      `);
      res.json({ rooms: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Service Requests
router.get("/services", auth("manager"), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT sr.Request_ID, sr.Service_Type, sr.Request_Date, g.Name AS Guest_Name, r.Room_No
        FROM service_request sr
        JOIN guest g ON g.Guest_ID = sr.Guest_ID
        JOIN reservation r ON r.Guest_ID = sr.Guest_ID
        ORDER BY sr.Request_Date DESC
      `);
      res.json({ services: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Food Orders
router.get("/orders", auth("manager"), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT fo.Order_ID, fo.Status, fo.Quantity, mi.Item_Name, g.Name AS Guest_Name, r.Room_No, fo.Order_Time
        FROM food_order fo
        JOIN menu_item mi ON mi.Item_ID = fo.Item_ID
        JOIN guest g ON g.Guest_ID = fo.Guest_ID
        JOIN reservation r ON r.Guest_ID = fo.Guest_ID
        ORDER BY fo.Order_Time DESC
      `);
      res.json({ orders: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Get Menu Items ---
router.get("/menu", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT Item_ID, Item_Name, Price, Category FROM menu_item ORDER BY Category, Item_Name`
      );
      res.json({ menu: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error fetching menu:", err);
    res.status(500).json({ error: "Error loading menu" });
  }
});

module.exports = router;
