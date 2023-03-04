FROM node:slim

WORKDIR /app

ARG PORT
ENV PORT=$PORT

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

COPY . .

CMD ["npm", "start"]