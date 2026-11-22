# Clever Sub Watch 💳🔍

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

**Clever Sub Watch** is an intelligent, full-stack subscription management and financial tracking platform. It automatically detects recurring subscriptions through connected bank accounts and Gmail receipts, visualizes cash outflow trends, and provides an AI-powered conversational assistant to optimize your monthly recurring spending.

---

## 🚀 Key Features

- **🏦 Multi-Provider Open Banking Integration**
  - **Quiltt API**: Connect US and global financial institutions to automatically detect recurring subscription payments and transaction patterns.
  - **Mono Open Banking**: Connect and monitor accounts across African banks and financial services.
  - **Recurring Detection Engine**: Automatically flags recurring merchant charges, calculates billing frequencies, and filters out non-subscription noise.

- **📧 Automated Gmail Receipt & Invoice Scanning**
  - Integrates with Google OAuth and the Gmail API to scan incoming emails for digital receipts, billing statements, and subscription renewals.
  - Uses intelligent parsing to extract subscription costs, billing frequencies, and renewal dates directly from email confirmations.

- **🤖 AI Financial Insights & Chat Assistant**
  - Built with OpenAI to deliver real-time analysis of recurring expenses.
  - Chat with your subscriptions assistant to get actionable recommendations, uncover hidden or forgotten recurring charges, and optimize spend.

- **📊 Comprehensive Subscription Dashboard**
  - View overall monthly and yearly spend metrics with visual analytics (via Recharts).
  - Track renewal timelines, active/paused statuses, and renewal calendar schedules.
  - Filter and badge subscriptions by detection source (**Bank**, **Email**, or **Manual**).
  - Auto-detected merchant brand icons and logos.

- **🔐 Privacy & Security**
  - Secure authentication powered by JSON Web Tokens (JWT) and `bcrypt` password hashing.
  - Token encryption for third-party OAuth access and banking session tokens.
  - Built-in Privacy Policy and Terms of Service compliance pages.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **State & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Charts & Visuals**: [Recharts](https://recharts.org/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (executed via `tsx` watch mode)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **AI Engine**: [OpenAI API](https://openai.com/)
- **Third-Party APIs**:
  - [Quiltt](https://www.quiltt.io/)
  - [Mono](https://mono.co/)
  - [Google Gmail API](https://developers.google.com/gmail/api)

---

## 📂 Project Structure

```text
clever-sub-watch/
├── public/                 # Static public assets
├── server/                 # Express backend application
│   ├── prisma/             # Prisma schema & migrations
│   │   └── schema.prisma
│   └── src/
│       ├── lib/            # Backend utilities (Gmail scanner, encryption, AI)
│       ├── routes/         # Express API route handlers
│       └── index.ts        # Server entrypoint
├── src/                    # React frontend application
│   ├── components/         # Reusable UI components & shadcn primitives
│   │   ├── dashboard/      # Subscription cards, tables, charts
│   │   ├── landing/        # Landing page sections & footer
│   │   └── ui/             # Radix / shadcn core components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Client utilities & API client helpers
│   ├── pages/              # Routed page views (Dashboard, AI Insights, Bank Connect, etc.)
│   ├── App.tsx             # Application router & provider setup
│   └── main.tsx            # Frontend entrypoint
├── .env.example            # Sample client environment variables
├── package.json            # Root frontend scripts and dependencies
├── tailwind.config.ts      # Tailwind CSS styling configuration
└── vite.config.ts          # Vite build configuration
```

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A running [PostgreSQL](https://www.postgresql.org/) database (local or cloud provider like Supabase/Neon)

---

### 1. Clone the Repository

```bash
git clone https://github.com/xene-21/clever-sub-watch.git
cd clever-sub-watch
```

---

### 2. Configure Environment Variables

#### Client Configuration (Root Directory)
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Populate the values:
```env
VITE_QUILTT_CONNECTOR_ID=your_quiltt_connector_id
VITE_MONO_PUBLIC_KEY=your_mono_public_key
```

#### Server Configuration (`server/` Directory)
Create a `.env` file in the `server` directory:
```bash
cp server/.env.example server/.env
```
Populate the values:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/clever_sub_watch?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/clever_sub_watch?schema=public"

JWT_SECRET="your_jwt_secret"
ENCRYPTION_KEY="your_32_character_encryption_key"

OPENAI_API_KEY="your_openai_api_key"

QUILTT_API_SECRET="your_quiltt_api_secret"
MONO_SECRET_KEY="your_mono_secret_key"

GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

---

### 3. Install Dependencies & Setup Database

Install dependencies for both frontend and backend:

```bash
# Install root (frontend) dependencies
npm install

# Install server dependencies
cd server
npm install

# Generate Prisma Client & push schema to the database
npx prisma generate
npx prisma db push

# Return to root directory
cd ..
```

---

### 4. Run the Development Server

You can run both the frontend (Vite) and backend (Express) concurrently from the root directory:

```bash
npm run dev:all
```

- **Frontend**: Accessible at `http://localhost:5173` (or port specified by Vite)
- **Backend API**: Running at `http://localhost:5000`

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:all` | Runs both Vite dev server and Express backend concurrently |
| `npm run dev` | Runs the Vite frontend development server only |
| `npm run dev --prefix server` | Runs the Express backend server with live reload (`tsx watch`) |
| `npm run build` | Builds the frontend for production |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Lints the project code with ESLint |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a pull request:

1. Fork or branch from `main` (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'feat: add amazing feature'`)
3. Push to your branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
