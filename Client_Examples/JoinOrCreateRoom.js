const WebSocket = require('ws');
// replace with your app instance fqdn url & the tcp port
var server = "ws://localhost:3000";
var ws = new WebSocket(server);
var playerId = '';

ws.onopen = function () {
    console.log('Connected to %s', server);
}

ws.onmessage = function (e) {
    console.log("Received form server: '" + e.data + "'");
    jsonObj = JSON.parse(e.data);
    switch (jsonObj.type) {
        case 'register':
            playerId = jsonObj.playerId;
            console.log('Player Registered on server, playerId : ' + playerId);
            joinOrCreateReq = joinOrCreateRoomRequest('Ahmed', playerId, 0, 3);
            ws.send(JSON.stringify(joinOrCreateReq));
            console.log('Create Room Request sent to the server: %o', joinOrCreateReq);
            break;
        case 'roomCreated':
            console.log('room created on server, room : %o', jsonObj.room);
            break;
        case 'roomJoin':
          console.log('joined room on server, room : %o', jsonObj.room);
          break;
    }
}

ws.onclose = function () {
    ws.terminate();
}

function joinOrCreateRoomRequest(playerName, playerId, playerAvatar, maxPlayersPerRoom) {
    let joinOrCreateReq = {};
    joinOrCreateReq.type = 'JoinOrCreateRoom';
    joinOrCreateReq.playerName = playerName;
    joinOrCreateReq.playerId = playerId;
    joinOrCreateReq.playerAvatar = playerAvatar;
    joinOrCreateReq.maxPlayersPerRoom = maxPlayersPerRoom;
    return joinOrCreateReq;
}