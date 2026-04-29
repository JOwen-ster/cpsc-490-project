# GitGraph

GitGraph is an AI-powered project management dashboard that transforms chaotic GitHub issue lists into intuitively organized visual graphs and logical roadmaps.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/) (GitHub Provider)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash` & `gemini-2.5-flash-lite`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn](https://ui.shadcn.com/)
- **Visuals**: [react-force-graph-2d](https://github.com/vasturiano/react-force-graph-2d) & [Lucide Icons](https://lucide.dev/)

## Local Development

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: Recommended package manager
- **Docker**: For running the containerized database and webapp setup
- **GitHub OAuth App**: Create one at [GitHub Developer Settings](https://github.com/settings/developers)
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/callback/github`
- **Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/)

### Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone <repo_url>
   cd cpsc-490-project
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:

   ```env
   # Database
   POSTGRES_USER=app
   POSTGRES_PASSWORD=app
   POSTGRES_DB=appdb
   DATABASE_URL="postgresql://app:app@localhost:5432/appdb"

   # NextAuth
   AUTH_SECRET=your-random-secret # Generate with: pnpm dlx auth secret
   AUTH_GITHUB_ID=your-github-client-id
   AUTH_GITHUB_SECRET=your-github-client-secret

   # AI
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Start the Environment**:
   Run the following command to build the webapp image and start the database and application containers:

   ```bash
   docker compose --build --no-cache
   ```

   ```bash
   docker compose up
   ```

   *Note: This will automatically run `prisma db push` inside the container as part of the startup command.*

   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Stop the Environment**:
   To shut down the environment and delete all volumes (resetting the database):

   ```bash
   docker compose down -v
   ```

   If you want to persist the database, remove the `-v` flag.
