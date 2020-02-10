FROM node:8.15.0-alpine

ENV APP_DIR=/node_app

COPY . $APP_DIR
WORKDIR $APP_DIR

RUN npm install -g http-server && \
    npm install

EXPOSE 8080

ENTRYPOINT [ "http-server" ]
