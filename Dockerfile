FROM node:20-alpine

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

# Expose port 3001
EXPOSE 3001

# Start the server (which now serves the API and the static frontend)
CMD ["npx", "tsx", "server.ts"]
