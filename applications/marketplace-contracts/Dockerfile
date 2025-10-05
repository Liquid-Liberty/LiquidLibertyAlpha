# Multi-stage Dockerfile for Hardhat development and deployment
FROM node:20-alpine AS base

# Install required dependencies
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy contract files and scripts
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY test/ ./test/
COPY hardhat.config.cjs ./
COPY .env.example ./.env.example

# Create non-root user for security
RUN addgroup -g 1001 -S hardhat && \
    adduser -S hardhat -u 1001 && \
    chown -R hardhat:hardhat /app

USER hardhat

# Compile contracts
RUN npx hardhat compile

# Expose Hardhat Network RPC port
EXPOSE 8545

# Default command: start Hardhat node
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]

# Development stage with hot-reload
FROM base AS development
USER root
RUN npm install -g nodemon
USER hardhat
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]

# Test stage
FROM base AS test
CMD ["npx", "hardhat", "test"]

# Deploy stage
FROM base AS deploy
COPY .env ./.env
CMD ["npx", "hardhat", "run", "scripts/deploy.js", "--network", "localhost"]
