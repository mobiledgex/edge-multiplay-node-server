const expect = require("chai").expect;
const WebSocket = require("ws");
const client_util = require("../util/client_util").client_util;
const { Events } = require('../models/Events');
const dgram = require("dgram");

describe("Default Tests", function () {
  this.timeout(5000);
  let roomId = "";
  const edgeMultiplay = require("../app.js")();
  edgeMultiplay.wsServer.on("newConnection", (path, connection) => {
    edgeMultiplay.addToLobby(connection);
  });
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
    var player3Id,
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
            done();
          }
          break;
      }
    };
  });

  it("Refresh Lobby", (done) => {
    expect(
      edgeMultiplay.lobby.rooms.get(roomId).udpConnections.size
    ).equal(1);
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
  it("Test start game with min players and allow other players to join till the room is full", (done) => {
    let player1Connection, player2Connection, player3Connection, player4Connection, lastServerEvent;
    player1Connection = new WebSocket("ws://localhost:3000");
    player1Connection.onopen = function () {
      console.log("client 1 is open");
    };
    player1Connection.onmessage = function (e) {
      var jsonObj = JSON.parse(e.data);
      switch (jsonObj.type) {
        case "register":
          expect(jsonObj.playerId).to.be.string;
          var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
          expect(playerKey).not.undefined;
          var playerConnection =
            edgeMultiplay.lobby.connectedClients[playerKey];
          expect(playerConnection.address).equal(player1Connection.address);
          expect(playerConnection.port).equal(player1Connection.port);
          // create room
          createReq = client_util.createRoomRequest(
            "Player1",
            jsonObj.playerId,
            0,
            3,
            2,
          );
          player1Connection.send(JSON.stringify(createReq));
          break;
        case "notification":
          expect(jsonObj.notificationText === "new-room-created-in-lobby" ||
            jsonObj.notificationText === "rooms-updated"
          ).equal(true);
          break;
        case "roomCreated":
          roomId = jsonObj.room.roomId;
          var room = jsonObj.room;
          console.log({ room });
          expect(roomId).to.be.string;
          break;
        case "gameStart":
          expect(jsonObj.room.roomMembers.length).equal(2);
          expect(jsonObj.room.roomMembers[1].playerName).equal('Player2');
          break;
      }
    };
    setTimeout(() => {
      player2Connection = new WebSocket("ws://localhost:3000");
      player2Connection.onopen = function () {
        console.log("client 2 is open");
      };
      player2Connection.onmessage = function (e) {
        var jsonObj = JSON.parse(e.data);
        switch (jsonObj.type) {
          case "register":
            expect(jsonObj.playerId).to.be.string;
            var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
            expect(playerKey).not.undefined;
            var playerConnection =
              edgeMultiplay.lobby.connectedClients[playerKey];
            expect(playerConnection.address).equal(player2Connection.address);
            expect(playerConnection.port).equal(player2Connection.port);

            // create room
            var joinRoomReq = client_util.joinRoomRequest(

              roomId,
              "Player2",
              jsonObj.playerId,
              0,
            );
            console.log({ joinRoomReq });
            player2Connection.send(JSON.stringify(joinRoomReq));
            break;
          case "roomJoin":
            expect(jsonObj.room.roomMembers.length).equal(2);

            break;
          case "gameStart":
            expect(jsonObj.room.roomMembers.length).equal(2);
            expect(jsonObj.room.roomMembers[0].playerName).equal("Player1");
            expect(jsonObj.room.gameStarted);
            break;
          case "playerJoinedRoom":
            expect(jsonObj.room.roomMembers.length).equal(3);
            expect(jsonObj.room.roomMembers[2].playerName).equal("Player3");
            break;
          case "GamePlayEvent":
            expect(jsonObj.stringData[stringData.length - 1]).equal("testing");
            break;
        }
      };
      player2Connection.onclose = (e) => {
        console.log(`player2Connection is closed`);
        expect(e.wasClean).equal(true);
      };
    }, 100);
    setTimeout(() => {
      player3Connection = new WebSocket("ws://localhost:3000");
      player3Connection.onopen = function () {
        console.log("client 3 is open");
      };
      player3Connection.onmessage = function (e) {
        var jsonObj = JSON.parse(e.data);
        switch (jsonObj.type) {
          case "register":
            expect(jsonObj.playerId).to.be.string;
            var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
            expect(playerKey).not.undefined;
            var playerConnection =
              edgeMultiplay.lobby.connectedClients[playerKey];
            expect(playerConnection.address).equal(player3Connection.address);
            expect(playerConnection.port).equal(player3Connection.port);

            // create room
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
          case "GamePlayEvent":
            expect(jsonObj.stringData[stringData.length - 1]).equal("testing");
            break;
        }
      };
    }, 200);
    setTimeout(() => {
      player4Connection = new WebSocket("ws://localhost:3000");
      player4Connection.onopen = function () {
        console.log("client 4 is open");
      };
      player4Connection.onmessage = function (e) {
        var jsonObj = JSON.parse(e.data);
        lastServerEvent = jsonObj;
        console.log({ jsonObj });
        switch (jsonObj.type) {
          case "register":
            expect(jsonObj.playerId).to.be.string;
            var playerKey = edgeMultiplay.lobby.nameMap[jsonObj.playerId];
            expect(playerKey).not.undefined;
            var playerConnection =
              edgeMultiplay.lobby.connectedClients[playerKey];
            expect(playerConnection.address).equal(player4Connection.address);
            expect(playerConnection.port).equal(player4Connection.port);
            // create room
            var joinRoomReq = client_util.joinRoomRequest(
              roomId,
              "Player4",
              jsonObj.playerId,
              0,
            );
            player4Connection.send(JSON.stringify(joinRoomReq));
            break;
          case "notification":
            expect(jsonObj.notificationText === "join-room-faliure" ||
              jsonObj.notificationText === "rooms-updated"
            ).equal(true);
            if (jsonObj.notificationText === "join-room-faliure") {
              player2Connection.close();
            }
            break;
          case "GamePlayEvent":
            expect(jsonObj.stringData[stringData.length - 1]).equal("testing");
            break;
        }
      };
    }, 300);
    setTimeout(() => {
      if (player4Connection !== undefined) {
        var joinRoomReq = client_util.joinRoomRequest(
          roomId,
          "Player4",
          jsonObj.playerId,
          0,
        );
        player4Connection.send(JSON.stringify(joinRoomReq));
        setTimeout(() => {
          expect(lastServerEvent.type).equal('roomJoin');
        }, 400);
      }
      else {
        console.error('player4Connection didnt start yet');
      }
    }, 500);
    setTimeout(() => {
      if (player1Connection !== undefined) {
        player1Connection.close();
      }
      if (player3Connection !== undefined) {
        player3Connection.close();
      }
      setTimeout(() => {
        var room = edgeMultiplay.lobby.rooms.get(roomId);
        expect(room.gameStarted).equal(false);
        done();
      }, 100);
    }, 600);
  });

  it("Clean Up", (done) => {
    edgeMultiplay.wsServer.clients.forEach((client) => {
      client.close();
    });
    edgeMultiplay.wsServer.close((error) => {
      if (error !== undefined) {
        console.log("Error closing the server, Error: " + error.toString());
      }
      done();
    });
  });
});
