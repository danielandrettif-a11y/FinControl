FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "node server.js > error.log 2>&1 || (cat error.log && sleep 600)"]
