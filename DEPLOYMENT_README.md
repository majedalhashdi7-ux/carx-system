Deployment checklist and instructions

1) Required secrets (set in Vercel dashboard and GitHub repository secrets):
  - `VERCEL_TOKEN` (GitHub secret, used by CI)
  - `MONGO_URI` or tenant-specific `MONGO_URI_<TENANT>` variables (Vercel env)
  - `NEXT_PUBLIC_API_URL` (Vercel env)
  - `SESSION_SECRET`, `JWT_SECRET` (Vercel env)
  - `ADMIN_PASSWORD` / `PROD_ADMIN_EMAIL` (if you need to auto-create admin)
  - Optional: Cloudinary keys, Sentry DSN, Redis, etc.

2) Using GitHub Actions
  - Push to `main` will trigger `.github/workflows/deploy-vercel.yml` which builds and runs `vercel --prod` using `VERCEL_TOKEN` secret.

3) Manual deploy (local)
  - Export token and run helper script:
    ```bash
    export VERCEL_TOKEN=your_token_here
    ./scripts/deploy/to-vercel.sh
    ```

4) Post-deploy checks
  - Visit the deployed site and verify client loads without CORS errors.
  - Call API endpoint: `GET /api/v2/live-auctions` to validate DB connectivity.
  - If DB errors occur, confirm `MONGO_URI` or tenant-specific URIs in Vercel env settings.
