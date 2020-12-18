/**
 *  @license
 *  Copyright 2018-2020 MobiledgeX, Inc. All rights and licenses reserved.
 *  MobiledgeX, Inc. 156 2nd Street #408, San Francisco, CA 94105
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License")
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
*/

/**
 * @fileOverview server.js is where the server logic resides, where the websocket and udp servers are being instantiated
 * @module server
 * @requires http
 * @requires WebSocket
 * @requires url
 * @requires dgram
 * 
 */

const http = require('http')
const WebSocket = require('ws')
const url = require('url')
const server = http.createServer()
const wsServer = new WebSocket.Server({ noServer: true })
const dgram = require('dgram')
const udpServer = dgram.createSocket('udp4')
const Lobby = require('./models/Lobby').Lobby
const UDPClient = require('./models/UDPClient').UDPClient
const events = require('./models/Events').Events
const util = require('./util/util').util
const MAX_ROOMS_PER_LOBBY = 4 // Change to the desired maximum rooms per lobby based on your number of rooms members per room & the app instance flavor
let lobby = new Lobby(MAX_ROOMS_PER_LOBBY)

server.on('upgrade', function upgrade(request, socket, head) {
    var parsedUrl = url.parse(request.url, true, true)
    const pathName = parsedUrl.pathname
    if (pathName === '/') {
        wsServer.handleUpgrade(request, socket, head, function done(ws) {
            wsServer.emit('connection', ws, request)
        })
    } else {
        socket.destroy()
    }
})

wsServer.on('connection', function connection(ws, request) {
    console.log('num of rooms in the Lobby : ' + lobby.rooms.length)
    console.log('player Connected')

    let playerKey = request.headers['sec-websocket-key']
    let playerId = lobby.addPlayer(playerKey, ws)
    let roomId = ''

    console.log(`sending registerEvent to client`)
    ws.send(new events.RegisterEvent(playerId, playerKey).convertToJSONString())

    ws.on('message', function (msgStr) {
        jsonObj = JSON.parse(msgStr)
        switch (jsonObj.type) {
            case 'JoinOrCreateRoom':
                console.log('JoinOrCreateRoom Request received from client %o', jsonObj)
                roomId = util.joinOrCreateRoom(lobby, jsonObj.playerId, jsonObj.playerName, jsonObj.playerAvatar, jsonObj.maxPlayersPerRoom)
                break
            case 'GetRooms':
                console.log('GetRooms Request received from client %o', jsonObj)
                var connection = lobby.getPlayerConnection(playerId)
                connection.send(new events.RoomsListEvent(lobby.rooms).convertToJSONString())
                break
            case 'GetAvailableRooms':
                console.log('GetAvailableRooms Request received from client %o', jsonObj)
                var connection = lobby.getPlayerConnection(playerId)
                connection.send(new events.AvailableRoomsListEvent(lobby.availableRooms).convertToJSONString())
                break
            case 'CreateRoom':
                console.log('CreateRoom Request received from client %o', jsonObj)
                roomId = util.createRoom(lobby, jsonObj.playerId, jsonObj.playerName, jsonObj.playerAvatar, jsonObj.maxPlayersPerRoom)
                break
            case 'JoinRoom':
                console.log('JoinRoom Request received from client %o', jsonObj)
                roomId = util.joinRoom(lobby, jsonObj.roomId, jsonObj.playerId, jsonObj.playerName, jsonObj.playerAvatar)
                break
            case 'ExitRoom':
                console.log('ExitRoom Request received from client %o', jsonObj)
                roomId = util.exitRoom(lobby, jsonObj.roomId, jsonObj.playerId)
                break
            case 'GamePlayEvent':
                var room = lobby.getRoomById(jsonObj.roomId)
                if (room !== undefined) {
                    room.broadcastGamePlayEvent(lobby, jsonObj)
                }
                break
            default:
                console.log('Unknown msg Received from client with type ' + jsonObj.type)
                break
        }
    })

    ws.on('error', (err) => {
        console.log(`WebSocket Server error : ${err}`)
    })

    ws.on('close', function (code) {
        console.log(`client closed ,close code:  ${code}`)
        console.log(`member left, member uuid : ${playerId}, roomId : ${roomId}`)
        // remove member from room
        var room = lobby.getRoomById(roomId)
        if (room === undefined) {
            return
        }
        room.removePlayer(playerId)
        // remove player connection 
        lobby.removePlayer(playerId)
        // delete room if empty
        if (room.isEmpty()) {
            lobby.removeRoom(roomId)
            return
        }
        // if room is not empty, notify other roomMembers that a player left
        room.broadcastGameFlowEvent(lobby, new events.RoomMemberLeftEvent(playerId))
        return
    })
})

udpServer.on('error', (err) => {
    console.log(`UDP server error:\n${err.stack}`)
    udpServer.close()
})

udpServer.on('message', (gameplayEventBinary, senderInfo) => {
    var gameplayEventStr = new Buffer.from(gameplayEventBinary).toString()
    var jsonObj = JSON.parse(gameplayEventStr)
    var roomId = jsonObj.roomId
    var playerId = jsonObj.senderId
    var client = lobby.udpConnectionsPerRoom[roomId].find(client => client.playerId === playerId)
    if(client === undefined){
        lobby.udpConnectionsPerRoom[roomId].push(new UDPClient(senderInfo.address, senderInfo.port, playerId))
    }
    var udpClients = lobby.udpConnectionsPerRoom[roomId]
    if (udpClients !== undefined){
        udpClients.forEach(udpClient => {
            if (playerId !== udpClient.playerId) {
                udpServer.send(gameplayEventBinary, 0, gameplayEventBinary.length, udpClient.port, udpClient.address)
            }
        })
    }
})

udpServer.on('listening', () => {
    const udp_address = udpServer.address()
    console.log(`UDP server listening on  ${udp_address.address}:${udp_address.port}`)
})

udpServer.bind(5000)

server.listen(3000, () => {
    const address = server.address()
    console.log(`WebSocket is listening on ${address.address}:${address.port}`)
})
