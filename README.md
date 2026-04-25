# BetterUptime - Multi-Region Monitoring System

A high-performance, distributed uptime monitoring system built with Rust (Backend) and Next.js (Frontend). This system supports monitoring websites from multiple geographic regions simultaneously.

## 🚀 Architecture

The system consists of three main components:

1.  **Central Server**: The "Brain" of the operation.
    *   **PostgreSQL**: Stores users, websites, and monitoring results (ticks).
    *   **Redis**: Acts as a task queue using Redis Streams.
    *   **API (Rust/Poem)**: Handles frontend requests, authentication, and data retrieval.
    *   **Pusher (Rust)**: A scheduler that periodically pushes monitoring tasks into Redis.
2.  **Regional Workers (Rust)**:
    *   Distributed across different geographic locations (e.g., Bangalore, SFO).
    *   Poll tasks from the Central Redis server.
    *   Perform HTTP/HTTPS pings with retries.
    *   Save results directly to the Central PostgreSQL database.
3.  **Frontend (Next.js)**:
    *   A premium, dark-mode dashboard for managing websites and viewing uptime analytics/graphs.

---

## 🛠️ Tech Stack

*   **Backend**: Rust (Poem, Diesel ORM, Tokio)
*   **Frontend**: Next.js 15+, Tailwind CSS, Lucide React
*   **Infrastructure**: Docker, Docker Compose, PostgreSQL, Redis
*   **Deployment**: Multi-region DigitalOcean Droplets

---

## 🚦 Getting Started

### 1. Prerequisites
*   Rust (latest stable)
*   Bun or Node.js
*   Docker & Docker Compose

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
DB_PASSWORD=your_password
DATABASE_URL=postgres://postgres:your_password@your_central_ip:5432/betteruptime

# Redis
REDIS_URL=redis://:your_redis_password@your_central_ip:6379
REDIS_PASSWORD=your_redis_password

# API & Frontend
API_PORT=3001
NEXT_PUBLIC_API_URL=http://your_central_ip:3001
JWT_SECRET=your_secret
JWT_EXPIRATION=86400

# Region Identification
REGION_ID="worker-blr"
```

### 3. Local Development

**Run the Backend (Rust):**
```bash
cd betterstack-rust
cargo run --bin api      # Start the API
cargo run --bin pusher   # Start the Scheduler
cargo run --bin worker   # Start the local Worker
```

**Run the Frontend:**
```bash
cd betterstack-frontend
bun install
bun run dev
```

---

## 🚢 Deployment (Docker)

### Central Server Setup
1. Copy `docker-compose.central.yml` to your main droplet.
2. Run: `docker compose -f docker-compose.central.yml up -d --build`

### Worker Setup
1. Copy `docker-compose.worker.yml` and `.env.worker` to your regional droplets.
2. Run: `docker compose -f docker-compose.worker.yml up -d --build`

---

## 📊 Features
*   **Real-time Monitoring**: Sub-second precision for uptime checks.
*   **Multi-Region Support**: Track latency and availability from different parts of the world.
*   **Uptime Analytics**: 24h, 7d, and 30d uptime percentages.
*   **Response Time Graphs**: Beautiful visualizations of site performance.
*   **Incident Tracking**: Automatic detection of downtime events.

---

## 🛡️ Security
*   JWT-based authentication for the API.
*   Password hashing using `argon2`.
*   Redis protected by passwords.
*   Firewall-ready configuration (UFW instructions included in deployment).
