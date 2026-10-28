# use node 18 alpine image
FROM node:18-alpine

# create work directory in app folder
WORKDIR /app

# install required packages for node image
RUN apk --no-cache add openssh g++ make python3 git

# copy over package.json files
COPY package*.json ./

# install all dependencies
RUN npm i

# copy over project files
COPY . .

# generate prisma types
RUN npx prisma generate --schema=/app/server/utils/prisma/schema.prisma

# build the project
RUN npm run build

# expose the host and port 1920 to the server
ENV HOST=0.0.0.0
ENV PORT=1920
ENV NITRO_PORT=1920
EXPOSE 1920

# sync database schema, seed initial records if needed, and start server
ENTRYPOINT ["/bin/sh", "-c", "npx prisma db push --schema=/app/server/utils/prisma/schema.prisma --skip-generate && node server/utils/docker_init_db.js; exec node .output/server/index.mjs"]
