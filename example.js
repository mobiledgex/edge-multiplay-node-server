const edgeMultiplay = require('./server.js')

edgeMultiplay.wsServer.on('newConnection',(pathName, connection)=>{
  // your authentication logic goes here 
  // On success call edgeMultiplay.addToLobby(connection)
  // On failure call edgeMultiplay.rejectConnection(connection)
})

