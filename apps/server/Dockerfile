FROM node:24-alpine

LABEL authors="Ben Musson"

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable

COPY dist/apps/server ./

RUN yarn install --production --frozen-lockfile

EXPOSE 502

CMD ["node", "index.js"]