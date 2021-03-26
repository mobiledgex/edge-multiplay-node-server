const edgeMultiplay = require('./server.js')

edgeMultiplay.wsServer.on('newConnection',(path, connection)=>{
 
    edgeMultiplay.addToLobby(connection)
    //you can check for the path here and reject the connection if the path is not correct
    // edgeMultiplay.rejectConnection(connection)
})
