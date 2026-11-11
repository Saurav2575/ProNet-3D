# ProNet reference frontend integration

The source-only reference ZIP supplied on 8 October 2026 contains the NexusIn/Nexa Next.js application. Its navy-and-blue visual system, three-column feed, split authentication layout, career matrix, and Three.js constellation have been adapted to ProNet's existing React/Material UI client. ProNet keeps its Express/MongoDB backend, cookie sessions, Redux state, and weekly-report features.

## What is implemented

| Reference element | ProNet implementation |
| --- | --- |
| Navy, blue, and aqua palette | Shared tokens and light/dark Material UI themes across all pages |
| Compact header and search | Accessible route links, real professional search, notifications, theme/account controls, Post shortcut |
| Three-column feed | Profile and skills sidebar, career matrix, working media composer/posts, actual popular posts and connection suggestions |
| Career constellation | Adapted sphere, torus rings, wireframe shell, star field, glowing nodes and lines using Three.js 0.169.0 |
| Matrix display controls | Synapse (connected spherical nodes), Orbit (orbital bands), Density (64 smaller nodes and a denser link pattern) |
| Animation controls | Pause/resume, reset, pointer tilt, keyboard arrows/Home, system reduced-motion preference |
| Split login/signup layout | Navy brand panel and dimensional globe graphic, working existing registration/password validation and cookie authentication |
| Network hub | Actual connection/invitation/suggestion counts, interactive matrix, search, invitations, responsive person cards |
| Opportunity page | Navy banner with real application/listing counts, existing filters, applications, recruiter tracking, editing and closing listings |
| Profile readiness | Completeness computed from photo, headline, bio, location, company, role, and skills |
| Responsive UI | Desktop/tablet layouts, floating mobile navigation, forms and dialogs kept within the viewport |

The constellation is an abstract decorative visualization, not a plot of individual users or inferred relationships. The connection count shown above it comes from the authenticated user's actual profile. There are no fabricated audience/view counts, certifications, AI matching scores, or news statistics. Passkeys, corporate SSO, messaging, and other unconfigured reference controls are not shown as working ProNet features.

## Performance and accessibility

- Three.js is loaded on demand in its own chunk, after the relevant page mounts.
- Only one scene is mounted on each feed/network page. The duplicate constellation in the reference feed is omitted.
- Device pixel ratio is capped at 1.5. Geometry/materials, frame callbacks, observers, listeners, and renderer resources are released on unmount.
- Rendering pauses while the scene is off screen, when the document is hidden, and when reduced motion or Pause is active.
- WebGL creation/context loss triggers an inline static SVG fallback. Core project workflows continue to work.
- Graph controls and reactions have accessible names; the scene supports keyboard tilt and reset. A skip link reaches the main content.
- Buttons retain error states and existing API authorization. Display mode changes actually change the scene.

## Verification

- 29 backend Jest/Supertest checks and 8 frontend Jest/React Testing Library checks passed.
- 22 browser checks passed, including real WebGL rendering, three display modes, keyboard tilt, pause, reduced motion, fallback, and existing account/feed/network/job workflows.
- Five authenticated screens fit 390, 768, and 1440 px; mobile and desktop authentication screens also fit.
- A clean `npm run setup` installed both dependency trees and generated a valid environment file in a fresh directory.
- Production build and backend/frontend lint passed; no uncaught JavaScript errors occurred in the browser workflows.
- The frontend production dependency audit returned zero vulnerabilities at the time of verification.

See `verification/backend-tests.txt`, `frontend-tests.txt`, `browser-results.json`, `browser-test-log.txt`, `redesign-build.txt`, `clean-setup.txt`, and screenshots in that directory. Browser checks run against an isolated temporary MongoDB database with isolated test accounts, rather than the user's database.

The Windows `.cmd` launchers set their working directory to the extracted project automatically. The scripts were inspected, and the Node launcher syntax and missing-setup preflight were exercised in Linux. The Windows launchers were not executed on a Windows PC in this environment.
