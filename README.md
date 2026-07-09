# MultiVend — Backend

Multi-tenant store management SaaS API. Store owners sign up, create branded stores, add products; shoppers browse public storefronts and check out; a platform admin views orders and revenue across every store.

**Live API:** https://multivend-backend-zjf3.onrender.com
**Frontend:** https://multivend-frontend.vercel.app
**Frontend repo:** https://github.com/divyeshwaghelaworks-del/multivend-frontend

> Note: this API is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. The first request after idle can take 30–50 seconds to respond while the server wakes up — this is expected, not a bug.

## Tech stack

- Node.js + Express
- PostgreSQL (hosted on Neon) via Prisma ORM
- JWT authentication + bcrypt password hashing

## Setup

1. Clone the repo and install dependencies:
```bash
   git clone https://github.com/divyeshwaghelaworks-del/multivend-backend.git
   cd multivend-backend
   npm install
```

2. Create a `.env` file in the root with:
```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

3. Run the database migrations:
```bash
   npx prisma migrate dev
```

4. Start the dev server:
```bash
   npm run dev
```

The API will be running at `http://localhost:5000`.

## Demo credentials

| Role | Email | Password | Store |
|------|-------|----------|-------|
| Admin | test@example.com | password123 | Acme Corp (`/store/acme-corp`) |

Log in with this account to see the CRM dashboard on the frontend, or use the public storefront routes without logging in at all.

## API overview

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/stores` | Owner |
| GET | `/api/stores/mine` | Owner |
| PUT | `/api/stores/:id` | Owner |
| GET | `/api/stores/public/:slug` | Public |
| POST | `/api/products/store/:storeId` | Owner |
| GET | `/api/products/store/:storeId` | Owner |
| PUT | `/api/products/:id` | Owner |
| DELETE | `/api/products/:id` | Owner |
| GET | `/api/products/public/:slug?search=&category=` | Public |
| POST | `/api/orders/checkout/:slug` | Public (shopper checkout) |
| GET | `/api/orders/store/:storeId` | Owner (own orders only) |
| GET | `/api/crm/orders?storeId=` | Admin only |
| GET | `/api/crm/revenue` | Admin only |
| GET | `/api/crm/stores` | Admin only |

## Architecture & multi-tenancy approach

Every `Product` and `Order` row carries a `storeId` foreign key. Tenant isolation is enforced **server-side** in every query:

- Public routes (storefront, checkout) scope all reads/writes to the store resolved from the `:slug` in the URL — a shopper on `/store/acme` can never see or affect Globex's data.
- Owner routes check that the authenticated user's ID matches the store's `ownerId` before allowing any read/write — verified in each controller, not just at the route level.
- Admin routes check `role === 'ADMIN'` via a `requireAdmin` middleware, separate from the regular `requireAuth` check.

Checkout is wrapped in a Prisma `$transaction`: the order, its line items, and the stock decrement all succeed or fail together, so a partial checkout can never leave stock in an inconsistent state. Prices and stock are re-read from the database at checkout time rather than trusting whatever the client sends — this stops a shopper from tampering with the price in their browser.

## Trade-offs & what I'd improve with more time

- **Client-side route guards on the frontend** (dashboard/CRM) currently just check `localStorage` in a `useEffect` before redirecting — the real security boundary is server-side (every protected endpoint independently checks ownership/role), but a proper middleware-based auth check on the frontend would be more robust.
- **No pagination** on product or order lists yet — fine at current data volumes, but would need it for a production store with thousands of products/orders.
- **No image upload** — products currently take a plain image URL rather than a file upload to Cloudinary/S3.
- **Order status is always PENDING** — there's no UI yet to transition an order through a fulfillment workflow (shipped, delivered, etc.), though the schema already supports it via the `OrderStatus` enum.
- **Render's free tier cold start** adds noticeable latency on the first request after idle — a paid tier or a different host would remove this for a real production deployment.