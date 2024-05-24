FROM node:20
WORKDIR /action
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ENTRYPOINT ["node", "/action/sync.js"]
