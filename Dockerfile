# syntax=docker/dockerfile:1

# Base image
FROM node:20-alpine AS base

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first (leverage Docker layer cache)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source
COPY . .

# Run as non-root user for security
USER node

# Default port (override as needed)
EXPOSE 3000

# Allow overriding the start command at runtime
ENV START_CMD="npm start"

# Use a shell so START_CMD env is expanded if provided
CMD ["sh", "-lc", "$START_CMD"]
