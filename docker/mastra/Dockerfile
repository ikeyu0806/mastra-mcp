FROM node:23-bullseye-slim

WORKDIR /app

EXPOSE 4111

COPY . /app

RUN npm ci && npm rebuild
