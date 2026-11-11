# ProNet API reference

Base URL: `http://localhost:5000/api`. JSON bodies unless stated otherwise. Login/register set HTTP-only cookies; Postman uses its cookie jar. Protected endpoints require an active session. Invalid inputs/IDs return 400; missing session 401; disallowed ownership 403; missing records 404; duplicates 409; rate limits 429. Centralized unexpected-error responses are `{message, code}`.

| Method | Endpoint | Purpose / body |
|---|---|---|
| GET | `/health` | Server/database readiness; returns 503 when disconnected |
| POST | `/auth/register` | `firstName`, `lastName`, `email`, `password` |
| POST | `/auth/login` | `email`, `password` |
| GET | `/auth/me` | Current user's public profile |
| POST | `/auth/refresh` | Rotate refresh cookie and renew access cookie |
| POST | `/auth/logout` | Revoke current session and clear cookies |
| GET | `/users/search?q=...&company=...` | Partial profile search; optional exact company filter |
| GET | `/users/suggestions` | Suggested professionals |
| GET | `/users/:id` | User profile |
| GET | `/users/:id/posts` | Up to 50 recent user posts with author/comment profiles |
| PUT | `/users/profile` | Allowlisted names, headline, bio, location, company, role, skills, avatar, coverPhoto |
| POST | `/uploads` | Multipart `image` plus `folder` = profiles/covers/posts; ≤5 MB |
| GET | `/posts/feed?page=1&limit=10&scope=all` | Chronological feed; scope `all` or `network`; limit 1–50 |
| GET | `/posts/popular` | Five posts ranked by likes/comments via MongoDB aggregation |
| POST | `/posts` | `content` (1–3000 chars), optional `image` URL |
| PUT | `/posts/:id/like` | Toggle current user's like; returns count, `liked`, and `likeIds` |
| POST | `/posts/:id/comments` | `text` (1–1000 chars); returns populated comment |
| DELETE | `/posts/:id` | Delete own post |
| GET | `/connections` | Accepted connections |
| GET | `/connections/pending` | Incoming invitations |
| GET | `/connections/status/:userId` | Status for another user |
| POST | `/connections/request/:userId` | Send invitation |
| PUT | `/connections/:id/respond` | `action`: accept/reject |
| GET | `/jobs?q=...&location=...&type=...&page=1&limit=50` | Open jobs with combined partial search/filter |
| GET | `/jobs/:id` | Job details |
| POST | `/jobs` | Required title/company/description; optional location/type/salary |
| PUT | `/jobs/:id` | Owner edits fields or `isActive` availability |
| GET | `/jobs/mine` | Current recruiter's listings, including closed ones |
| POST | `/jobs/:id/apply` | Required coverLetter (1–3000 chars), public HTTP(S) resumeUrl |
| GET | `/jobs/applications/mine` | Current user's application history |
| GET | `/jobs/:id/applicants` | Recruiter's applicant list, letters, resume links, statuses |
| PUT | `/jobs/applications/:applicationId/status` | Owner selects submitted/reviewing/shortlisted/rejected/hired |
| GET | `/notifications` | Latest 50 notifications and total unread count |
| PUT | `/notifications/:id/read` | Mark own notification read |
| PUT | `/notifications/read-all` | Mark all own notifications read |

Registration/profile names are limited to 80 characters. Profile biography is limited to 2000 characters; skills to 30 entries of at most 60 characters. Images accept HTTPS/HTTP URLs or generated local image paths. Applications reject empty values, unsafe URL schemes, duplicates, applications to one's own jobs, and closed jobs.

`docs/ProNet.postman_collection.json` provides an importable request collection. Fill the record ID variables from responses. For two-party flows, use separate Postman cookie sessions or sign out/sign in between accounts. To upload an image, select a local file for the multipart `image` field. No Cloudinary or SMTP credentials are included in the collection.
