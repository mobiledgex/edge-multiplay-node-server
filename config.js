let wsPort = 3000;
let udpPort = 5000;
let statsPort = 7776;
const pino = require('pino');
const pretty = require('pino-pretty');
const stream = pretty({
  prettyPrint: { colorize: true }
});
const logger = pino(stream);

module.exports = {
  wsPort,
  udpPort,
  statsPort,
  logger
};
