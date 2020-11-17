const WebSocket = require('ws');
// replace with your app instance fqdn url & the tcp port
var server = "ws://autoclusteredgemultiplay.vancouver-main.telus.mobiledgex.net:3000";
var ws = new WebSocket(server);

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
            let getRoomsRequest = {};
            getRoomsRequest.type = 'GetRooms';
            ws.send(JSON.stringify(getRoomsRequest));
            console.log('GetRooms Request sent to the server: %o', getRoomsRequest);
            break;
        case 'roomsList':
            console.log('GetRooms Response, rooms on server: %o', jsonObj.rooms);
            break;
    }
}

ws.onclose = function () {
    ws.terminate();
}