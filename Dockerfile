# syntax=docker/dockerfile:1

ARG NODE_VERSION=25.0.0
ARG PORT=3000

################################################################################
# Base stage: common foundation for all stages.
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

# Install dumb-init to handle signals properly in the final container.
RUN apk add --no-cache dumb-init~=1.2

# Create non-root user and prepare for application.
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

################################################################################
# Dependencies stage: install production dependencies only.
FROM base AS deps

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Build stage: compile application with dev dependencies.
FROM base AS build

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npm run build

################################################################################
# Production stage: minimal runtime image.
FROM base AS final

ENV NODE_ENV=production
ARG PORT
ENV PORT=${PORT}

# Copy production dependencies.
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy built application (Next.js outputs .next, public, etc).
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package*.json ./

# Set ownership to nextjs user.
RUN chown -R nextjs:nodejs /usr/src/app

# Switch to non-root user.
USER nextjs

EXPOSE ${PORT}

# Healthcheck to verify the service is running.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

# Use dumb-init to handle signals.
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["npm", "start"]
