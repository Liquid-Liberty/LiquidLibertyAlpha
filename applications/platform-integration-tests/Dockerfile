# Dockerfile for integration tests
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files
COPY tests/ ./tests/
COPY playwright.config.ts ./
COPY vitest.config.ts ./
COPY tsconfig.json ./
COPY .env.example ./.env.example

# Install Playwright browsers
RUN npx playwright install

# Default command: run API tests (E2E tests need GUI)
CMD ["npm", "run", "test:api"]
