# Multi-stage Dockerfile for Netlify Functions development
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy function files
COPY netlify/ ./netlify/
COPY netlify.toml ./
COPY .env.example ./.env.example

# Create non-root user for security
RUN addgroup -g 1001 -S netlify && \
    adduser -S netlify -u 1001 && \
    chown -R netlify:netlify /app

USER netlify

# Expose Netlify dev server port
EXPOSE 8888

# Default command: start Netlify dev server
CMD ["npx", "netlify", "dev"]

# Development stage
FROM base AS development
CMD ["npx", "netlify", "dev", "--live"]

# Test stage
FROM base AS test
CMD ["npm", "test"]
