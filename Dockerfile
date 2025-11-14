FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

ENV PORT=3000

CMD ["npm", "run", "dev"]
