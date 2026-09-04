# ==============================================================================
# Stage 1: Build Frontend React 19 SPA
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline || npm install
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Build Backend Node.js Server
# ==============================================================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --prefer-offline || npm install
COPY backend/ ./
RUN npm run build

# ==============================================================================
# Stage 3: Production Backend Runtime (<90MB on Alpine)
# ==============================================================================
FROM node:20-alpine AS backend-runtime
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --only=production --prefer-offline || npm install --production
COPY --from=backend-builder /app/backend/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]
