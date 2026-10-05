# ⚡ QueueLess — Smart Queue & Appointment Management System

> **A realistic, role-isolated, production-grade virtual queue and scheduled appointment ecosystem designed for high-density campus environments and public administrative departments.**

---

## 📌 Problem Statement

Traditional queuing systems in universities, clinics, and government offices suffer from severe pain points:
- **Physical Congestion & Frustration**: Students and visitors spend hours waiting in cramped waiting rooms or standing in queues without real-time visibility into their turn.
- **Unpredictable Waiting Times**: Lack of live algorithmic wait estimations leads to missed slots, overcrowding, and unpredictable counter traffic.
- **Inadequate Operator Controls**: Counter staff have limited real-time oversight of queue priority, appointment bookings, and performance telemetry.
- **Flawed Access Control**: Weak role separation between administrative staff, operators, and students introduces security risks, session leakage, and unauthorized access to privileged endpoints.

---

## 💡 Solution

**QueueLess** re-engineers the campus service experience with a cybernetic, highly responsive, role-based architecture:
1. **Strict Role-Based Access Control (RBAC)**: Enforces three distinct personas (`STUDENT`, `STAFF`, `ADMIN`) validated by backend JWT claims on every single API request. Client state never dictates authorization.
2. **Virtual Queuing & Monotonic Token Generation**: Students can join virtual queues remotely from their phone or laptop, receive an instant holographic digital pass with a QR code, and track their line position in real time.
3. **Dynamic Wait Time Telemetry**: Uses a mathematical service model accounting for people ahead, active counters, and historical handling durations to predict arrival times accurately.
4. **Real-Time Synchronized Event Bus (SSE)**: Powered by Server-Sent Events, queue changes, "Call Next" chimes, and status transitions propagate instantly across the Student Tracker, Staff Desk, Admin Command Hub, and Hallway TV Kiosks.
5. **Scheduled Appointment Booking**: Eliminates walk-in congestion by allowing students to reserve guaranteed 30-minute consultation slots.

---

## ✨ System Features by Role

### 🎓 1. Student Portal (`/student/*`)
- **Interactive Service Directory**: Browse departments (Registrar, Fee Accounts, Library, Student Affairs) with live status tags, operating hours, and active counter indicators.
- **Virtual Token Generation**: 1-click token issuance with purpose/notes capture and duplicate active-ticket conflict resolution.
- **Holographic Digital Pass**: High-contrast cyber pass with unique token code, QR code verification, shareable links, and print functionality.
- **Live Queue Journey Tracker**: Real-time position tracking (`#3 in line`), countdown estimates, and animated status pipeline (`Issued` &rarr; `Waiting` &rarr; `Called` &rarr; `Serving` &rarr; `Completed`).
- **Sound Alert & Chime**: Browser-based audio notifications and celebration confetti when a token is called or consultation concludes.
- **Self-Service Cancellation**: Instant, safe token cancellation with complete IDOR protection.
- **Appointment Booking**: Select department, pick date, and reserve available capacity slots with instant calendar confirmation.
- **Historical Activity & Feedback**: View past consultations and leave 1-to-5 star ratings with written feedback.

### 🎧 2. Staff Operator Desk (`/staff/*`)
- **Counter Station Controls**: Claim counters or manage designated service desks.
- **Smart "Call Next"**: Automatically calls the highest-priority student waiting in line.
- **Consultation Stopwatch & Telemetry**: Live timer monitoring current service duration against departmental averages.
- **Status Lifecycle Transitions**: Seamlessly mark students as `Serving`, `Completed`, or `Skipped`.
- **Audio Recall Chime**: Re-announce audio alerts to the lobby if a visitor does not immediately approach the counter.
- **Operator History & Performance**: Review all tickets processed during the work shift.

### ⚡ 3. Admin Command Hub (`/admin/*`)
- **System Telemetry Overview**: Live metrics for total throughput, active tickets, average turnaround time, and satisfaction ratings.
- **Student & Staff Roster Management**: Search, filter, inspect, and manage university users.
- **Department & Counter Configuration**: Add new services, configure handling times, add/toggle active counters, or pause queue intake during emergency breaks.
- **Queue Desk Oversight**: Real-time intervention capabilities to reassign or recall tokens across any departmental counter.
- **Campus Settings**: Configure campus title, operating hours, capacity thresholds, and chime tones.
- **Analytics & Reporting**: Visual metrics on hourly peak load patterns and student satisfaction scores.

### 📺 4. Public Lobby TV / Kiosk Display (`/display`)
- **Zero-Authentication Big-Screen Mode**: Designed for wall-mounted TV monitors and lobby kiosks in waiting halls.
- **Live Counter Callboard**: High-visibility split-screen showing currently serving tokens, counter assignments, and upcoming tokens in line.
- **Live Ticker & Chimes**: Flashing alerts and synchronized audio cues when counters advance.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript | Component-based, strictly typed, high performance |
| **Build & Dev Tool** | Vite 8 | Ultra-fast HMR and optimized production bundling |
| **Styling & Theme** | Vanilla CSS (Cyber Theme) | Custom design system with Glassmorphism, Neon HUD, Dark Theme |
| **Icons & Visuals** | Lucide React + Canvas Confetti | Modern UI icons, holographic badges, celebration effects |
| **Backend Runtime** | Node.js (ES Modules) | Asynchronous, event-driven runtime |
| **REST API Framework** | Express.js 4 | Modular routers, CORS enabled, input validation |
| **Database** | SQLite + `better-sqlite3` | High-throughput, synchronous WAL-mode embedded SQL |
| **Real-Time Streaming** | Server-Sent Events (SSE) | Unidirectional low-latency event bus for browser updates |
| **Authentication & RBAC** | JWT (`jsonwebtoken`) + `bcryptjs` | Cryptographically signed tokens, role claims in payload |
| **Testing** | Node.js Test Runners | 56 automated security & end-to-end integration tests |

---

## 📦 Project Structure

```
c:/QueueLessWeb/
├── client/                     # Vite + React TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable layouts, navbars, cards, modals
│   │   ├── context/            # AuthContext (JWT session state & demo login)
│   │   ├── hooks/              # SSE queue stream & audio alert hooks
│   │   ├── pages/              # Role-specific and public view pages
│   │   ├── services/           # Typed API client wrapper
│   │   ├── App.tsx             # Route definitions & ProtectedRoute wrappers
│   │   ├── index.css           # Global Cyber Matrix design tokens
│   │   └── main.tsx            # Application entry point
│   ├── index.html              # HTML shell
│   ├── package.json            # Frontend dependencies & scripts
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.ts          # Vite build & proxy configuration
├── server/                     # Node.js Express REST API & SSE Server
│   ├── middleware/             # authenticateToken & requireRole RBAC guards
│   ├── routes/                 # auth, student, staff, admin, queues, services
│   ├── utils/                  # SSE broadcaster & wait calculation algorithms
│   ├── db.js                   # SQLite schema initialization & auto-seeding
│   ├── index.js                # Express server entry point
│   ├── package.json            # Backend dependencies
│   ├── test_rbac_security.js   # 25-point automated RBAC security test suite
│   └── test_e2e_full_flow.js   # 31-point end-to-end user journey test suite
├── .env.example                # Environment variables template
├── .gitignore                  # Git exclusion rules for secrets, DB, and builds
├── package.json                # Root workspace orchestration scripts
└── README.md                   # System documentation
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/queueless.git
cd queueless

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Environment Configuration

Copy the example environment template to `.env`:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Review and adjust variables in `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Servers

Run both the backend API and frontend client concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **Waiting Hall Display Screen**: [http://localhost:3000/display](http://localhost:3000/display)

---

## 🔑 Pre-Configured Test Credentials

For quick evaluation, pre-seeded accounts and a **1-Click Demo Persona Bar** on the Login screen are provided:

| Role | Email | Password | Default Portal |
| :--- | :--- | :--- | :--- |
| **Student** | `student@queueless.edu` | `student123` | `/student/dashboard` |
| **Staff Operator** | `staff@queueless.edu` | `staff123` | `/staff/dashboard` |
| **System Admin** | `admin@queueless.edu` | `admin123` | `/admin/dashboard` |

---

## 🧪 Testing & Quality Assurance

Run the automated test suite covering RBAC security isolation and complete user journey workflows:

```bash
# Run both test suites from root
npm test
```

### Individual Test Suites
```bash
# 1. Verify strict RBAC boundaries & security (25 tests)
node server/test_rbac_security.js

# 2. Verify complete end-to-end user lifecycle (31 tests)
node server/test_e2e_full_flow.js
```

---

## 🚢 Production Deployment Notes

### 1. Frontend & Full-Stack Deployment on Vercel
QueueLess includes ready-to-deploy Vercel configuration (`vercel.json` and `api/index.js` serverless handler):

1. **Push your code to GitHub / GitLab**.
2. **Import the repository into Vercel**.
3. **Environment Variables**:
   - `JWT_SECRET`: Generate a secure secret string.
   - `NODE_ENV`: `production`.
4. Deploy! Vercel automatically builds the Vite client (`npm run build`) and routes `/api/*` to the serverless function.

> **Note on Serverless SQLite**: For high-concurrency production deployments requiring permanent multi-region state, connect to an external SQL database or deploy the Express backend to a continuous container host (such as Render, Railway, Fly.io, or VPS) and point `VITE_API_URL` to it.

### 2. Frontend Production Build (Self-Hosted)
To create an optimized production bundle:
```bash
npm run build
```
Compiled static assets will be output to `client/dist/`.

### 3. Reverse Proxy (Nginx) Configuration
In production environments, serve the compiled `client/dist/` through Nginx or Caddy, proxying `/api` requests to the Node.js process:

```nginx
server {
    listen 80;
    server_name queueless.yourdomain.edu;

    # Serve React client
    location / {
        root /var/www/queueless/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API & SSE Stream
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # SSE Buffering Configuration
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

### 4. Process Management (PM2)
Run the backend with PM2 for automatic restarts:
```bash
npm install -g pm2
pm2 start server/index.js --name "queueless-api"
pm2 save
```

### 4. Production Security Checklist
- [x] Set strong, random `JWT_SECRET` in `.env`.
- [x] Ensure `.env` and `*.db` files are ignored by git (enforced in `.gitignore`).
- [x] Set `NODE_ENV=production`.
- [x] Configure HTTPS/TLS using Certbot / Let's Encrypt.
- [x] Enable rate-limiting or web application firewalls (WAF) for public registration endpoints.

---

## 📄 License
This project is released under the **MIT License**.
