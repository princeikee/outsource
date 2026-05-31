# Taskflow ERP Backend

Production-ready MVP backend for a multi-tenant SaaS ERP using Node.js, Express, PostgreSQL, Prisma, JWT, and Socket.io.

## Setup

1. Copy `.env.example` to `.env`.
2. Update `DATABASE_URL` and `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm run db:push` for local development or `npm run db:migrate` when you are ready for migrations.
5. Start the API with `npm run dev` or `npm run start`.

## Multi-Tenancy

Every tenant-owned model has `companyId`. Authenticated requests get `req.companyId` and `req.tenantFilter` from the JWT. The `tenantScope` middleware rejects cross-company writes, and services always query by `{ companyId, ... }` so one company cannot read or update another company's data.

Socket.io clients authenticate with the same JWT:

```js
io('http://localhost:5000', {
  auth: { token }
})
```

The socket server automatically joins clients to `company:<companyId>` rooms.

## Core Endpoints

Base URL: `/api/v1`

### Auth

- `POST /auth/register` creates a company and admin user.
- `POST /auth/login` returns a JWT.

### Employees

- `GET /employees`
- `POST /employees`
- `PATCH /employees/:id`
- `PATCH /employees/:id/assignment`
- `DELETE /employees/:id`

### Attendance

- `POST /attendance/clock-in`
- `POST /attendance/clock-out`
- `GET /attendance/daily`
- `GET /attendance/employees/:employeeId/history`

### Payroll

- `GET /payroll`
- `POST /payroll/salary`
- `POST /payroll/generate`
- `PATCH /payroll/:id/status`

### Accounting

- `GET /accounting`
- `POST /accounting`
- `GET /accounting/summary`

## Realtime Events

- `attendance:clock-in`
- `attendance:clock-out`
- `payroll:generated`
- `payroll:updated`
