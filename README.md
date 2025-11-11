# Seaview Hotel - Backend API (Node.js + Express)

This project provides a simple backend API to interact with your existing `seaviewhotel` MySQL database.

## Quick setup

1. Create a project folder and add files exactly as labeled in this doc (package.json, app.js, db.js, middleware/auth.js, routes/guest.js, routes/manager.js).
2. Copy `.env.example` to `.env` and fill DB credentials + JWT secret + admin credentials.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start server:
   ```bash
   npm run dev
   ```

## Endpoints (summary)

- POST `/api/guest/login` { room_number, phone } -> { token }
- GET `/api/guest/me` (Auth Bearer) -> reservation info
- GET `/api/guest/orders` (Auth) -> list of their orders
- POST `/api/guest/order` { item_id, quantity } (Auth) -> place order
- POST `/api/guest/request-service` { service_type } (Auth) -> request

- POST `/api/manager/login` { username, password } -> { token }
- GET `/api/manager/guests` (Auth manager) -> list
- GET `/api/manager/rooms`
- GET `/api/manager/kitchen-orders`
- GET `/api/manager/billing`
- GET `/api/manager/service-requests`
- POST `/api/manager/order/update-status` { order_id, status }

## Notes

- This code uses JWT for authentication. Tokens expire in 8 hours.
- For production: hash manager passwords, use HTTPS, and consider a persistent session store or proper user table with hashed passwords.
