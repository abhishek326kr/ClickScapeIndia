# Frontend Dockerfile (React build served by Nginx)
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Accept an API base override at build time (used by Vite)
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

COPY frontend/package*.json ./
## Use npm install to ensure devDependencies (vite) are installed even if lockfile is missing
RUN npm install --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy a SPA-friendly nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
