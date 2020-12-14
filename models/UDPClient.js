/**
 * Class representing a UDPClient.
 * 
 */
class UDPClient {
    /**
     * @constructor
     * @param  {string} address udp address
     * @param  {integer} port udp port
     * @param {string} playerId unique player id assigned once the connection is established using uuid package
     */
    constructor(address, port, playerId) {
        this.address = address
        this.port = port
        this.playerId = playerId
    }
}
module.exports.UDPClient = UDPClient