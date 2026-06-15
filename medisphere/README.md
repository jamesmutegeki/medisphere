# MediSphere — Connected Healthcare Ecosystem

A secure, cloud-based **Hospital Management System** that streamlines clinical operations, improves administrative efficiency, and enhances the patient experience.

Built with Next.js 16, Prisma + PostgreSQL, and Tailwind CSS. HIPAA compliant and HL7/FHIR ready.

## Features

### Clinical Dashboard
Comprehensive EHR access with timeline views, vitals tracking, and e-prescribing.

### Smart Scheduling
Real-time appointment booking with automated reminders via SMS and email.

### Ward Management
Live visual map of bed occupancy across emergency, ICU, general, pediatrics, maternity, and surgery wards.

### Vitals Tracking
Flowsheets for nurses with visual trend graphs and real-time monitoring.

### Staff Management
Rota scheduling, leave management, and resource allocation.

### Pharmacy & Inventory
Medication dispensing logs, stock tracking, reorder alerts, and expiry management.

### Lab & Immunization
Order and view lab results, manage immunization records and referrals.

### Billing & Insurance
Auto-invoicing, insurance claim processing, and payment reconciliation.

## Role-Based Access

| Role | Capabilities |
|---|---|
| **Patients** | Self-registration, online booking, medical history, secure payments |
| **Doctors & Nurses** | Clinical dashboards, EHR timeline, digital prescriptions, vitals flowsheets |
| **Administrators** | Bed/ward management, staff rota, real-time analytics, resource allocation |
| **Billing Officers** | Auto-invoicing, insurance processing, claim tracking, payment reconciliation |
| **Super Admin** | Full system access, audit logs, configuration |

## Security

- **AES-256 Encryption** — All data encrypted at rest and in transit with TLS 1.3
- **Role-Based Access Control** — Granular permissions preventing unauthorized access
- **Immutable Audit Trails** — Every read, write, and delete action is logged
- **HL7/FHIR Ready** — Standards-compliant APIs for interoperability

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** next-auth, JWT, bcryptjs
- **UI:** Tailwind CSS + Framer Motion + Lucide Icons
- **Email:** Nodemailer
- **Validation:** Zod
- **Language:** TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed the database |

## License

MIT
