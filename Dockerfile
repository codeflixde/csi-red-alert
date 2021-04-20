FROM node:current-alpine as build-env
WORKDIR /app

ADD ./package.json ./
ADD ./yarn.lock ./
RUN yarn install

COPY ./ ./
RUN yarn build



FROM aquasec/trivy:latest
RUN apk add --update nodejs
WORKDIR /app
COPY --from=build-env /app/build /app/
COPY --from=build-env /app/node_modules /app/node_modules

