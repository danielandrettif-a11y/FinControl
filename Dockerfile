FROM node:20-alpine

# Install OpenSSL and libc6-compat for Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm install
RUN npx prisma generate

# Copy all files
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose default port 3000
EXPOSE 3000

# Push DB schema on startup to create tables in SQLite and start the server
CMD ["sh", "-c", "npx prisma db push && npx tsx server.ts"]
