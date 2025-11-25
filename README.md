```md
<!--
  README.md for DomainScope
  - Hybrid: Professional-clean + aesthetic
  - Includes local image references (replace/transform paths if needed)
-->

<!-- Banner SVG (dark-mode hero-style) -->
<div align="center">
  <svg width="980" height="220" viewBox="0 0 980 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="bannerTitle">
    <defs>
      <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#6EE7F9"/>
        <stop offset="0.5" stop-color="#8B5CF6"/>
        <stop offset="1" stop-color="#FB7185"/>
      </linearGradient>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="18" flood-color="#000" flood-opacity="0.12"/>
      </filter>
      <style>
        .title { font: 700 34px/1.1 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; fill: #fff }
        .subtitle { font: 400 14px/1.2 'Inter'; fill: rgba(255,255,255,0.95) }
        .badge { font: 600 12px/1 'Inter'; fill: #0f172a }
      </style>
    </defs>

    <!-- Background gradient -->
    <rect width="100%" height="100%" rx="18" fill="url(#g1)"/>
    <g transform="translate(36,32)">
      <!-- Shield icon -->
      <g transform="translate(0,0)">
        <rect x="0" y="0" width="84" height="84" rx="18" fill="#0ea5e9" opacity="0.14" />
        <path d="M42 16c0 .2-8 4-8 14 0 10 8 20 8 20s8-10 8-20c0-10-8-14-8-14z" fill="white" opacity="0.95"/>
        <circle cx="42" cy="48" r="4" fill="#fb7185" opacity="0.95"/>
      </g>

      <!-- Title -->
      <text x="110" y="36" class="title">DomainScope</text>
      <text x="110" y="60" class="subtitle">Enterprise OSINT • Domain & IP Intelligence • Production-ready</text>

      <!-- small badges -->
      <g transform="translate(110,78)">
        <rect x="0" y="0" rx="8" width="110" height="28" fill="#ffffff" opacity="0.12"/>
        <text x="16" y="19" class="badge">Observability • Prometheus</text>
      </g>
      <g transform="translate(230,78)">
        <rect x="0" y="0" rx="8" width="140" height="28" fill="#ffffff" opacity="0.08"/>
        <text x="16" y="19" class="badge">Redis • BullMQ • Prisma</text>
      </g>
    </g>
  </svg>
</div>

---

<div align="center">
  <svg width="980" height="220" viewBox="0 0 980 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="bannerTitle">
    <defs>
      <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#6EE7F9"/>
        <stop offset="0.5" stop-color="#8B5CF6"/>
        <stop offset="1" stop-color="#FB7185"/>
      </linearGradient>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="18" flood-color="#000" flood-opacity="0.12"/>
      </filter>
      <style>
        .title { font: 700 34px/1.1 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; fill: #fff }
        .subtitle { font: 400 14px/1.2 'Inter'; fill: rgba(255,255,255,0.95) }
        .badge { font: 600 12px/1 'Inter'; fill: #0f172a }
      </style>
    </defs>

    <!-- Background gradient -->
    <rect width="100%" height="100%" rx="18" fill="url(#g1)"/>
    <g transform="translate(36,32)">
      <!-- Shield icon -->
      <g transform="translate(0,0)">
        <rect x="0" y="0" width="84" height="84" rx="18" fill="#0ea5e9" opacity="0.14" />
        <path d="M42 16c0 .2-8 4-8 14 0 10 8 20 8 20s8-10 8-20c0-10-8-14-8-14z" fill="white" opacity="0.95"/>
        <circle cx="42" cy="48" r="4" fill="#fb7185" opacity="0.95"/>
      </g>

      <!-- Title -->
      <text x="110" y="36" class="title">DomainScope</text>
      <text x="110" y="60" class="subtitle">Enterprise OSINT • Domain & IP Intelligence • Production-ready</text>

      <!-- small badges -->
      <g transform="translate(110,78)">
        <rect x="0" y="0" rx="8" width="110" height="28" fill="#ffffff" opacity="0.12"/>
        <text x="16" y="19" class="badge">Observability • Prometheus</text>
      </g>
      <g transform="translate(230,78)">
        <rect x="0" y="0" rx="8" width="140" height="28" fill="#ffffff" opacity="0.08"/>
        <text x="16" y="19" class="badge">Redis • BullMQ • Prisma</text>
      </g>
    </g>
  </svg>
</div>

---

<div align="center">

# 🌍 DomainScope — Enterprise OSINT Intelligence Platform

**Production-grade domain & IP intelligence toolkit** — built for security researchers, SOC teams, and OSINT analysts.  
Scalable, observable, and engineered with FAANG-level patterns: caching, job queues, circuit breakers, tracing, and robust security.

[🔭 Live Demo](https://domainscope.vercel.app) • [📁 Repo](https://github.com/vaishnav4281/Domainscope) • [⭐ Star the project](https://github.com/vaishnav4281/Domainscope/stargazers)

</div>

---

<!-- Gradient divider -->
<div style="height:6px;background:linear-gradient(90deg,#06b6d4,#8b5cf6,#fb7185);border-radius:8px;margin:18px 0;"></div>

## 🚀 Quick elevator (60s read for recruiters)

- **What:** Full-stack OSINT platform that aggregates WHOIS, DNSBL, VirusTotal, IP reputation, and site metadata into one dashboard.  
- **Why:** Analysts waste hours correlating fragmented signals — DomainScope unifies signals into an actionable risk view with exportable evidence.  
- **How it's engineered:** Node.js + TypeScript backend (Express + Prisma/Postgres) → Redis (cache + BullMQ queue) → React frontend (Vite + Tailwind + shadcn/ui). Observability via OpenTelemetry & Prometheus.  
- **Recruiter keywords:** Distributed systems, caching, BullMQ, circuit breaker, OpenTelemetry, Prometheus, Postgres, Prisma, TypeScript, system design, SRE, FAANG-friendly.

---

## ✨ Features (at-a-glance)

- ✅ Single-domain & bulk scanning (CSV / paste)  
- ✅ WHOIS, DNS, DNSBL lookups  
- ✅ VirusTotal integration (malware & reputation)  
- ✅ IP reputation & fraud scoring (IPQS + AbuseIPDB)  
- ✅ Metascraper: OG/Twitter/JSON-LD extraction  
- ✅ Redis caching (cache-aside, negative cache, TTL jitter)  
- ✅ BullMQ job queue with retries & DLQ  
- ✅ Circuit breakers (provider-level) + graceful degradation  
- ✅ Prometheus metrics (`/metrics`) + OpenTelemetry traces  
- ✅ API keys, JWT auth, HMAC-signed webhooks  
- ✅ CSV export & session-based history

---

## 🖼️ Visual gallery

> Rounded preview cards — images included from your workspace. (If rendering path needs transforming, replace the paths below with the repo URLs.)

<div align="center">

**Landing / Hero**  
<img alt="Landing" src="/mnt/data/778ddc89-8067-46bb-a5c0-f124c431db07.png" width="1000" style="border-radius:12px;box-shadow:0 12px 34px rgba(11,15,30,0.12)"/>

**Dashboard & Scan History**  
<img alt="Dashboard" src="/mnt/data/bc014315-98f6-44c2-829b-ee0deed12a22.png" width="1000" style="border-radius:12px;box-shadow:0 12px 34px rgba(11,15,30,0.12);margin-top:18px"/>

**Detailed Results & Cards**  
<img alt="Results" src="/mnt/data/57dfed1e-f912-442b-8eb9-858def7142f4.png" width="1000" style="border-radius:12px;box-shadow:0 12px 34px rgba(11,15,30,0.12);margin-top:18px"/>

</div>

---

## 🏗️ Architecture (simplified)

```

[User Browser] → CDN → [API Gateway / Express] → {AuthSvc, ScanSvc, HistorySvc}
↓
Redis (cache + BullMQ)
↓
External Providers (VirusTotal, WHOIS, DNSBL)
↓
Postgres (Prisma) persistence

````

**Design Patterns used**
- Cache-Aside + negative caching + TTL jitter  
- Producer-Consumer queue (BullMQ) with DLQ  
- Circuit breaker per external provider (fail-fast + half-open probes)  
- CQRS (read optimized via Redis + write to Postgres)  
- Observability: OpenTelemetry traces + Prometheus metrics + Grafana dashboards

---

## 🔬 Observability / Metrics (what `/metrics` exposes)

- `process_*` and `nodejs_*` (CPU, memory, heap, event-loop)  
- `http_request_duration_seconds` histogram (route & status)  
- `http_requests_total`, `http_request_errors_total` counters  
- `cache_hits_total`, `cache_misses_total` (cache efficiency)  
- `external_api_calls_total` (per-provider usage)  
- `queue_jobs_processed_total`, `queue_job_duration_seconds` (BullMQ metrics)  
- `circuit_breaker_state{breaker="virustotal"}` gauge (0=closed,1=open,2=half-open)

**Tip:** Connect Prometheus → Grafana for SLO dashboards (P95, P99, error budget).

---

## 🧠 Algorithms & implementation notes

**Trie (Prefix Tree)**  
- Used for fast prefix/subdomain blocklist checks; O(L) lookup where L is the domain string length.

**Bloom Filter**  
- Probabilistic pre-filter for “seen before” checks: dramatically reduces expensive DB/API calls. Configurable false-positive rate (e.g. 1%).

**Single-flight / Thundering herd protection**  
- Ensure on-cache-miss only one worker fetches external data; others await result.

---

## 🛠️ Tech Stack

| Layer | Core |
|---|---|
| Backend | Node.js, TypeScript, Express |
| DB | PostgreSQL (Prisma) |
| Cache / Queue | Redis, BullMQ |
| Observability | OpenTelemetry, Prometheus, Grafana |
| Frontend | React, Vite, TailwindCSS, shadcn/ui |
| Security | JWT, API keys, bcrypt, HMAC webhooks |
| DevOps | Docker, Docker Compose, GitHub Actions |

---

## ⚙️ Quickstart (local)

1. **Clone**
```bash
git clone https://github.com/vaishnav4281/Domainscope.git
cd Domainscope
````

2. **Install**

```bash
npm install
# or bun install / pnpm install
```

3. **Env**

```bash
cp .env.example .env
# Fill: DATABASE_URL, REDIS_URL, VIRUSTOTAL_API_KEY, IPQS_API_KEY, ABUSEIPDB_API_KEY, JWT_SECRET
```

4. **Run (dev)**

```bash
docker-compose up -d    # postgres + redis
npm run dev:server      # backend
npm run dev:web         # frontend
```

Open:

* Frontend: `http://localhost:5173`
* Backend health: `http://localhost:3001/health`
* Metrics: `http://localhost:3001/metrics`

---

## 🔐 Security & production readiness

* Circuit breakers protect from cascading failures
* Redis-based rate limiting (token-bucket) per IP / API key
* API keys: hashed storage, rotation, and revocation
* Webhooks signed with HMAC; retries + DLQ for delivery failures
* Input validation via Zod / Prisma parameterized queries

---

## 📈 SLOs & testing (example)

* **Availability SLO:** 99.9%
* **Latency SLO (P95):** < 500ms (cached)
* **Cache hit target:** ≥ 80% (WHOIS TTL 24h)
* Load test baseline: 800+ req/s single instance (linear horizontal scaling)

---

## 🧩 Contributing

1. Fork → `git checkout -b feature/awesome`
2. Implement with types & tests
3. Open PR with screenshots & changelog

Please follow **conventional commits** and include tests for core logic (Trie, Bloom Filter, worker flows).

---

## 💼 For recruiters / interviewers (90s talking points)

* **Ownership:** full-stack project with engineering tradeoffs (cost vs latency vs accuracy).
* **Distributed systems:** Redis, BullMQ, circuit breakers, cache strategies, SLOs.
* **Observability:** Prometheus metrics + OpenTelemetry tracing used for root-cause analysis.
* **DSA applied:** Trie for blocklist, Bloom filter for membership testing — not just LeetCode, real improvements.
* **Security:** API governance, JWT, HMAC webhooks, rate limiting.

---

## ⚖️ License & Contact

**MIT** — see [LICENSE](./LICENSE)

Built with ❤️ by **Vaishnav K** —
GitHub: `https://github.com/vaishnav4281` • LinkedIn: *(add link)*

---

<div align="center" style="margin-top:18px">
If you'd like, I can:
- generate a **custom SVG architecture diagram** and include it as `/assets/architecture.svg`  
- produce an **animated GIF demo** from your screenshots  
- create **Grafana dashboard JSON** for your Prometheus metrics  

Reply with **"add arch svg"**, **"make GIF"**, or **"grafana JSON"** and I'll generate them.

</div>
```
