FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm pkg delete scripts.prepare && npm ci --omit=dev
COPY src/ ./src/
COPY module-aliases.js ./
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["npm", "run", "start:prod"]
