FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
RUN chmod +x ./scripts/docker-start.sh ./scripts/wait-for-db.js || true
CMD ["sh", "./scripts/docker-start.sh"]
