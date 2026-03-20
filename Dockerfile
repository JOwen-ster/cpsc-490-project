FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema and config so postinstall can run during pnpm install
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
# We don't skip postinstall here because we copied the schema above.
# This ensures the client is generated right away.
RUN pnpm install

# Copy the rest of the application
COPY . .

# Re-run generate just in case something changed in the rest of the files, 
# although the previous step should have covered it.
RUN pnpm exec prisma generate

# Expose Next.js dev server port
EXPOSE 3000

# Start the development server
CMD ["pnpm", "dev"]
