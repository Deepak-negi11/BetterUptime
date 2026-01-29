# BetterUptime Multi-Region Deployment Guide

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │     CENTRAL SERVER (139.59.74.210)      │
                    │  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
                    │  │ Postgres│ │  Redis  │ │    API    │  │
                    │  │  :5432  │ │  :6379  │ │   :3001   │  │
                    │  └─────────┘ └─────────┘ └───────────┘  │
                    │              ┌─────────┐                │
                    │              │ Pusher  │                │
                    │              └─────────┘                │
                    └─────────────────────────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
    ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
    │   WORKER    │           │   WORKER    │           │   WORKER    │
    │india-mumbai │           │  us-east-1  │           │  eu-west-1  │
    │ (Droplet 1) │           │ (Droplet 2) │           │ (Droplet 3) │
    └─────────────┘           └─────────────┘           └─────────────┘
```

---

## Step 1: Deploy Central Server

SSH into your central droplet (139.59.74.210):

```bash
ssh root@139.59.74.210
```

### 1.1 Clone the Repository

```bash
git clone <your-repo-url> /opt/betteruptime
cd /opt/betteruptime
```

### 1.2 Configure Environment

```bash
# Copy and edit the central environment file
cp .env.central .env

# Edit with your actual passwords
nano .env
```

**IMPORTANT: Set a strong `REDIS_PASSWORD`!**

### 1.3 Configure Firewall

Allow connections from your worker droplets:

```bash
# Allow PostgreSQL
ufw allow 5432/tcp

# Allow Redis
ufw allow 6379/tcp

# Allow API (for frontend)
ufw allow 3001/tcp

# Allow HTTP/HTTPS (for frontend)
ufw allow 80/tcp
ufw allow 443/tcp
```

### 1.4 Start Central Services

```bash
docker-compose -f docker-compose.central.yml --env-file .env up -d --build
```

### 1.5 Verify Services

```bash
# Check all containers are running
docker-compose -f docker-compose.central.yml ps

# Check logs
docker-compose -f docker-compose.central.yml logs -f
```

---

## Step 2: Deploy Regional Workers

SSH into each regional droplet and repeat:

### 2.1 Clone the Repository

```bash
git clone <your-repo-url> /opt/betteruptime
cd /opt/betteruptime
```

### 2.2 Create Worker Environment

```bash
# Create .env.worker from example
cp .env.worker.example .env.worker

# Edit with correct values
nano .env.worker
```

Update these values:
- `CENTRAL_IP`: IP of your central server
- `DB_PASSWORD`: Same as central server
- `REDIS_PASSWORD`: Same as central server
- `REGION_ID`: Unique region name (e.g., `us-east-1`, `eu-west-1`)

### 2.3 Start Worker

```bash
docker-compose -f docker-compose.worker.yml --env-file .env.worker up -d --build
```

### 2.4 Verify Worker

```bash
# Check worker is running
docker-compose -f docker-compose.worker.yml logs -f
```

You should see:
```
🚀 Real-Region Worker Started: region=us-east-1
```

---

## Step 3: Deploy Frontend

### Option A: Same Server as Central

Add to your central server:

```bash
cd /opt/betteruptime/betterstack-frontend

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://139.59.74.210:3001" > .env.local

# Run with npm
npm install
npm run build
npm start
```

### Option B: Separate Frontend Server (Recommended)

Use Vercel, Netlify, or another frontend hosting service.

Set environment variable:
```
NEXT_PUBLIC_API_URL=http://139.59.74.210:3001
```

---

## Region ID Examples

| Region          | REGION_ID         | Location              |
|-----------------|-------------------|-----------------------|
| India           | `india-mumbai`    | Mumbai, India         |
| US East         | `us-east-1`       | Virginia, USA         |
| US West         | `us-west-1`       | California, USA       |
| Europe          | `eu-west-1`       | Ireland               |
| Europe Central  | `eu-central-1`    | Frankfurt, Germany    |
| Singapore       | `ap-southeast-1`  | Singapore             |
| Australia       | `ap-southeast-2`  | Sydney, Australia     |

---

## Security Recommendations

1. **Use Strong Passwords**: 
   - Generate with: `openssl rand -base64 32`

2. **Restrict IP Access**:
   ```bash
   # Allow only specific worker IPs to access DB/Redis
   ufw allow from <worker-ip> to any port 5432
   ufw allow from <worker-ip> to any port 6379
   ```

3. **Use Private Network** (DigitalOcean VPC):
   - Enable private networking between droplets
   - Use private IPs instead of public IPs

4. **Enable SSL** (Production):
   - Use Nginx reverse proxy with Let's Encrypt
   - Enable SSL for PostgreSQL connections

---

## Troubleshooting

### Worker can't connect to Redis/DB

1. Check firewall: `ufw status`
2. Test connectivity: `telnet 139.59.74.210 6379`
3. Verify password matches central server

### Container keeps restarting

```bash
docker-compose logs -f worker
```

### Database connection refused

- Ensure `listen_addresses='*'` in postgres config
- Check pg_hba.conf allows remote connections

---

## Commands Cheat Sheet

```bash
# Central Server
docker-compose -f docker-compose.central.yml --env-file .env up -d --build
docker-compose -f docker-compose.central.yml logs -f
docker-compose -f docker-compose.central.yml down

# Worker (on regional droplets)
docker-compose -f docker-compose.worker.yml --env-file .env.worker up -d --build
docker-compose -f docker-compose.worker.yml logs -f
docker-compose -f docker-compose.worker.yml down
```
