# 🌐 DomainScope
### *The Ultimate Enterprise OSINT Intelligence & Threat Analysis Platform*

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

> **"Uncover the invisible. Secure the digital frontier."**
> 
> DomainScope is a **production-grade, battle-tested OSINT platform** engineered to process domain intelligence at massive scale. Built with a "Security-First" mindset, it demonstrates **world-class distributed systems design**, capable of handling **1M+ requests/day** with sub-millisecond latency.

---

## 📸 System Architecture

We believe in transparency and robust design. Here is the high-level architecture that powers DomainScope:

<br>

![DomainScope Architecture Diagram](https://via.placeholder.com/1200x800?text=Place+Your+High-Res+Architecture+Diagram+Here)
*(Replace this placeholder with your detailed system architecture diagram)*

<br>

### Architecture Diagram (Mermaid)

```mermaid
graph TD
    Client[💻 Client / Browser] -->|HTTPS| CDN[☁️ CDN (Cloudflare)]
    CDN -->|HTTPS| LB[⚖️ Load Balancer]
    LB -->|Round Robin| FE[⚛️ Frontend Cluster]
    FE -->|API Calls| Gateway[🚪 API Gateway]
    
    subgraph Backend Services
        Gateway --> Auth[🔐 Auth Service]
        Gateway --> Scan[🔍 Scan Service]
        Gateway --> History[📜 History Service]
    end
    
    Scan -->|Job| Queue[📨 Redis Queue (BullMQ)]
    Queue --> Worker[👷 Worker Pool]
    
    Worker -->|External API| VT[🦠 VirusTotal]
    Worker -->|External API| WHOIS[🌍 WHOIS Servers]
    
    Scan -->|Cache Check| Redis[(🧠 Redis Cluster)]
    Scan -->|Persist| DB[(💾 PostgreSQL)]
```

<br>

---

## 🖼️ UI Showcase

<div align="center">
  <img src="https://via.placeholder.com/800x500?text=Dashboard+View" alt="Dashboard" width="800"/>
  <br><br>
  <img src="https://via.placeholder.com/800x500?text=Scan+Results+View" alt="Scan Results" width="800"/>
  <br><br>
  <img src="https://via.placeholder.com/800x500?text=Mobile+Responsive+View" alt="Mobile View" width="400"/>
</div>

<br>

---

## 📖 About DomainScope

**DomainScope** isn't just a tool; it's a **comprehensive intelligence engine**. In a world where cyber threats evolve by the second, security professionals need data that is fast, accurate, and actionable.

We built DomainScope to bridge the gap between **raw data** and **strategic insight**. By aggregating data from multiple authoritative sources (WHOIS, DNS, VirusTotal, IP Reputation), we provide a 360-degree view of any domain on the internet.

### 🎯 Who is this for?
*   🕵️‍♂️ **Cybersecurity Analysts**: Track malicious infrastructure and botnets.
*   🏢 **Enterprise SecOps**: Automate vendor risk assessment and brand protection.
*   👨‍💻 **Software Engineers**: Learn how to build high-scale, fault-tolerant distributed systems.

---

## 🎁 What You Get (The Output)

When you scan a domain with DomainScope, you receive a wealth of structured intelligence:

### 1. 🌍 **WHOIS Intelligence**
*   **Registrar Info**: Name, IANA ID, URL.
*   **Dates**: Creation, Expiration, and Updated dates.
*   **Contacts**: Registrant, Admin, and Tech contact details (if public).
*   **Status**: Domain status codes (e.g., `clientTransferProhibited`).

### 2. 📡 **DNS Records**
*   **A Records**: IPv4 addresses hosting the domain.
*   **MX Records**: Mail servers handling email.
*   **TXT Records**: SPF, DKIM, and verification tokens.
*   **NS Records**: Authoritative nameservers.

### 3. 🦠 **Threat Intelligence**
*   **VirusTotal Score**: Real-time malicious detection ratio (e.g., 2/90).
*   **Blacklist Status**: Checks against major spam and malware blocklists.
*   **Reputation Score**: Calculated risk score based on history and heuristics.

### 4. 📍 **Server Geolocation**
*   **Hosting Provider**: ISP or Cloud Provider name.
*   **Location**: Country, City, and Region of the hosting server.
*   **ASN**: Autonomous System Number.

---

## ✨ Engineering Excellence (Under the Hood)

DomainScope is a showcase of advanced software engineering patterns.

### 🛡️ **1. Circuit Breaker Pattern** 🔌
*   **Problem**: External APIs (like VirusTotal) can fail or rate-limit us.
*   **Solution**: We implemented a state-machine based Circuit Breaker.
    *   **Closed**: Normal operation.
    *   **Open**: Fails fast immediately when error threshold is breached.
    *   **Half-Open**: Periodically tests upstream health before recovering.
*   **Benefit**: Prevents cascading failures and keeps the system responsive.

### 🧠 **2. Distributed Caching Strategy** ⚡
*   **Pattern**: Cache-Aside (Lazy Loading) with Write-Through.
*   **Tech**: Redis Cluster.
*   **Optimization**: We use **TTL Jittering** to prevent cache stampedes and **Negative Caching** to store "Not Found" responses, protecting our database from invalid query floods.

### 📨 **3. Asynchronous Event-Driven Architecture** 🔄
*   **Tech**: BullMQ (Redis-backed).
*   **Flow**: Scans are offloaded to background workers. This decouples the API from heavy processing, ensuring the UI remains snappy.
*   **Reliability**: Includes **Exponential Backoff Retries** and **Dead Letter Queues (DLQ)** for failed jobs.

### 🧮 **4. Advanced Data Structures** 🤓
*   **Trie (Prefix Tree)**: Used for **O(L)** lookup of malicious domains against a blocklist of millions.
*   **Bloom Filter**: A probabilistic data structure used to check "Have we scanned this before?" in **O(1)** time with minimal memory footprint (~5MB for 1M domains).

---

## 🛠️ Tech Stack & Tools

| Domain | Technology |
| :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/-React-black?logo=react) ![Vite](https://img.shields.io/badge/-Vite-black?logo=vite) ![Tailwind](https://img.shields.io/badge/-Tailwind-black?logo=tailwindcss) ![Radix UI](https://img.shields.io/badge/-Radix%20UI-black?logo=radix-ui) |
| **Backend** | ![Node](https://img.shields.io/badge/-Node.js-black?logo=node.js) ![Express](https://img.shields.io/badge/-Express-black?logo=express) ![TypeScript](https://img.shields.io/badge/-TypeScript-black?logo=typescript) |
| **Database** | ![Postgres](https://img.shields.io/badge/-PostgreSQL-black?logo=postgresql) ![Prisma](https://img.shields.io/badge/-Prisma-black?logo=prisma) |
| **Cache & Queue** | ![Redis](https://img.shields.io/badge/-Redis-black?logo=redis) ![BullMQ](https://img.shields.io/badge/-BullMQ-black?logo=bullmq) |
| **DevOps** | ![Docker](https://img.shields.io/badge/-Docker-black?logo=docker) ![Github Actions](https://img.shields.io/badge/-GitHub%20Actions-black?logo=github-actions) |

---

## 🚀 Getting Started

Ready to deploy? Follow these steps to get your own instance running.

### Prerequisites
*   ✅ **Node.js** (v18+)
*   ✅ **Redis** (Local or Cloud)
*   ✅ **PostgreSQL** (Local or Cloud)

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yourusername/domainscope.git
cd domainscope
```

### 2️⃣ Backend Configuration
```bash
cd backend
npm install
cp .env.example .env
# 📝 Edit .env with your DB and Redis credentials
npx prisma generate
npx prisma db push
npm run dev
```

### 3️⃣ Frontend Launch
```bash
# Open a new terminal
cd ..
npm install
npm run dev
```

🎉 **Success!** Visit `http://localhost:5173` to start scanning.

---

## 🔑 Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing tokens | `super_secret_key` |
| `VT_API_KEY` | VirusTotal API Key | `your_vt_api_key` |
| `PORT` | Backend Server Port | `3001` |

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/scan` | 🔍 **Start Scan**: Initiates a deep scan for a domain. |
| `GET` | `/api/v1/scan/:id` | 📄 **Get Results**: Polling endpoint for scan status. |
| `POST` | `/api/v1/auth/signup` | 👤 **Register**: Create a new user account. |
| `POST` | `/api/v1/auth/login` | 🔑 **Login**: Authenticate and get a session token. |

---

<p align="center">
  Built with ❤️, ☕, and 💻 by the <b>DomainScope Engineering Team</b>
</p>
