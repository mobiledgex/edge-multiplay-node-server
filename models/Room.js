const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
/**
 * Class representing a Room.
 * 
 */
class Room {
    /**
     * @constructor
     * @param  {string} roomId unique room id assigned on room creation, the id is generated using uuid() module
     * @param  {Array.<Player>} roomMembers array of players in the room
     * @param  {integer} maxPlayersPerRoom maximum players per room, must be greater than 1
     */
    constructor(roomIndex, roomMembers, maxPlayersPerRoom) {
        this.roomIndex = roomIndex
        this.roomId =  uuidv4()
        this.roomMembers = roomMembers
        this.maxPlayersPerRoom = maxPlayersPerRoom
    }
    /**
     * @param  {Player} player Player object, representing the player to be added to the room
     */
    addPlayer(player) {
        this.roomMembers.push(player)
        var udpPort = 5000 + (this.roomIndex*10) + player.playerIndex
        player.setPlayerUDPPort(udpPort)
    }
    /**
     * @param  {string} playerId unique player id assigned once the connection is established using uuid package
     */
    removePlayer(playerId) {
        this.roomMembers.forEach((roomMember, index, object) => {
            if (roomMember.playerId === playerId) {
                object.splice(index, 1)
            }
        })
    }
    isFull() {
        return this.roomMembers.length === this.maxPlayersPerRoom
    }
    isEmpty() {
        return this.roomMembers.length === 0
    }
    /**
     * @param  {Lobby} Lobby Lobby object, A Lobby is where all the rooms and the players' connections are stored , Think of a Lobby as the place where all the players hangout before they are matched to a room
     * @param  {Event} Event Event object, representing the event to be broadcasted from the sender to the sender's room
     * @param  {string} senderId the playerId of the sender, a playerId is a unique player id assigned once the connection is established using uuid package
     */
    broadcastGameFlowEvent(Lobby, Event, senderId) {
        //no overloading in JS
        if (typeof senderId !== "undefined") {
            this.roomMembers.forEach(player => {
                if (senderId != player.playerId) {
                    var playerConnection = Lobby.getPlayerConnection(player.playerId)
                    if (playerConnection !== undefined && playerConnection.readyState === WebSocket.OPEN) {
                        playerConnection.send(Event.convertToJSONString())
                    }
                }
            })
        }
        else {
            this.roomMembers.forEach(player => {
                var playerConnection = Lobby.getPlayerConnection(player.playerId)
                if (playerConnection !== undefined && playerConnection.readyState === WebSocket.OPEN) {
                    playerConnection.send(Event.convertToJSONString())
                }
            })
        }
    }
    /**
     * @param  {Lobby} Lobby Lobby object, A Lobby is where all the rooms and the players' connections are stored , Think of a Lobby as the place where all the players hangout before they are matched to a room
     * @param  {GamePlayEvent} gamePlayEvent GamePlayEvent object, representing the gamePlayEvent to be broadcasted from the sender to the sender's room
     * @param  {string} senderId the playerId of the sender, a playerId is a unique player id assigned once the connection is established using uuid package
     */
    broadcastGamePlayEvent(Lobby, gamePlayEvent, senderId) {
        this.roomMembers.forEach(player => {
            if (senderId != player.playerId) {
                var playerConnection = Lobby.getPlayerConnection(player.playerId)
                if (playerConnection !== undefined && playerConnection.readyState === WebSocket.OPEN) {
                    playerConnection.send(JSON.stringify(gamePlayEvent))
                }
            }
        })
    }
}
module.exports.Room = Room