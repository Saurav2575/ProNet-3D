# Start ProNet on Windows

1. Extract `ProNet-3D.zip` into `C:\Users\saura\SIP report and ppt`.
2. Open the extracted **ProNet-3D** folder. It contains `package.json`, `backend`, `frontend`, and the two launchers. Avoid opening its parent folder when running npm commands.
3. Install Node.js **22.12 or newer**, then double-click **Setup-ProNet.cmd**. Let dependency installation finish.
4. Start MongoDB. With Docker Desktop running, open a terminal here and run `docker compose up -d`. Alternatively, use your existing MongoDB service or configure your Atlas URI in `backend/.env`.
5. Double-click **Start-ProNet.cmd**. Keep the terminal open.
6. Open **http://localhost:5173** and create your account.

Setup automatically creates `backend/.env` with a random JWT secret when it is missing. Existing environment files are preserved. Your previous `ProNet-Finished` copy is separate. Do not copy its `node_modules` into this project; the setup launcher installs the correct packages.

To use an existing database, configure its URI and follow the migration guidance in `README.md`. The ZIP contains no real credentials or account records.

## Manual commands

```powershell
cd "C:\Users\saura\SIP report and ppt\ProNet-3D"
npm run setup
# Start MongoDB before the next command
npm run dev
```

The backend runs at http://localhost:5000. Create a second account to demonstrate invitations, comments, and recruiter/candidate workflows.

See `README.md` for optional Cloudinary/Redis/email configuration, built serving, tests, and database migration.
