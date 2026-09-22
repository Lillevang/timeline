# Stage 1: Build
FROM node:25.9.0-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Stage 2: Serve with Nginx (unprivileged variant: runs as uid 101, listens on 8080)
FROM docker.io/nginxinc/nginx-unprivileged:1.31.6-alpine-slim@sha256:2186f829d5390dc6217900279bcfbc0836a947f331980fd40d5be7d3aff5515a
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
