# ProNet — Reference Frontend + 3D

The frontend now uses the uploaded NexusIn reference design: navy/blue styling, a responsive three-column feed, split login/signup pages, and an interactive Three.js career constellation. The real existing workflows are preserved. See `docs/FRONTEND-REDESIGN.md` for the integration details.

The underlying project was checked against all 16 uploaded weekly reports in numerical order. The existing React/Material UI website was extended with working image uploads, cookie sessions and refresh, job applications and recruiter tracking, notifications, Redis caching, tests, and CI configuration. Read `docs/WEEKLY-REPORT-AUDIT.md` for the evidence for each week.

## Put it in your requested Windows folder

Extract the ZIP so the project directory is:

`C:\Users\saura\SIP report and ppt\ProNet-3D`

Alternatively, after extracting elsewhere, right-click `Install-To-Requested-Folder.ps1` and run it with PowerShell. It copies the project to the path above and refuses to overwrite an existing project directory. The Windows drive was not accessible during this review, so the ZIP must be downloaded and extracted on your computer.

## First run

Install Node.js **22.12 or newer** and have MongoDB running locally, or use your MongoDB Atlas connection string. The tests use a separate temporary MongoDB database and never require your existing database.

For the easiest Windows setup, double-click **Setup-ProNet.cmd** in the extracted project folder. Once MongoDB is running, double-click **Start-ProNet.cmd**. Both launchers use the correct project directory automatically.

Alternatively, open PowerShell inside the folder containing the root `package.json`, `backend`, `frontend`, and `tools`:

```powershell
npm run setup
```

This installs both packages from their lockfiles and creates `backend/.env` with a random JWT secret if that file does not exist. Existing environment files are preserved.

If you have Docker Desktop, start the included local database and cache:

```powershell
docker compose up -d
```

If using an existing MongoDB installation, make sure its service is running. If using Atlas, put your actual URI into `backend/.env` as `MONGODB_URI`; allow your computer's IP in Atlas. Database credentials were excluded from this ZIP.

Then run:

```powershell
npm run dev
```

Open **http://localhost:5173**. The backend runs on **http://localhost:5000**. Create two accounts to demonstrate connection invitations and recruiter/applicant workflows. Any account can post jobs; only its owner can manage those listings and their applicants.

## Images, caching, and email

- Image uploads work immediately using the local `backend/uploads` directory. To use Cloudinary, set all three `CLOUDINARY_*` values in `backend/.env` and restart. The real Cloudinary SDK is integrated; provider uploads require your own account credentials.
- Redis uses `REDIS_URL`. The included Docker Compose file provides it at `redis://127.0.0.1:6379`. The cache falls back to bounded process memory if Redis is unavailable. Feed, popular-post, like, comment, profile, and connection changes invalidate cached views.
- In-app notifications work without email credentials. To send notification emails, configure `SMTP_*` and set `EMAIL_NOTIFICATIONS=true`. Email delivery is off by default. The SMTP integration and template were tested with a mocked transport; no real email was sent during verification.

## Existing database upgrade

For a clean database, no migration is needed. If using the original project's database, stop both servers and back up that database before running:

```powershell
npm run migrate
```

The migration adds unordered connection keys, removes previously rejected invitations so they can be resent, and imports existing job applicants into application history. Old records had no cover letter or resume; imported records clearly indicate this and do not fabricate a resume. If opposite-direction duplicate connections exist, migration stops for manual review without automatically removing them. Existing users can sign in with their passwords, but must sign in again because authentication now uses cookies.

## Verification commands

```powershell
npm run lint
npm test
npm run build
npm exec --prefix backend -- playwright install chromium
npm run test:e2e
```

`test:e2e` builds the site, starts an isolated temporary MongoDB/API, exercises the website in Chromium, tests mobile/tablet/desktop layouts, and runs a short local autocannon rate-limit burst. Port 5000 must be free. Its test accounts are stored only in the temporary database. It writes evidence under `verification/`.

The first backend test run downloads MongoDB binaries. Browser testing downloads Chromium separately. These commands need internet access on first use.

To inspect database query plans on your own development data:

```powershell
node backend/scripts/analyze-queries.js
```

The query analyzer reads explain plans without modifying application records. Regex substring searches support partial matching; their performance depends on data size. Compound indexes optimize the targeted author feed and exact-company queries. No unmeasured production performance claim is made.

`npm run load:test` targets a currently running **local** API. It deliberately triggers rate limiting; 429 responses are expected once the request allowance is exhausted.

## Run the built website

```powershell
npm run build
```

Set `CLIENT_URL=http://localhost:5000` in `backend/.env`, keep `NODE_ENV=development` for local HTTP, then:

```powershell
npm start
```

Open **http://localhost:5000**. Express serves the frontend build and handles direct links such as `/jobs` and `/profile`.

For HTTPS hosting, use `NODE_ENV=production`, set `CLIENT_URL` to the site's exact HTTPS origin, configure MongoDB and any optional providers, and serve the application behind a trusted HTTPS reverse proxy. Set `TRUST_PROXY=1` only when there is exactly one trusted proxy. Secure cookies require HTTPS. Persist the uploads directory if using local image storage. Hosting credentials and public deployment were not provided or performed.

## Handover contents

- `frontend/` and `backend/`: application code and reproducible dependency lockfiles.
- `docs/WEEKLY-REPORT-AUDIT.md`: report-by-report assessment and evidence.
- `docs/SDS.md`, `docs/SRS.md`, `docs/API.md`: current architecture, requirements, and endpoints.
- `docs/ProNet.postman_collection.json`: importable request collection; Postman's cookie jar manages the session.
- `docs/FRONTEND-REDESIGN.md`: reference design mapping and new 3D behavior.
- `Setup-ProNet.cmd` and `Start-ProNet.cmd`: Windows launchers.
- `verification/`: test results and browser screenshots.
- `Weekly-Reports/`: original 16 reports, preserved without editing.
- `.github/workflows/ci.yml`: lint, tests, build, and browser-check workflow for GitHub.

Original source archives, real credentials, `node_modules`, runtime upload files, and unrelated trial executables are excluded. PowerPoint slides, original planning documents, training attendance, repository transfer, and internship submission were not available for verification and were not recreated or claimed as historical facts.
