
/**
 * Class representing the Player.
 * 
 */
class Player {
    /**
     * @constructor
     * @param  {string} playerId unique player id assigned once the connection is established using uuid package
     * @param  {string} playerName name of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
     * @param  {integer} playerAvatar the avatar of the player sat by the client on JoinRoomRequest or the CreateRoomRequest
     * @param  {integer} playerIndex the order of the player in the room
     */
    constructor( playerId, playerName, playerAvatar, playerIndex) {
        this.playerId = playerId
        this.playerName = playerName
        this.playerAvatar = playerAvatar
        this.playerIndex = playerIndex
    }
}

module.exports.Player = Player