FROM node:20

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

ENV PORT=3000

CMD ["npm", "run", "dev"]
