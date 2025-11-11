const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const auth = require("../middleware/auth");

// --- Guest Login ---
router.post("/login", async (req, res) => {
  const { room_number, phone } = req.body;
  if (!room_number || !phone)
    return res.status(400).json({ error: "room_number and phone required" });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT g.Guest_ID, r.Reservation_ID, r.Room_No
         FROM guest g
         JOIN reservation r ON r.Guest_ID = g.Guest_ID
         WHERE g.Contact = ? AND r.Room_No = ? LIMIT 1`,
        [phone, room_number]
      );

      if (rows.length === 0)
        return res
          .status(401)
          .json({ error: "Invalid credentials or no active reservation" });

      const payload = {
        role: "guest",
        guest_id: rows[0].Guest_ID,
        reservation_id: rows[0].Reservation_ID,
        room_no: rows[0].Room_No,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET || "dev_secret", {
        expiresIn: "8h",
      });

      res.json({ token, payload });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Get Guest Reservation Info ---
router.get("/me", auth("guest"), async (req, res) => {
  const { guest_id, reservation_id } = req.user;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT r.Reservation_ID, r.Room_No, r.CheckIn_Date, r.CheckOut_Date,
                r.Number_of_Guests, b.Amount, b.Payment_Status AS Billing_Status
         FROM reservation r
         LEFT JOIN billing b ON b.Reservation_ID = r.Reservation_ID
         WHERE r.Reservation_ID = ? AND r.Guest_ID = ?`,
        [reservation_id, guest_id]
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "Reservation not found" });
      res.json({ reservation: rows[0] });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Get guest info error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Get Food Orders ---
router.get("/orders", auth("guest"), async (req, res) => {
  const { guest_id } = req.user;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT fo.Order_ID, mi.Item_Name, fo.Quantity, fo.Order_Time, fo.Status
         FROM food_order fo
         LEFT JOIN menu_item mi ON mi.Item_ID = fo.Item_ID
         WHERE fo.Guest_ID = ?
         ORDER BY fo.Order_Time DESC`,
        [guest_id]
      );
      res.json({ orders: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Get Service Requests ---
router.get("/services", auth("guest"), async (req, res) => {
  const { guest_id } = req.user;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT Request_ID, Service_Type, Request_Date
         FROM service_request
         WHERE Guest_ID = ?
         ORDER BY Request_Date DESC`,
        [guest_id]
      );
      res.json({ services: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Get services error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Place a Food Order ---
router.post("/order", auth("guest"), async (req, res) => {
  const { guest_id } = req.user;
  const { item_id, quantity } = req.body;

  if (!item_id || !quantity)
    return res.status(400).json({ error: "item_id and quantity required" });

  try {
    const conn = await pool.getConnection();
    try {
      // ✅ Added Status column
      const [result] = await conn.query(
        `INSERT INTO food_order (Guest_ID, Item_ID, Quantity, Order_Time, Status)
         VALUES (?, ?, ?, NOW(), 'Pending')`,
        [guest_id, item_id, quantity]
      );
      res.json({ success: true, order_id: result.insertId });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Request Room Service ---
router.post("/request-service", auth("guest"), async (req, res) => {
  const { guest_id } = req.user;
  const { service_type } = req.body;

  if (!service_type)
    return res.status(400).json({ error: "Service type is required" });

  try {
    const conn = await pool.getConnection();
    try {
      // ✅ Only 3 columns — no Status column
      await conn.query(
        `INSERT INTO service_request (Guest_ID, Service_Type, Request_Date)
         VALUES (?, ?, CURDATE())`,
        [guest_id, service_type]
      );

      res.json({ message: "Service request submitted successfully!" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Request service error:", err);
    res.status(500).json({ error: "Server error submitting service request" });
  }
});

// --- Get Menu Items ---
router.get("/menu", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT Item_ID, Item_Name, Price, Category
         FROM menu_item
         ORDER BY Category, Item_Name`
      );
      res.json({ menu: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Get menu error:", err);
    res.status(500).json({ error: "Server error fetching menu" });
  }
});

module.exports = router;
