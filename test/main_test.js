const expect = require('chai').expect;
const WebSocket = require('ws');
const server = require('../app.js')
const client_util = require('../util/client_util').client_util
let roomId = ''
describe('room', () => {

  it('Test create room', (done) => {
    var ws = new WebSocket('ws://localhost:3000');
    ws.onopen = function () {
      console.log('client 1 is open')
    }
    ws.onmessage = function (e) {
      jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case 'register':
          expect(jsonObj.playerId).to.be.string
          var playerKey = server.edgeMultiplay.lobby.nameMap[jsonObj.playerId]
          expect(playerKey).not.undefined
          var playerConnection = server.edgeMultiplay.lobby.connectedClients[playerKey]
          expect(playerConnection.address).equal(ws.address)
          expect(playerConnection.port).equal(ws.port)

          // create room
          createReq = client_util.createRoomRequest('Player1', jsonObj.playerId, 0, 2);
          ws.send(JSON.stringify(createReq));
          break;
        case 'notification':
          expect(jsonObj.notificationText).equal('new-room-created-in-lobby')
          break

        case 'roomCreated':
          roomId = jsonObj.room.roomId
          expect(roomId).to.be.string
          expect(server.edgeMultiplay.lobby.rooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.availableRooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.fullRooms.size).equal(0)
          // Get rooms list
          let getRoomsRequest = {};
          getRoomsRequest.type = 'GetRooms';
          ws.send(JSON.stringify(getRoomsRequest));
          break;
        case 'roomsList':
          expect(jsonObj.rooms.length).equal(1)
          let getAvailableRoomsRequest = {};
          getAvailableRoomsRequest.type = 'GetAvailableRooms';
          ws.send(JSON.stringify(getAvailableRoomsRequest));
          break;
        case 'availableRoomsList':
          expect(jsonObj.availableRooms.length).equal(1)
          done()
          break;
      }
    }
  })
  it('Test join, joinOrCreateRoom and exit room', (done) => {
    var player2Id
    var ws2 = new WebSocket('ws://localhost:3000');
    ws2.onopen = function () {
      console.log('client 2 is open')
    }
    ws2.onmessage = function (e) {
      jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case 'register':
          expect(jsonObj.playerId).to.be.string
          var playerKey = server.edgeMultiplay.lobby.nameMap[jsonObj.playerId]
          expect(playerKey).not.undefined
          var playerConnection = server.edgeMultiplay.lobby.connectedClients[playerKey]
          expect(playerConnection.address).equal(ws2.address)
          expect(playerConnection.port).equal(ws2.port)
          expect(server.edgeMultiplay.lobby.rooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.availableRooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.fullRooms.size).equal(0)
          // join room
          player2Id = jsonObj.playerId
          joinReq = client_util.joinRoomRequest(roomId, 'Player2', player2Id, 0);
          ws2.send(JSON.stringify(joinReq));
          break;
        case 'roomJoin':
          expect(server.edgeMultiplay.lobby.rooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.availableRooms.size).equal(0)
          expect(server.edgeMultiplay.lobby.fullRooms.size).equal(1)
          expect(jsonObj.room.roomMembers.length).equal(2)
          if (jsonObj.room.roomMembers[1].playerName === 'Player2-repeat') {
            ws2.close()
            setTimeout(() => { done() }, 100);
          }
          break;
        case 'gameStart':
          var exitRoomReq = {}
          exitRoomReq.type = 'ExitRoom'
          exitRoomReq.roomId = roomId
          exitRoomReq.playerId = player2Id
          ws2.send(JSON.stringify(exitRoomReq));
          break
        case 'notification':
          expect(jsonObj.notificationText).equal('left-room')
          expect(server.edgeMultiplay.lobby.rooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.availableRooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.fullRooms.size).equal(0)
          var joinRoomAgain = client_util.joinOrCreateRoomRequest('Player2-repeat', player2Id, 0, 2)
          ws2.send(JSON.stringify(joinRoomAgain));
          break
      }
    }
  })

  it('Test GamePlayEvents', (done) => {
    var player3Id, roomId = ''

    expect(server.edgeMultiplay.lobby.rooms.size).equal(1)
    expect(server.edgeMultiplay.lobby.availableRooms.size).equal(1)
    expect(server.edgeMultiplay.lobby.fullRooms.size).equal(0)
    var ws3 = new WebSocket('ws://localhost:3000');
    ws3.onopen = function () {
      console.log('client 3 is open')
    }
    ws3.onmessage = function (e) {
      jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case 'register':
          var joinRoom = client_util.joinOrCreateRoomRequest('Player2', jsonObj.playerId, 0, 2)
          player3Id = jsonObj.playerId
          ws3.send(JSON.stringify(joinRoom));
          break;
        case 'roomJoin':
          roomId = jsonObj.room.roomId
          expect(server.edgeMultiplay.lobby.rooms.size).equal(1)
          expect(server.edgeMultiplay.lobby.availableRooms.size).equal(0)
          expect(server.edgeMultiplay.lobby.fullRooms.size).equal(1)
          expect(jsonObj.room.roomMembers.length).equal(2)
          break;
        case 'gameStart':
          var gamePlayEvent = {}
          gamePlayEvent.type = 'GamePlayEvent'
          gamePlayEvent.eventName = 'testing'
          gamePlayEvent.floatData = [1.5, 2, 3, 5.5]
          gamePlayEvent.intData = [1, 2, 3, 5]
          gamePlayEvent.stringData = ['t', 'e', 's', 't', 'test']
          gamePlayEvent.booleanData = [true, false, false, true]
          gamePlayEvent.roomId = roomId
          gamePlayEvent.senderId = player3Id
          gamePlayEventStr = JSON.stringify(gamePlayEvent)
          ws3.send(gamePlayEventStr);
          const dgram = require('dgram');
          const message = Buffer.from(gamePlayEventStr);
          const udpClient = dgram.createSocket('udp4');
          udpClient.send(message, 5000, 'localhost', (err) => {
            udpClient.close();
          });
          setTimeout(() => 
          { 
            expect(server.edgeMultiplay.lobby.rooms.get(roomId).udpConnections.size).equal(1) 
            done()
          }, 100);
          break
      }
    }
  })
})