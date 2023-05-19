FROM node:16
WORKDIR /action
COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT ["node", "/action/sync.js"]
