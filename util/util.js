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

const Room = require('../models/Room').Room
const Player = require('../models/Player').Player
const events = require('../models/Events').Events
const UDPClient = require('../models/UDPClient').UDPClient

/**
* @module MatchMakingFunctions
*/


/**
 * @function
 * @param  {Lobby} lobby A Lobby is where all the rooms and the players' connections are stored 
 * @param  {string} playerId unique player id assigned once the connection is established using uuid package
 * @param  {string} playerName name of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} playerAvatar the avatar of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} maxPlayersPerRoom maximum players per room, must be greater than 1
 * @param  {Map} playerTags player custom tags sat by the client
 */
function joinOrCreateRoom(lobby, playerId, playerName, playerAvatar, maxPlayersPerRoom, playerTags) {
    if (lobby.availableRooms.size === 0) {
        return createRoom(lobby, playerId, playerName, playerAvatar, maxPlayersPerRoom, playerTags)
    } else {
        return joinRoom(lobby, lobby.availableRooms.entries().next().value[0], playerId, playerName, playerAvatar, playerTags)
    }
}
/**
 * @function
 * @param  {Lobby} lobby A Lobby is where all the rooms and the players' connections are stored 
 * @param  {string} playerId unique player id assigned once the connection is established using uuid package
 * @param  {string} playerName name of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} playerAvatar the avatar of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} maxPlayersPerRoom maximum players per room, must be greater than 1
 * @param  {Map} playerTags player custom tags sat by the client
 */
function createRoom(lobby, playerId, playerName, playerAvatar, maxPlayersPerRoom, playerTags) {
    let connection = lobby.getPlayerConnection(playerId)
    if (connection === undefined) {
        connection.send(new events.NotificationEvent('create-room-faliure').convertToJSONString())
        console.log('cannot find player connection')
        return undefined
    }

    if (lobby.rooms.size === lobby.MAX_ROOMS_PER_LOBBY) {
        connection.send(new events.NotificationEvent('create-room-faliure').convertToJSONString())
        console.log('Lobby reached maximum rooms threshold, Create room request failed')
        return undefined
    }
    var newRoom = new Room(maxPlayersPerRoom)
    newRoom.addPlayer(new Player(playerId, playerName, playerAvatar, 0, playerTags))
    lobby.addRoom(newRoom)
    var roomCreatedEvent = new events.RoomCreatedEvent(newRoom)
    connection.send(roomCreatedEvent.convertToJSONString())
    roomId = newRoom.roomId
    return roomId
}
/**
 * @function
 * @param  {Lobby} lobby  A Lobby is where all the rooms and the players' connections are stored 
 * @param  {string} roomId unique room id assigned on room creation, the id is generated using uuid() module
 * @param  {string} playerId unique player id assigned once the connection is established using uuid package
 * @param  {string} playerName  name of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} playerAvatar the avatar of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {Map} playerTags player custom tags sat by the client
 */
function joinRoom(lobby, roomId, playerId, playerName, playerAvatar, playerTags) {
    var connection = lobby.getPlayerConnection(playerId)
    if (lobby.availableRooms.size === 0) {
        console.log('No rooms available in the lobby, Failing the Join request')
        connection.send(new events.NotificationEvent('join-room-faliure').convertToJSONString())
        return undefined
    }
    var room = lobby.rooms.get(roomId)
    if (room === undefined) {
        console.log('Room not found, Failing the Join request')
        connection.send(new events.NotificationEvent('join-room-faliure').convertToJSONString())
        return undefined
    }
    if (room.isFull()) {
        console.log('Room is full, Failing the Join request')
        connection.send(new events.NotificationEvent('join-room-faliure').convertToJSONString())
        return undefined
    }
    var newPlayer = new Player(playerId, playerName, playerAvatar, room.roomMembers.length, playerTags)
    room.addPlayer(newPlayer)
    console.log('Member Joined Room')
    connection.send(new events.RoomJoinEvent(room).convertToJSONString())
    var playerJoinedRoomEvent = new events.PlayerJoinedRoomEvent(room)
    room.broadcastGameFlowEvent(lobby, playerJoinedRoomEvent, jsonObj.playerId)
    if (room.isFull()) {
        lobby.markRoomAsFull(room)
        room.broadcastGameFlowEvent(lobby, new events.GameStartEvent(room))
    }
    return roomId
}
/**
 *  @function
 * @param  {Lobby} lobby A Lobby is where all the rooms and the players' connections are stored 
 * @param  {string} roomId unique room id assigned on room creation, the id is generated using uuid() module
 * @param  {string} playerId unique player id assigned once the connection is established using uuid package
 */
function exitRoom(lobby, roomId, playerId) {
    var room = lobby.rooms.get(roomId)
    if (room === undefined) {
        console.log('exitRoom failed, room not found')
        return false
    }
    var playerRemoved = room.removePlayer(playerId)
    if (playerRemoved === false) {
        console.log('exitRoom failed, player not found')
        return false
    }
    if (room.isEmpty()) {
        console.log('Deleting room, since there is no players left in the room')
        lobby.removeRoom(roomId)
    }
    else {
        // add room to availableRooms list
        // remove the room from fullRooms list
        if (room.roomMembers.length < room.maxPlayersPerRoom) {
            lobby.availableRooms.set(room.roomId, room)
            lobby.fullRooms.delete(room.roomId)
        }
        //Notify remaining room members that a player left the room
        room.broadcastGameFlowEvent(lobby, new events.RoomMemberLeftEvent(playerId))
    }
    //Notify the player that they left the room
    var connection = lobby.getPlayerConnection(playerId)
    connection.send(new events.NotificationEvent('left-room').convertToJSONString())
    return true
}

function getLobbyStats(lobby) {
    const statsEmitter = require('../server').statsEmitter
    var stats = {}
    stats.maxRoomsPerLobby = lobby.MAX_ROOMS_PER_LOBBY
    stats.numFullRooms = lobby.fullRooms.size
    stats.numAvailableRooms = lobby.availableRooms.size
    stats.membersInAvailableRooms = 0
    stats.membersInFullRooms = 0
    if (lobby.availableRooms.size > 0) {
        lobby.availableRooms.forEach((value) => { stats.membersInAvailableRooms += value.roomMembers.length })
    }
    if (lobby.fullRooms.size > 0) {
        lobby.fullRooms.forEach((value) => { stats.membersInFullRooms += value.roomMembers.length })
    }
    stats.numOfConnectedClients = Object.keys(lobby.connectedClients).length
    stats.membersStillInLobby = (stats.numOfConnectedClients - (stats.membersInAvailableRooms + stats.membersInFullRooms))
    statsEmitter.emit('updateStats', stats)
}

module.exports.util = {
    joinOrCreateRoom,
    createRoom,
    joinRoom,
    exitRoom,
    getLobbyStats
}
