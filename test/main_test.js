const expect = require("chai").expect;
const WebSocket = require("ws");
const client_util = require("../util/client_util").client_util;
const { Events } = require('../models/Events');
const dgram = require("dgram");
const edgeMultiplay = require("../app.js")();
let roomId = "";
edgeMultiplay.wsServer.on("newConnection", (path, connection) => {
  edgeMultiplay.addToLobby(connection);
});

describe("Default Tests", function () {
  this.timeout(5000);

  it("Test create room", (done) => {
    var ws = new WebSocket("ws://localhost:3000");
    ws.onopen = function () {
      console.log("client 1 is open");
    };
    ws.onmessage = function (e) {
      jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          expect(jsonObj.playerId).to.be.string;
          var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
          expect(playerKey).not.undefined;
          var playerConnection =
            edgeMultiplay.lobby.connectedClients[playerKey];
          expect(playerConnection.address).equal(ws.address);
          expect(playerConnection.port).equal(ws.port);

          // create room
          createReq = client_util.createRoomRequest(
            "Player1",
            jsonObj.playerId,
            0,
            2
          );
          ws.send(JSON.stringify(createReq));
          break;
        case "notification":
          expect(jsonObj.notificationText === "new-room-created-in-lobby" ||
            jsonObj.notificationText === "rooms-updated"
          ).equal(true);
          break;

        case "roomCreated":
          roomId = jsonObj.room.roomId;
          expect(roomId).to.be.string;
          expect(edgeMultiplay.lobby.rooms.size).equal(1);
          expect(edgeMultiplay.lobby.availableRooms.size).equal(1);
          expect(edgeMultiplay.lobby.fullRooms.size).equal(0);
          // Get rooms list
          let getRoomsRequest = {};
          getRoomsRequest.type = "GetRooms";
          ws.send(JSON.stringify(getRoomsRequest));
          break;
        case "roomsList":
          expect(jsonObj.rooms.length).equal(1);
          let getAvailableRoomsRequest = {};
          getAvailableRoomsRequest.type = "GetAvailableRooms";
          ws.send(JSON.stringify(getAvailableRoomsRequest));
          break;
        case "availableRoomsList":
          expect(jsonObj.availableRooms.length).equal(1);
          done();
          break;
      }
    };
  });
  it("Test join, joinOrCreateRoom and exit room", (done) => {
    var player2Id;
    var ws2 = new WebSocket("ws://localhost:3000");
    ws2.onopen = function () {
      console.log("client 2 is open");
    };
    ws2.onmessage = function (e) {
      jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          expect(jsonObj.playerId).to.be.string;
          var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
          expect(playerKey).not.undefined;
          var playerConnection =
            edgeMultiplay.lobby.connectedClients[playerKey];
          expect(playerConnection.address).equal(ws2.address);
          expect(playerConnection.port).equal(ws2.port);
          // join room
          player2Id = jsonObj.playerId;
          joinReq = client_util.joinRoomRequest(
            roomId,
            "Player2",
            player2Id,
            0
          );
          ws2.send(JSON.stringify(joinReq));
          break;
        case "roomJoin":
          expect(edgeMultiplay.lobby.rooms.size).equal(1);
          expect(edgeMultiplay.lobby.availableRooms.size).equal(0);
          expect(edgeMultiplay.lobby.fullRooms.size).equal(1);
          expect(jsonObj.room.roomMembers.length).equal(2);
          if (jsonObj.room.roomMembers[1].playerName === "Player2-repeat") {
            ws2.close();
            setTimeout(() => {
              done();
            }, 100);
          }
          else {
            var exitRoomReq = {};
            exitRoomReq.type = "ExitRoom";
            exitRoomReq.roomId = roomId;
            exitRoomReq.playerId = player2Id;
            ws2.send(JSON.stringify(exitRoomReq));
          }
          break;
        case "notification":
          expect(jsonObj.notificationText === "rooms-updated" ||
            jsonObj.notificationText === "left-room").equal(true);
          if (jsonObj.notificationText === "left-room") {
            expect(edgeMultiplay.lobby.rooms.size).equal(1);
            expect(edgeMultiplay.lobby.availableRooms.size).equal(1);
            expect(edgeMultiplay.lobby.fullRooms.size).equal(0);
            var joinRoomAgain = client_util.joinOrCreateRoomRequest(
              "Player2-repeat",
              player2Id,
              0,
              2
            );
            ws2.send(JSON.stringify(joinRoomAgain));
          }
          break;
      }
    };
  });
  it("Test GamePlayEvents", (done) => {
    var player3Id;
    var serverNotifications = [];
    roomId = "";
    expect(edgeMultiplay.lobby.rooms.size).equal(1);
    expect(edgeMultiplay.lobby.availableRooms.size).equal(1);
    expect(edgeMultiplay.lobby.fullRooms.size).equal(0);
    var ws3 = new WebSocket("ws://localhost:3000");
    ws3.onopen = function () {
      console.log("client 3 is open");
    };
    ws3.onmessage = function (e) {
      jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          var joinRoom = client_util.joinOrCreateRoomRequest(
            "Player2",
            jsonObj.playerId,
            0,
            2
          );
          player3Id = jsonObj.playerId;
          ws3.send(JSON.stringify(joinRoom));
          break;
        case "notification":
          serverNotifications.push(jsonObj);
          break;
        case "roomJoin":
          roomId = jsonObj.room.roomId;
          expect(edgeMultiplay.lobby.rooms.size).equal(1);
          expect(edgeMultiplay.lobby.availableRooms.size).equal(0);
          expect(edgeMultiplay.lobby.fullRooms.size).equal(1);
          expect(jsonObj.room.roomMembers.length).equal(2);
          if (jsonObj.room.gameStarted) {
            var gamePlayEvent = new Events.GamePlayEvent(
              roomId, player3Id, "testing", ["t", "e", "s", "t", "test"],
              [1, 2, 3, 5], [1.5, 2, 3, 5.5], [true, false, false, true]
            );
            gamePlayEventStr = JSON.stringify(gamePlayEvent);
            ws3.send(gamePlayEventStr);
            const message = Buffer.from(gamePlayEventStr);
            const udpClient = dgram.createSocket("udp4");
            udpClient.send(message, 5000, "localhost", (err) => {
            });
            var missingEventNameEvent = {
              type: "GamePlayEvent",
              roomId,
              senderId: player3Id,
            };
            missingEventNameEvent = JSON.stringify(missingEventNameEvent);
            ws3.send(missingEventNameEvent);

            var missingRoomIdEvent = {
              type: "GamePlayEvent",
              roomId,
              senderId: player3Id,
            };
            missingRoomIdEvent = JSON.stringify(missingRoomIdEvent);
            ws3.send(missingRoomIdEvent);

            var missingSenderIdEvent = {
              type: "GamePlayEvent",
              roomId,
            };
            missingSenderIdEvent = JSON.stringify(missingSenderIdEvent);
            ws3.send(missingSenderIdEvent);
          }
          break;
      }
    };
    setTimeout(() => {
      expect(serverNotifications.length).equal(4);
      expect(serverNotifications[0].notificationText).equal('rooms-updated');
      expect(serverNotifications[1].notificationText).equal('parsing-error');
      expect(serverNotifications[2].notificationText).equal('parsing-error');
      expect(serverNotifications[2].notificationText).equal('parsing-error');
      done();
    }, 100);
  });

  it("Refresh Lobby", (done) => {
    edgeMultiplay.wsServer.clients.forEach((client) => {
      client.close();
    });
    setTimeout(() => {
      expect(edgeMultiplay.lobby.rooms.size).equal(0);
      expect(Object.keys(edgeMultiplay.lobby.connectedClients).length).equal(0);
      expect(edgeMultiplay.lobby.fullRooms.size).equal(0);
      expect(edgeMultiplay.lobby.availableRooms.size).equal(0);
      done();
    }, 300);
  });
});

describe("Test start game with min players and allow other players to join till the room is full", function () {
  this.timeout(5000);
  let player1Connection, player2Connection, player3Connection, player4Connection,
    player2Id, player4Id;

  it("Launch First Player in the room", (done) => {
    player1Connection = new WebSocket("ws://localhost:3000");
    player1Connection.onopen = function () {
      console.log("client 1 is open");
    };
    player1Connection.onmessage = function (e) {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          expect(jsonObj.playerId).to.be.string;
          var createReq = client_util.createRoomRequest(
            "Player1",
            jsonObj.playerId,
            0,
            3,
            2,
          );
          player1Connection.send(JSON.stringify(createReq));
          break;
        case "roomCreated":
          roomId = jsonObj.room.roomId;
          expect(roomId).to.be.string;
          done();
          break;
      }
    };
  });

  it("Launch 2nd Player in the room", (done) => {

    player2Connection = new WebSocket("ws://localhost:3000");
    player2Connection.onopen = function () {
      console.log("client 2 is open");
    };
    player2Connection.onmessage = function (e) {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          expect(jsonObj.playerId).to.be.string;
          player2Id = jsonObj.playerId;
          var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
          expect(playerKey).not.undefined;
          var joinRoomReq = client_util.joinRoomRequest(
            roomId,
            "Player2",
            jsonObj.playerId,
            0,
          );
          player2Connection.send(JSON.stringify(joinRoomReq));
          break;
        case "roomJoin":
          expect(jsonObj.room.roomMembers.length).equal(2);
          if (jsonObj.room.roomMembers.length === jsonObj.room.minPlayersToStartGame) {
            expect(jsonObj.room.roomMembers.length).equal(2);
            expect(jsonObj.room.roomMembers[0].playerName).equal("Player1");
            expect(jsonObj.room.gameStarted).equal(true);
            done();
          }
          break;
      }
    };
  });

  it("Launch 3rd Player in the room", (done) => {
    player3Connection = new WebSocket("ws://localhost:3000");
    player3Connection.onopen = () => {
      console.log("client 3 is open");
    };
    player3Connection.onmessage = (e) => {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          var joinRoomReq = client_util.joinRoomRequest(
            roomId,
            "Player3",
            jsonObj.playerId,
            0,
          );
          player3Connection.send(JSON.stringify(joinRoomReq));
          break;
        case "roomJoin":
          expect(jsonObj.room.roomMembers.length).equal(3);
          expect(jsonObj.room.gameStarted).equal(true);
          break;
      }
    };
    player2Connection.onmessage = (e) => {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "playerJoinedRoom":
          expect(jsonObj.room.roomMembers.length).equal(3);
          expect(jsonObj.room.roomMembers[2].playerName).equal("Player3");
          done();
          break;
      }
    };
  });

  it("Launch 4th Player trying to join room, should fail because max players/room = 3", (done) => {
    player4Connection = new WebSocket("ws://localhost:3000");
    player4Connection.onopen = () => {
      console.log("client 4 is open");
    };

    player4Connection.onmessage = function (e) {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          player4Id = jsonObj.playerId;
          var joinRoomReq = client_util.joinRoomRequest(
            roomId,
            "Player4",
            jsonObj.playerId,
            0,
          );
          player4Connection.send(JSON.stringify(joinRoomReq));
          break;
        case "notification":
          expect(jsonObj.notificationText
          ).equal("join-room-faliure");
          done();
          break;
      }
    };

  });

  it("Player2 will leave the room", (done) => {
    player4Connection.removeAllListeners('message');
    var exitRoomReq = client_util.exitRoomRequest(roomId, player2Id);
    player2Connection.send(JSON.stringify(exitRoomReq));
    let serverEvents = [];
    player2Connection.onmessage = (e) => {
      var jsonObj = JSON.parse(e.data);
      serverEvents.push(jsonObj);
    };
    setTimeout(() => {
      console.log({ serverEvents });
      expect(serverEvents[0].type).equal("notification");
      expect(serverEvents[0].notificationText).equal("left-room");
      expect(serverEvents[1].type).equal("notification");
      expect(serverEvents[1].notificationText).equal("rooms-updated");
      done();
    }, 50);
  });

  it("Player4 will try to join the room again", (done) => {
    var joinRoomReq = client_util.joinRoomRequest(
      roomId,
      "Player4",
      player4Id,
      0,
    );
    player4Connection.send(JSON.stringify(joinRoomReq));
    player4Connection.onmessage = (e) => {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "roomJoin":
          expect(jsonObj.room.roomMembers.length).equal(3);
          expect(jsonObj.room.roomMembers[0].playerName).equal("Player1");
          expect(jsonObj.room.roomMembers[1].playerName).equal("Player3");
          expect(jsonObj.room.roomMembers[2].playerName).equal("Player4");
          done();
          break;
      }
    };
  });
});
describe("Close server", function () {
  this.timeout(5000);
  it("Clean Up", (done) => {
    edgeMultiplay.wsServer.clients.forEach((client) => {
      client.close();
    });
    edgeMultiplay.closeServer();
    setTimeout(() => {
      done();
    }, 2000);
  });
});
