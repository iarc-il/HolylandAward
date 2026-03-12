# Frontend Dockerfile for HolylandAward
# Multi-stage build for production

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for non-sensitive environment variables
ARG VITE_API_BASE_URL
ARG VITE_COMMIT_SHA

# Set non-sensitive variables as environment variables for the build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_COMMIT_SHA=$VITE_COMMIT_SHA

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application — sensitive keys are injected via secret mounts
# and are never stored in image layers or metadata
RUN --mount=type=secret,id=clerk_key,env=VITE_CLERK_PUBLISHABLE_KEY \
    --mount=type=secret,id=maps_key,env=VITE_GOOGLE_MAPS_API_KEY \
    npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
