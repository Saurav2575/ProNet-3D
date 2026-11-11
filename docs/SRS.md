# ProNet — Current Software Requirements

Prepared from the 16 uploaded weekly reports and the implemented final code. This is a current requirements record, not evidence that the original SRS or planning documents were submitted on the dates stated in the reports.

## Functional requirements

| ID | Requirement | Implementation |
|---|---|---|
| AUTH-01 | Register and sign in with validated email/password | bcrypt hashes, unique normalized email, login/register forms |
| AUTH-02 | Keep sessions secure and handle expiry | HTTP-only access/refresh cookies, rotating refresh hashes, session revocation on logout |
| PROFILE-01 | View/edit professional profile, bio, skills, location, company, and role | Allowlisted profile API and React profile screen |
| PROFILE-02 | Upload avatar and cover photo | Multer and Cloudinary SDK; local storage fallback |
| FEED-01 | Create text/media posts and browse chronological pages | React composer; paginated all/network feeds |
| FEED-02 | Like, comment, and delete own posts | Atomic updates, populated comment authors, ownership checks |
| NETWORK-01 | Search professionals and receive suggestions | Literal partial matching; exclude self/current invitations from suggestions |
| NETWORK-02 | Send, accept, or reject invitations; view connections | Recipient authorization, validation, unique unordered pair, Redux cache |
| JOB-01 | Create, edit, close, and reopen one's listings | Recruiter dashboard and owner-protected API |
| JOB-02 | Search by keyword, location, and type | Combined backend filters; paginated listing screen |
| JOB-03 | Submit validated applications and track their history | Cover letter/resume link; unique applicant/job record; closed-job rejection |
| JOB-04 | Track applicants and update their application status | Recruiter-only applicant list and status changes |
| THEME-01 | Use persistent light/dark mode across screens | Redux theme state and MUI ThemeProvider |
| NOTIFY-01 | View notifications and mark them read | Persistent notifications for invitations, acceptance, comments, applications, and status changes |
| EMAIL-01 | Deliver optional networking notification emails | Opt-in Nodemailer SMTP configuration and escaped HTML/plain-text templates |
| CACHE-01 | Cache frequently viewed and popular feeds | Redis with TTL/generation invalidation; bounded local fallback |

## Nonfunctional requirements

Validation rejects malformed IDs, invalid types, empty required values, excessive input lengths, duplicate applications, forged image types, and images over 5 MB. Helmet supplies security headers, allowed-origin checks protect cookie writes, and separate API/auth rate limits return JSON errors. Express awaits database startup and forwards asynchronous controller failures to centralized error handling.

The UI adapts to mobile/tablet/desktop widths. Jest/Supertest use an isolated temporary MongoDB database; React Testing Library checks key UI flows; Chromium verifies connected workflows. A GitHub Actions configuration runs these checks after repository upload.

Cloudinary, Atlas, SMTP, GitHub Actions execution, public hosting, and submission workflows depend on the user's own services and accounts. No externally hosted deployment or historical internship activity is implied by this implementation.
