# RoleCall: Theater Cast Scheduling System

RoleCall is a backend web application built for theater groups. It helps directors manage stage productions and rehearsal schedules while actors share their available or unavailable hours. Automatic time checks block overlapping schedules before they are saved, and actors receive email alerts when they are assigned or when a rehearsal is updated.

## Features

- User accounts with hashed passwords and JWT login (`director` and `actor` roles)
- Production management and rehearsal scheduling with overlap checks
- Actor availability tracking with owner permission checks
- Cast assignments that block double-booking or unavailable time slots
- Actor email alerts sent through Nodemailer in 12-hour time format
- Simple web interface for basic browser testing

## Tech Stack

- NestJS with TypeScript
- TypeORM
- MySQL
- JWT with bcryptjs
- Nodemailer (Gmail SMTP)
- HTML / CSS / JavaScript
- Postman

## Running Locally

1. Clone this repository and open the project folder:

```bash
git clone https://github.com/damlorine/rolecall.git
cd rolecall
```

2. Install the project packages:

```bash
npm install
```

3. Create an empty MySQL database named `rolecall_db`.
4. Copy `.env.example` to `.env` and fill in your local database credentials along with a `JWT_SECRET`. You can also add Gmail SMTP settings if you want live actor email alerts.
5. Start the development server:

```bash
npm run start:dev
```

## Local URLs

- REST API (27 endpoints): `http://localhost:3000/api/v1`
- Simple web page: `http://localhost:3000`
