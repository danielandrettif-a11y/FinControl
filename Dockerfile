FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts && npm rebuild better-sqlite3

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
