FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:20-alpine
WORKDIR /action
COPY --from=builder /app .
ENTRYPOINT ["node", "/action/sync.js"]
