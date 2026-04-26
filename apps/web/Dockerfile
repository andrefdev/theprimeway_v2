# Build stage: compile Vite SPA with build-time environment variables
# Production: app.theprimeway.app
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
ARG VITE_SENTRY_DSN
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_VAPID_KEY

# Export as environment variables for Vite build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID
ENV VITE_APPLE_REDIRECT_URI=$VITE_APPLE_REDIRECT_URI
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

# Inject Firebase config into the FCM service worker (can't read import.meta.env)
RUN sed -i \
    -e "s|__FB_API_KEY__|${VITE_FIREBASE_API_KEY}|g" \
    -e "s|__FB_AUTH_DOMAIN__|${VITE_FIREBASE_AUTH_DOMAIN}|g" \
    -e "s|__FB_PROJECT_ID__|${VITE_FIREBASE_PROJECT_ID}|g" \
    -e "s|__FB_MESSAGING_SENDER_ID__|${VITE_FIREBASE_MESSAGING_SENDER_ID}|g" \
    -e "s|__FB_APP_ID__|${VITE_FIREBASE_APP_ID}|g" \
    apps/web/public/firebase-messaging-sw.js

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package (exports point to dist/ JS files)
RUN pnpm --filter @repo/shared build

# Build the SPA
# Output: dist/ (optimized, hashed asset filenames, code-split bundles)
RUN pnpm --filter @repo/web build

# Runtime stage: serve static SPA with nginx
FROM nginx:alpine AS runner
LABEL org.opencontainers.image.source="https://github.com/andrefdev/theprimeway_v2"

# Copy the compiled SPA from builder
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground (required for containers)
CMD ["nginx", "-g", "daemon off;"]
