FROM node:24-alpine

LABEL org.opencontainers.image.authors="Ben Musson"

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable

COPY dist/apps/server/package.json ./
COPY dist/apps/server/yarn.lock ./

RUN yarn install \
    --production \
    --frozen-lockfile \
    --non-interactive \
    && yarn cache clean

COPY dist/apps/server/index.js ./index.js

EXPOSE 502/tcp
EXPOSE 502/udp

CMD ["node", "index.js"]