# RoleCall: Theater Cast Scheduling System

RoleCall is a theater cast scheduling backend prototype built for ITEC 116 (Systems Integration). It helps directors manage theater productions, rehearsals, and cast assignments while actors submit their availability, with conflict checks to prevent double-booking.

## Tech Stack

- NestJS (TypeScript)
- TypeORM
- MySQL
- JWT Authentication & bcryptjs
- Postman (API testing)

## Running Locally

1. Create a MySQL database (for example, `rolecall_db`).
2. Copy `.env.example` to `.env` and fill in your local MySQL credentials and `JWT_SECRET`.
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm run start:dev
```

- API base URL: `http://localhost:3000/api/v1`
- Simple web interface: `http://localhost:3000`
