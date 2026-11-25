FROM node:22-bookworm

WORKDIR /app

# Native Node.js dependencies such as better-sqlite3 may require node-gyp.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHON=/usr/bin/python3
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate --no-hints
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
