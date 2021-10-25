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

const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");
const events = require("./Events").Events;
/**
 * Class representing a Lobby.
 * A Lobby is where all the rooms and the players' connections are stored
 * Think of a Lobby as the place where all the players hangout before they are matched to a room
 *
 */
class Lobby {
    /**
     * @constructor
     * @param  {integer} MAX_ROOMS_PER_LOBBY maximum rooms per lobby based on the number of rooms members per room & the app instance flavor (server performance)
     */
    constructor (MAX_ROOMS_PER_LOBBY) {
        this.MAX_ROOMS_PER_LOBBY = MAX_ROOMS_PER_LOBBY;
        this.connectedClients = {};
        this.nameMap = {};
        this.rooms = new Map();
        this.availableRooms = new Map();
        this.fullRooms = new Map();
    }
    /**
     * @param  {string} playerKey  unique identifier of the session using the |Sec-WebSocket-Key| header
     * @param  {ws} connection  websocket connection
     */
    addPlayer (playerKey, connection) {
        var playerId = uuidv4();
        this.nameMap[playerId] = playerKey;
        this.connectedClients[playerKey] = connection;
        return playerId;
    }
    /**
     * @param  {string} playerId unique player id assigned once the connection is established using uuid package
     */
    removePlayer (playerId) {
        var playerKey = this.nameMap[playerId];
        delete this.nameMap[playerId];
        delete this.connectedClients[playerKey];
    }
    /**
     * @param  {Room} room room object, representing the room to be added
     */
    addRoom (room) {
        this.rooms.set(room.roomId, room);
        this.availableRooms.set(room.roomId, room);
        var newRoomNotification = new events.NotificationEvent(
            "new-room-created-in-lobby"
        );
        this.notifyLobbyMembers(newRoomNotification);
    }
    /**
     * @param  {string} roomId the unique room id of the room to be removed
     */
    removeRoom (roomId) {
        this.rooms.delete(roomId);
        this.availableRooms.delete(roomId);
        this.fullRooms.delete(roomId);
        var roomRemovedNotification = new events.NotificationEvent(
            "room-removed-from-lobby"
        );
        this.notifyLobbyMembers(roomRemovedNotification);
    }
    /**
     * @param  {Event} Event event object, representing the event to be sent to Lobby members
     */
    notifyLobbyMembers (Event) {
        Object.values(this.connectedClients).forEach((client) => {
            if (client !== undefined && client.readyState === WebSocket.OPEN) {
                client.send(Event.convertToJSONString());
            }
        });
    }

    /**
     * @param  {string} playerId unique player id assigned once the connection is established using uuid package
     */
    getPlayerConnection (playerId) {
        var playerKey = this.nameMap[playerId];
        var connection = this.connectedClients[playerKey];
        return connection;
    }

    /**
     * @param  {string} roomId the unique room id of the room
     * @param  {Array.<UDPClient>} udpClients array of the UDPClients representing players in the room
     */
    updateRoomUDPClientsMap (roomId, udpClients) {
        this.udpConnectionsPerRoom[roomId] = udpClients;
    }
    /**
     * @param  {Room} room room object, representing the room to be marked full
     */
    markRoomAsFull (room) {
        if (this.availableRooms.has(room.roomId)) {
            this.availableRooms.delete(room.roomId);
        }
        this.fullRooms.set(room.roomId, room);
    }
}
module.exports.Lobby = Lobby;
