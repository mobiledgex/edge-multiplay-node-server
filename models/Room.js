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
const { v4: uuidv4 } = require('uuid');
const { logger } = require("../config");

/**
 * Class representing a Room.
 * 
 */
class Room {
    /**
     * @constructor
     * @param  {integer} maxPlayersPerRoom maximum players per room, must be greater than 1
     * @param  {integer} minPlayersToStartGame minimum players to start the game, more players can join afterwards as long as the number of players in a room is less than maxPlayersPerRoom, when minPlayersToStartGame is less than 2 minPlayersToStartGame will be equal maxPlayersPerRoom 
     */
    constructor (maxPlayersPerRoom, minPlayersToStartGame = 0) {
        this.roomId = uuidv4();
        this.roomMembers = [];
        this.minPlayersToStartGame = minPlayersToStartGame < 2 ? maxPlayersPerRoom : minPlayersToStartGame;
        this.maxPlayersPerRoom = maxPlayersPerRoom;
        this.udpConnections = new Map();
        this.gameStarted = false;
    }

    /**
     * @param  {Player} player Player object, representing the player to be added to the room
     */
    addPlayer (player) {
        this.roomMembers.push(player);
        this.gameStarted = this.roomMembers.length >= this.minPlayersToStartGame;
    }

    /**
     * @param  {string} playerId unique player id assigned once the connection is established using uuid package
     */
    removePlayer (playerId) {
        var updatedRoomMembers, counter;
        try {
            this.udpConnections.delete(playerId);
            this.roomMembers.forEach((roomMember, index, object) => {
                if (roomMember.playerId === playerId) {
                    object.splice(index, 1);
                    updatedRoomMembers = object;
                }
            });
            for (counter = 0; counter < updatedRoomMembers.length; counter++) {
                updatedRoomMembers[counter].playerIndex = counter;
            }
            this.roomMembers = updatedRoomMembers;
            this.gameStarted = this.roomMembers.length >= this.minPlayersToStartGame;
        }
        catch (error) {
            logger.error(`error removing player from the room, ${error}`);
            return false;
        }
    }

    isFull () {
        return this.roomMembers.length === this.maxPlayersPerRoom;
    }


    isEmpty () {
        return this.roomMembers.length === 0;
    }

    /**
     * @param  {Lobby} lobby Lobby object, A Lobby is where all the rooms and the players' connections are stored , Think of a Lobby as the place where all the players hangout before they are matched to a room
     * @param  {Event} Event Event object, representing the event to be broadcasted from the sender to the sender's room
     * @param  {string} senderId the playerId of the sender, a playerId is a unique player id assigned once the connection is established using uuid package
     */
    broadcastGameFlowEvent (lobby, Event, senderId) {
        if (typeof senderId !== "undefined") {
            this.roomMembers.forEach(player => {
                if (senderId !== player.playerId) {
                    var playerConnection = lobby.getPlayerConnection(player.playerId);
                    if (playerConnection !== undefined && playerConnection.readyState === WebSocket.OPEN) {
                        playerConnection.send(Event.convertToJSONString());
                    }
                }
            });
        }
        else {
            this.roomMembers.forEach(player => {
                var playerConnection = lobby.getPlayerConnection(player.playerId);
                if (playerConnection !== undefined && playerConnection.readyState === WebSocket.OPEN) {
                    playerConnection.send(Event.convertToJSONString());
                }
            });
        }
    }

    /**
     * @param  {Lobby} lobby Lobby object, A Lobby is where all the rooms and the players' connections are stored , Think of a Lobby as the place where all the players hangout before they are matched to a room
     * @param  {GamePlayEvent} gamePlayEvent GamePlayEvent object, representing the gamePlayEvent to be broadcasted from the sender to the sender's room
     * @param  {string} senderId the playerId of the sender, a playerId is a unique player id assigned once the connection is established using uuid package
     */
    broadcastGamePlayEvent (lobby, gamePlayEvent, senderId) {
        this.roomMembers.forEach(player => {
            if (senderId !== player.playerId) {
                var playerConnection = lobby.getPlayerConnection(player.playerId);
                if (playerConnection !== undefined && playerConnection.readyState === WebSocket.OPEN) {
                    playerConnection.send(JSON.stringify(gamePlayEvent));
                }
            }
        });
    }
}
module.exports.Room = Room;