const WebSocket = require('ws');
// replace with your app instance fqdn url & the tcp port
var server = "ws://autoclusteredgemultiplay.vancouver-main.telus.mobiledgex.net:3000";
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
            createReq = createRoomRequest('Ahmed', playerId, 0, 3);
            ws.send(JSON.stringify(createReq));
            console.log('Create Room Request sent to the server: %o', createReq);
            break;
        case 'roomCreated':
            console.log('room created on server, room : %o', jsonObj.room);
            break;
    }
}

ws.onclose = function () {
    ws.terminate();
}

function createRoomRequest(playerName, playerId, playerAvatar, maxPlayersPerRoom) {
    let createReq = {};
    createReq.type = 'CreateRoom';
    createReq.playerName = playerName;
    createReq.playerId = playerId;
    createReq.playerAvatar = playerAvatar;
    createReq.maxPlayersPerRoom = maxPlayersPerRoom;
    return createReq;
}