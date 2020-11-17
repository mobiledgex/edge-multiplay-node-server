FROM node:8

WORKDIR /usr/src/app/

COPY package*.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD node server.js

EXPOSE 3000
EXPOSE 5000/udp