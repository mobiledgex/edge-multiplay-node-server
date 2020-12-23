/**
 * Copyright 2018-2021 MobiledgeX, Inc. All rights and licenses reserved.
 * MobiledgeX, Inc. 156 2nd Street #408, San Francisco, CA 94105
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const WebSocket = require('ws');
// replace with your app instance fqdn url & the tcp port
var server = "ws://localhost:3000";
var ws = new WebSocket(server);
var playerId = '';
var roomId = 'room-1-1-3'

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
            joinOrCreateReq = joinRoom(roomId ,'Ahmed', playerId, 0);
            ws.send(JSON.stringify(joinOrCreateReq));
            console.log('Join Room Request sent to the server: %o', joinOrCreateReq);
            break;
        case 'notification':
            console.log('msg from server, msg : %o', jsonObj.notificationText);
            break;
        case 'roomJoin':
          console.log('joined room on server, room : %o', jsonObj.room);
          break;
    }
}

ws.onclose = function () {
    ws.terminate();
}

function joinRoom(roomId, playerName, playerId, playerAvatar) {
    let joinRoomReq = {};
    joinRoomReq.type = 'JoinRoom';
    joinRoomReq.roomId = roomId;
    joinRoomReq.playerName = playerName;
    joinRoomReq.playerId = playerId;
    joinRoomReq.playerAvatar = playerAvatar;
    return joinRoomReq;
}