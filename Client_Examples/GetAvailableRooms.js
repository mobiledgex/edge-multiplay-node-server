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
            getRoomsRequest.type = 'GetAvailableRooms';
            ws.send(JSON.stringify(getRoomsRequest));
            console.log('GetAvailableRooms Request sent to the server: %o', getRoomsRequest);
            break;
        case 'roomsList':
            console.log('GetAvailableRooms Response, rooms on server: %o', jsonObj.rooms);
            break;
    }
}

ws.onclose = function () {
    ws.terminate();
}