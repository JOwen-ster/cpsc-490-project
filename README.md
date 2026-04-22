# GitGraph

GitGraph is an AI-powered project management dashboard that transforms chaotic GitHub issue lists into intuitively organized visual graphs and logical roadmaps.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/) (GitHub Provider)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash` & `gemini-2.0-flash-lite`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visuals**: [react-force-graph-2d](https://github.com/vasturiano/react-force-graph-2d) & [Lucide Icons](https://lucide.dev/)

## Local Development

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: Recommended package manager
- **Docker**: For running the local database
- **GitHub OAuth App**: Create one at [GitHub Developer Settings](https://github.com/settings/developers)
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/callback/github`
- **Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd cpsc-490-project
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   # Database
   DATABASE_URL="postgresql://app:app@localhost:5432/appdb"

   # NextAuth
   AUTH_SECRET="your-random-secret" # Generate with: openssl rand -base64 32
   AUTH_GITHUB_ID="your-github-client-id"
   AUTH_GITHUB_SECRET="your-github-client-secret"

   # AI
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Start the Database**:
   ```bash
   docker-compose up -d gitgraph-postgres-db
   ```

5. **Sync Database Schema**:
   ```bash
   pnpm prisma db push
   pnpm prisma generate
   ```

6. **Run the development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Create a project on Vercel** and connect your GitHub repository.
2. **Setup Vercel Postgres**: Add the "Postgres" storage integration to your project. Vercel will automatically add the `POSTGRES_PRISMA_URL` environment variable.
3. **Configure Environment Variables**:
   - Set `DATABASE_URL` to the value of `POSTGRES_PRISMA_URL`.
   - Set `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `GEMINI_API_KEY`.
4. **Build Command**: Vercel handles this automatically, but ensure `prisma generate` runs during the build step (already included in `package.json`'s `postinstall` script).
5. **Deploy**: Push to `main` and Vercel will build and deploy the application.

### Deploy to AWS (via App Runner or ECS)

The project includes a `Dockerfile` and `compose.yml` for containerized deployment.

1. **Database**: Use **Amazon RDS for PostgreSQL** or **Amazon Aurora**.
2. **Container Registry**: Push your image to **Amazon ECR**.
   ```bash
   docker build -t gitgraph .
   # Tag and push to ECR...
   ```
3. **AWS App Runner**:
   - Point App Runner to your ECR image.
   - Configure the environment variables in the App Runner console.
   - Ensure the service has network access to your RDS instance (VPC Connector).
4. **AWS Amplify**:
   - Amplify Gen 2 supports Next.js App Router deployments directly from GitHub.
   - Similar to Vercel, you will need to provide the `DATABASE_URL` and other secrets in the Amplify console.

## 📈 Monitoring & Maintenance

- **Manual reset**: To reset the AI grouping limits for all users via terminal:
  ```bash
  DATABASE_URL="..." pnpm prisma db execute --stdin <<EOF
  UPDATE users SET ai_groupings_count = 0, last_ai_grouped_at = NULL;
  EOF
  ```
