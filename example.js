const edgeMultiplay = require("./app")({
  wsPort: 3000,
  udpPort: 5000,
  statsPort: 7776,
});
edgeMultiplay.wsServer.on("newConnection", (path, connection) => {
  edgeMultiplay.addToLobby(connection);
  // you can check for the path here and reject the connection if the path is not correct
  // edgeMultiplay.rejectConnection(connection)
});
