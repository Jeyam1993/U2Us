# Sathi — dating with true intention
Node/Express + MySQL 8, responsive gradient web UI (works on phones, tablets, laptops; installable PWA manifest).

## Run locally
    npm install && cp .env.example .env   # set DB_*, DATA_KEY, JWT_SECRET, DB_HOST=127.0.0.1
    mysql -u root -p sathi < schema.sql && npm start     # http://localhost:3000
    npm test                                             # API + security tests (needs MySQL)
    BASE=http://localhost:3000 npm run load              # k6 load test (p95 < 500ms gate)

## Two environments (Demo → Live)
Same image, different env file and DB volume: see top of `docker-compose.yml`. Flow: feature branch → PR (CI runs tests, `npm audit`, ZAP) → merge to `main` → deploy Demo → UAT/VAPT → tag release → deploy Live.

## Security built in
bcrypt passwords · AES-256-GCM encrypted email/phone at rest · HMAC email lookup · parameterised SQL · zod validation · Helmet/CSP · rate limits · JWT 2h · log redaction · audit log · owner-only `/metrics` and `/owner/stats` via `x-owner-token` · generic errors (no user enumeration).
**Back up `DATA_KEY` offline; losing it makes stored contacts unreadable.**

## You still need to do (cannot be automated here)
- Manual VAPT by a certified tester (OWASP ASVS / Top 10); fix findings before Live. Re-test after each major change.
- TLS (Caddy/Nginx + Let's Encrypt), firewall (only 80/443 public, MySQL private), encrypted daily MySQL backups + restore drill.
- WhatsApp: Twilio/Meta business approval + approved template. India SMS: DLT registration.
- Privacy policy, consent record, India DPDP Act compliance, account deletion/export.

## Monitoring (you as sole owner)
`curl -H "x-owner-token: $T" host/owner/stats` → users, 24h signups, notification failures, failed logins/hour.
`/metrics` → Prometheus (latency histogram per route, CPU, memory); add Grafana + alert on p95 > 500ms, 5xx > 1%, `failed` notifications > 0, `/health` down (UptimeRobot).
Speed under load: DB pool (`DB_POOL`), notifications run in a background queue so signup stays fast, indexed queries. Scale: run N app containers behind the proxy; MySQL slow-query log on.
