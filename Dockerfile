FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose Next.js dev server port
EXPOSE 3000

# Start the development server
CMD ["pnpm", "dev"]
