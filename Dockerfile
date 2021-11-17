FROM node:16-slim

WORKDIR /usr/src/app/

COPY package*.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD node example.js

EXPOSE 3000
EXPOSE 5000/udp
EXPOSE 7776
