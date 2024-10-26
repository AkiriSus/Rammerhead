FROM node:bookworm

WORKDIR /app

COPY . .

RUN npm i -g pnpm && pnpm i

COPY . .

CMD node .

EXPOSE 8080