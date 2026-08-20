FROM oven/bun:1.4 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build --target=bun ./src/index.ts --outdir ./dist

FROM oven/bun:1.4
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
EXPOSE 3001
CMD ["bun", "run", "./dist/index.js"]