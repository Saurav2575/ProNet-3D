# ProNet — Current Software Design Specification

This document describes the finished implementation produced during this review. The original SDS was not included in the uploaded source archive.

## Architecture

The client uses React 18, Material UI 6, Redux Toolkit, and React Router. Redux holds authentication, feed, cached network data, jobs/application history, and persistent theme preference. Axios sends cookies and coordinates a single refresh request when simultaneous API calls receive an expired access session.

The Express API validates incoming data and IDs, checks session cookies, restricts record mutations to their owners/recipients, and uses Mongoose models in MongoDB. Express can serve the built SPA and return its HTML for deep links. Startup waits for database connection; shutdown closes HTTP, Redis, and MongoDB connections.

## Reference visual design and 3D

The shared navy/blue theme adapts the uploaded reference frontend while retaining Material UI and the existing API. A lazy Three.js module renders the career constellation on feed/network pages. Display modes, pause/resume, reset, keyboard tilt, reduced motion, visibility suspension, static WebGL fallback, and resource cleanup are implemented in `CareerMatrix.jsx` and `CareerConstellation.jsx`. Profile completeness is calculated from saved fields; sidebars use actual popular posts and suggestions. See `FRONTEND-REDESIGN.md`.

## Collections

| Collection | Main fields and relationships | Indexes |
|---|---|---|
| Users | Names, normalized email, bcrypt password, profile fields, skills, connection IDs, private session hashes | Unique email; text profile index; company/name compound index |
| Posts | Author reference, content, image URL, likes, embedded comments referencing authors | Author/createdAt compound index; chronological index |
| Connections | Requester/recipient references, pending/accepted status, unordered pair key | Ordered requester/recipient unique; sparse unordered pair unique; recipient/status |
| Jobs | Job fields, recruiter reference, applicant IDs, active flag | Text job index; active/type/date; recruiter/date |
| Applications | Job/applicant references, cover letter, resume URL, status | Unique job/applicant pair; applicant/date |
| Notifications | Recipient/actor references, type, message, relative link, read flag | Recipient/read/date |

Legacy applicant arrays remain for compatibility and listing counts. The migration script creates separate history records for existing applicants without inventing missing resume details.

## Sessions and authorization

Access JWTs expire after 15 minutes by default; refresh JWTs expire after seven days. Both use HTTP-only, SameSite=Lax cookies under `/api`. Production cookies require HTTPS. Private session hashes in the user collection support rotating refresh tokens and immediate logout revocation. JWTs are never returned to React or stored in local storage.

The server uses the exact configured `CLIENT_URL` for allowed browser origins. For built same-origin hosting, set it to the application's URL. Access checks validate a signed access token and an unexpired corresponding server session. Only post authors can delete posts, invitation recipients can respond, and job owners can edit listings/view applicants/change statuses.

## Feed and cache

Chronological feeds support `all` and `network` scope, deterministic createdAt/ID sorting, and validated page/limit values. The network feed includes the current user and accepted connections. Likes use atomic `$addToSet`/`$pull`; comments use atomic `$push`.

Popular posts use a MongoDB aggregation pipeline to compute interaction counts, sort, and join limited author information. Redis stores JSON responses for 30 seconds. Cache keys include a generation, endpoint, user, scope, page, and limit. Post creation/deletion/likes/comments, profile edits, and connection acceptance increment the generation and clear local fallback entries. Earlier-generation Redis keys expire naturally, preventing an in-flight stale result from becoming visible to new requests. The local fallback holds at most 200 entries and is appropriate for a single process.

## Uploads and notifications

Multer accepts one image up to 5 MB in memory. The service checks PNG/JPEG/WebP signatures. Configured Cloudinary uploads use its SDK stream method and return `secure_url`; otherwise UUID filenames are written beneath `backend/uploads`. No upload filename provided by the user becomes a storage path.

Notifications persist in MongoDB. The client polls every 30 seconds and on opening the menu. Mark-read operations are recipient-scoped. Optional emails use escaped HTML and plain text through Nodemailer; email failures do not block the main workflow. Email is disabled until SMTP is configured and explicitly enabled.

## Testing and operations

The included Jest/Supertest suite exercises a real temporary MongoDB instance, setup/cleanup hooks, and sequential execution. Frontend Jest/React Testing Library exercises the composer, upload integration, feed pagination, job search/history, recruiter tracking, and theme persistence. Playwright performs the connected browser workflow and validates five screens at three viewport widths. Autocannon verifies that excess local requests receive 429 without connection errors.

The Docker Compose file provisions local MongoDB and Redis. CI configuration is supplied for GitHub; it has not been executed on the user's repository. `README.md` covers Windows setup, database upgrade, local built hosting, provider configuration, and HTTPS requirements. `backend/scripts/analyze-queries.js` provides reproducible query-plan inspection rather than fabricated production benchmarks.

## Design limits

Partial regex searches are bounded but can scan large datasets. Cache fallback is per process; use Redis for multiple backend instances. Notification/email processing has no durable email retry queue. Job updates, application records, and connection user lists span multiple documents; unique keys and idempotent set updates protect duplicate/concurrent requests, but there is no multi-document transaction layer. This version targets the internship project scope, not a claim of large-scale production readiness.
