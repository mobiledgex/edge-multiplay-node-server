/**
 * @param  {object} ports Ports the server should run on
 *  ex. ({
 * wsPort :  3433,
 * udpPort : 4533,
 * statsPort : 2332
 * })
 */
module.exports = (ports = undefined) => {
  const edgeMultiplay = require("./server.js");
  if (ports !== undefined) {
    if (ports.wsPort !== undefined) {
      edgeMultiplay.config.wsPort = ports.wsPort;
    }
    if (ports.udpPort !== undefined) {
      edgeMultiplay.config.udpPort = ports.udpPort;
    }
    if (ports.statsPort !== undefined) {
      edgeMultiplay.config.statsPort = ports.statsPort;
    }
  }
  edgeMultiplay.startEdgeMultiplay();
  return edgeMultiplay;
};
