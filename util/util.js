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
 */
function joinOrCreateRoom(lobby, playerId, playerName, playerAvatar, maxPlayersPerRoom) {
    if (lobby.availableRooms.length === 0) {
        return createRoom(lobby, playerId, playerName, playerAvatar, maxPlayersPerRoom)
    } else {
        return joinRoom(lobby, lobby.availableRooms[0].roomId, playerId, playerName, playerAvatar)
    }
}
/**
 * @function
 * @param  {Lobby} lobby A Lobby is where all the rooms and the players' connections are stored 
 * @param  {string} playerId unique player id assigned once the connection is established using uuid package
 * @param  {string} playerName name of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} playerAvatar the avatar of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
 * @param  {integer} maxPlayersPerRoom maximum players per room, must be greater than 1
 */
function createRoom(lobby, playerId, playerName, playerAvatar, maxPlayersPerRoom) {
    let connection = lobby.getPlayerConnection(playerId)
    if (connection === undefined){
        console.log('cannot find player connection')
        return
    }
  
    if (lobby.rooms.length === lobby.MAX_ROOMS_PER_LOBBY) {
        connection.send(new events.NotificationEvent('create-room-faliure').convertToJSONString())
        console.log('Lobby reached maximum rooms threshold, Create room request failed')
        return undefined
    }
    var newRoom = new Room(lobby.rooms.length, [], maxPlayersPerRoom)
    newRoom.addPlayer(new Player(playerId, playerName, playerAvatar, 0))
    lobby.addRoom(newRoom)
    var roomCreatedEvent = new events.RoomCreatedEvent(newRoom)
    connection.send(roomCreatedEvent.convertToJSONString())
    var NotificationEvent = new events.NotificationEvent('new-room-created-in-lobby')
    lobby.notifyLobbyMembers(NotificationEvent)
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
 */
function joinRoom(lobby, roomId, playerId, playerName, playerAvatar) {
    var connection = lobby.getPlayerConnection(playerId)
    if (lobby.availableRooms.length === 0) {
        connection.send(new events.NotificationEvent('join-room-faliure').convertToJSONString())
        return undefined
    }
    var room = lobby.getRoomById(roomId)
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
    var newPlayer = new Player(playerId, playerName, playerAvatar, room.roomMembers.length)
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
    var room = lobby.getRoomById(roomId)
    room.removePlayer(playerId)
    if (room.isEmpty()) {
        lobby.removeRoom(roomId)
        return undefined
    }
    //Notify the player that they left the room
    var connection = lobby.getPlayerConnection(playerId)
    connection.send(new events.NotificationEvent('left-room').convertToJSONString())

    //Notify remaining room members that a player left the room
    room.broadcastGameFlowEvent(lobby, new events.MemberLeftEvent(playerId))
    return undefined
}

module.exports.util = {
    joinOrCreateRoom,
    createRoom,
    joinRoom,
    exitRoom
}

