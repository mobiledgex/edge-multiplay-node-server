/**
 * Class representing a UDPClient.
 * 
 */
class UDPClient {
    /**
     * @constructor
     * @param  {string} address udp address
     * @param  {integer} port udp port
     */
    constructor(address, port) {
        this.address = address
        this.port = port
    }
}
module.exports.UDPClient = UDPClient