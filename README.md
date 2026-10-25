# U2Us — dating with true intention
Node/Express + MySQL 8, responsive gradient web UI (works on phones, tablets, laptops; installable PWA manifest).

## Run locally
    npm install && cp .env.example .env   # set DB_*, DATA_KEY, JWT_SECRET, DB_HOST=127.0.0.1
    mysql -u root -p u2us < schema.sql && npm start     # http://localhost:3000
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

## Free testing toolkit
- **Email (Brevo free, 300/day):** put the SMTP lines from `.env.example` in `.env`, then `npm run notify:test -- email you@gmail.com`.
- **WhatsApp (Meta free test number):** Meta for Developers > create app > WhatsApp > API Setup. Copy the *Phone number ID* to `WA_PHONE_ID`, add your own number under *To > Manage phone number list*, and use a System User token for `WA_TOKEN` (the dashboard token expires fast). Then `npm run notify:test -- whatsapp +91XXXXXXXXXX`. Only allow-listed numbers receive messages until your business is verified. After that, register your own template and set `WA_TEMPLATE`.
- **Screens on phone/laptop sizes:** `npx playwright install` once, then `npm run e2e` (Android, iPhone, iPad, Chrome, Firefox). Screenshots land in `test-results/`; report: `npx playwright show-report`.
- **ZAP:** runs on every push in GitHub Actions; download the `zap-report` artifact. Local: `docker run --network host -v $PWD:/zap/wrk:rw ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000 -r zap-report.html`.

## Roles, demo profiles, admin
Existing database? Run once: `mysql -u root -p u2us -e "source migrations/002_roles_status.sql"`.
- `npm run seed:demo` adds 10 demo profiles (login demo01@u2us.test ... demo10@u2us.test, password `Demo#Pass2026`; refuses to run in production).
- `npm run admin:create -- you@example.com "LongPassword#1"` makes your admin account. Sign in via POST /api/login, then use /api/admin/users, /api/admin/users/:id/suspend and /reinstate.
