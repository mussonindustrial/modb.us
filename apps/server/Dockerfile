FROM node:20-alpine AS runner
LABEL authors="Ben Musson"


ENV NODE_ENV=production

WORKDIR /app

COPY dist/apps/server ./

RUN npm install --omit=dev

EXPOSE 502

# Run the compiled ESM output
CMD ["node", "index.js"]