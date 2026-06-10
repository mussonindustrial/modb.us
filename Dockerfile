FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g pm2 serve tsx
COPY --from=builder --chown=node:node /app /app

RUN echo "module.exports = { \
  apps: [ \
    { \
      name: 'backend', \
      script: 'tsx', \
      args: 'apps/backend/src/server.ts', \
      env: { NODE_ENV: 'production' }, \
      exp_backoff_restart_delay: 100 \
    }, \
    { \
      name: 'frontend', \
      script: 'serve', \
      args: '-s apps/frontend/dist -l 3000', \
      env: { NODE_ENV: 'production' }, \
      exp_backoff_restart_delay: 100 \
    } \
  ] \
};" > ecosystem.config.js && chown node:node ecosystem.config.js

ENV PM2_HOME=/app/.pm2
USER node

EXPOSE 3000 3001 5020
CMD ["pm2-runtime", "ecosystem.config.js"]