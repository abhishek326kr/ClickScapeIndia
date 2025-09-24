# Frontend Dockerfile (React build served by Nginx)
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Accept an API base override at build time (used by Vite)
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
ENV NODE_ENV=development

COPY frontend/package*.json ./
## Use npm install to ensure devDependencies (vite) are installed even if lockfile is missing
RUN npm install --no-audit --no-fund --include=dev

COPY frontend/ ./
# Ensure dev deps are present after full source is copied (some projects update package.json during copy)
RUN npm install --no-audit --no-fund --include=dev \
    && npm install -D vite@5.4.0 --no-audit --no-fund
# Call vite via explicit bin path to avoid PATH issues
RUN node ./node_modules/vite/bin/vite.js build

# Serve stage
FROM nginx:alpine

# Copy a SPA-friendly nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
