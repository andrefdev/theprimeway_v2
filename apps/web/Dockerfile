# Build stage: compile Vite SPA with build-time environment variables
# Staging: staging.theprimeway.app
FROM node:22-alpine AS builder
RUN npm install -g pnpm@9.12.2

WORKDIR /repo

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy workspace packages
COPY packages/ ./packages/

# Copy web app
COPY apps/web/ ./apps/web/

# Accept build-time environment variables for Vite
# These are baked into the SPA bundle and visible to browsers (not secrets!)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APPLE_CLIENT_ID
ARG VITE_APPLE_REDIRECT_URI

# Export as environment variables for Vite build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID
ENV VITE_APPLE_REDIRECT_URI=$VITE_APPLE_REDIRECT_URI

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the SPA
# Output: dist/ (optimized, hashed asset filenames, code-split bundles)
RUN pnpm --filter @repo/web build

# Runtime stage: serve static SPA with nginx
FROM nginx:alpine AS runner

# Copy the compiled SPA from builder
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground (required for containers)
CMD ["nginx", "-g", "daemon off;"]
