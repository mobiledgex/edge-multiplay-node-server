/**
 *  @license
 *  Copyright 2018-2021 MobiledgeX, Inc. All rights and licenses reserved.
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

const http = require("http");
const WebSocket = require("ws");
const EventEmitter = require("events");
const config = require("./config");
const server = http.createServer();
const wsServer = new WebSocket.Server({ noServer: true });
const dgram = require("dgram");
const udpServer = dgram.createSocket("udp4");
const Lobby = require("./models/Lobby").Lobby;
const UDPClient = require("./models/UDPClient").UDPClient;
const util = require("./util/util").util;
const express = require("express");
const ehbs = require("express-handlebars");
const path = require("path");
const { Events } = require("./models/Events");
const app = new express();
const statsServer = require("http").createServer(app);
const wsStatsServer = new WebSocket.Server({ server: statsServer });
const statsEmitter = new EventEmitter();

if (require.main === module) {
  //the script runs directly
  app.use(express.static(path.join(__dirname, "public")));
  app.set("views", path.join(__dirname, "views"));
  app.engine("handlebars", ehbs({ defaultLayout: "main" }));
} else {
  // the script runs as a module
  try {
    // edge-multiplay is used as npm mpdule
    var pathToModule = require.resolve("edge-multiplay");
  } catch (err) {
    // edge-multiplay is used as docker image or from the repo
    var pathToModule = require.resolve("./server.js");
  }
  pathToModule = path.resolve(pathToModule, "..");
  app.use(express.static(path.join(pathToModule, "public")));
  app.set("views", path.join(pathToModule, "views"));
  app.engine(
    ".handlebars",
    ehbs({
      defaultLayout: "main",
      extname: ".handlebars",
      layoutsDir: path.join(pathToModule, "views/layouts"),
      partialsDir: path.join(pathToModule, "views"),
    })
  );
  app.set("view engine", ".handlebars");
}
const MAX_ROOMS_PER_LOBBY = 10;

let lobby = new Lobby(MAX_ROOMS_PER_LOBBY);

function startEdgeMultiplay () {
  const TCP_PORT = config.wsPort;
  const UDP_PORT = config.udpPort;
  const STATS_PORT = config.statsPort;
  server.on("upgrade", function upgrade (request, socket, head) {
    const baseURL = "ws://" + request.headers.host + "/";
    const parsedUrl = new URL(request.url, baseURL);
    const pathName = parsedUrl.pathname;
    var connection = {};
    connection.request = request;
    connection.socket = socket;
    connection.head = head;
    wsServer.emit("newConnection", pathName, connection);
  });

  wsServer.on("connection", function connection (ws, request) {
    console.log("num of rooms in the Lobby : " + lobby.rooms.size);
    console.log("player Connected");
    let playerKey = request.headers["sec-websocket-key"];
    let playerId = lobby.addPlayer(playerKey, ws);
    let roomId = "";

    console.log(`sending registerEvent to client`);
    ws.send(
      new Events.RegisterEvent(playerId, playerKey).convertToJSONString()
    );
    util.getLobbyStats(lobby);
    ws.on("message", function (msgStr) {
      try {
        jsonObj = JSON.parse(msgStr);
        switch (jsonObj.type) {
          case "JoinOrCreateRoom":
            console.log(
              "JoinOrCreateRoom Request received from client %o",
              jsonObj
            );
            roomId = util.joinOrCreateRoom(
              lobby,
              jsonObj.playerId,
              jsonObj.playerName,
              jsonObj.playerAvatar,
              jsonObj.maxPlayersPerRoom,
              jsonObj.playerTags,
              jsonObj.minPlayersToStartGame,
            );
            if (roomId !== undefined) {
              util.getLobbyStats(lobby);
            }
            break;
          case "GetRooms":
            console.log("GetRooms Request received from client %o", jsonObj);
            var connection = lobby.getPlayerConnection(playerId);
            var roomsArray = Array.from(lobby.rooms, ([, room]) => room);
            var roomsListEvent = new Events.RoomsListEvent(
              roomsArray
            ).convertToJSONString();
            connection.send(roomsListEvent);
            break;
          case "GetAvailableRooms":
            console.log(
              "GetAvailableRooms Request received from client %o",
              jsonObj
            );
            var connection = lobby.getPlayerConnection(playerId);
            var availableRoomsArray = Array.from(
              lobby.availableRooms,
              ([, room]) => room
            );
            var availableRoomsListEvent = new Events.AvailableRoomsListEvent(
              availableRoomsArray
            ).convertToJSONString();
            connection.send(availableRoomsListEvent);
            break;
          case "CreateRoom":
            console.log("CreateRoom Request received from client %o", jsonObj);
            roomId = util.createRoom(
              lobby,
              jsonObj.playerId,
              jsonObj.playerName,
              jsonObj.playerAvatar,
              jsonObj.maxPlayersPerRoom,
              jsonObj.playerTags,
              jsonObj.minPlayersToStartGame,
            );
            if (roomId !== undefined) {
              util.getLobbyStats(lobby);
            }
            break;
          case "JoinRoom":
            console.log("JoinRoom Request received from client %o", jsonObj);
            roomId = util.joinRoom(
              lobby,
              jsonObj.roomId,
              jsonObj.playerId,
              jsonObj.playerName,
              jsonObj.playerAvatar,
              jsonObj.playerTags
            );
            if (roomId !== undefined) {
              util.getLobbyStats(lobby);
            }
            break;
          case "ExitRoom":
            console.log("ExitRoom Request received from client %o", jsonObj);
            exitRoomSuccess = util.exitRoom(
              lobby,
              jsonObj.roomId,
              jsonObj.playerId
            );
            if (exitRoomSuccess === true) {
              util.getLobbyStats(lobby);
            }
            break;
          case "GamePlayEvent":
            var room = lobby.rooms.get(jsonObj.roomId);
            if (room !== undefined) {
              room.broadcastGamePlayEvent(lobby, jsonObj);
            }
            break;
          default:
            console.log(
              "Unknown msg Received from client with type " + jsonObj.type
            );
            break;
        }
      } catch (err) {
        ws.send(
          new Events.NotificationEvent("parsing-error").convertToJSONString()
        );
        console.log("Error parsing received message \n" + err);
      }
    });

    ws.on("error", (err) => {
      console.log(`WebSocket Server error : ${err}`);
    });

    ws.on("close", () => {
      console.log(`member left, member uuid : ${playerId}, roomId : ${roomId}`);
      var roomsUpdatedNotification = new Events.NotificationEvent("rooms-updated");
      lobby.notifyLobbyMembers(roomsUpdatedNotification);
      // remove member from room
      var room = lobby.rooms.get(roomId);
      // remove player connection
      lobby.removePlayer(playerId);
      if (room === undefined) {
        util.getLobbyStats(lobby);
        return;
      }
      room.removePlayer(playerId);
      // delete room if empty
      if (room.isEmpty()) {
        lobby.removeRoom(roomId);
        util.getLobbyStats(lobby);
        return;
      }
      lobby.fullRooms.delete(roomId);
      lobby.availableRooms.set(roomId, room);
      // if room is not empty, notify other roomMembers that a player left
      room.broadcastGameFlowEvent(
        lobby,
        new Events.RoomMemberLeftEvent(playerId)
      );
      util.getLobbyStats(lobby);
      return;
    });
  });

  udpServer.on("error", (err) => {
    console.log(`UDP server error:\n${err.stack}`);
    udpServer.close();
  });

  udpServer.on("message", (gameplayEventBinary, senderInfo) => {
    try {
      var gameplayEventStr = new Buffer.from(gameplayEventBinary).toString();
      var jsonObj = JSON.parse(gameplayEventStr);
      if (jsonObj instanceof Events.GamePlayEvent === false) {
        console.log("Received unkonw event", jsonObj);
        console.log("Received unkonw event", Events.GamePlayEvent);
        throw new Error(`Can't parse udp message, UDP server is allowed to receive GamePlayEvents only but received ${{ jsonObj }}`);
      }
      var roomId = jsonObj.roomId;
      var senderId = jsonObj.senderId;
      var room = lobby.rooms.get(roomId);
      if (room.udpConnections.get(senderId) !== undefined) {
        room.udpConnections.forEach((udpClient) => {
          if (senderId !== udpClient.playerId) {
            udpServer.send(
              gameplayEventBinary,
              0,
              gameplayEventBinary.length,
              udpClient.port,
              udpClient.address
            );
          }
        });
      } else {
        var player = room.roomMembers.find(
          (player) => player.playerId === senderId
        );
        if (player !== undefined) {
          room.udpConnections.set(
            senderId,
            new UDPClient(senderInfo.address, senderInfo.port)
          );
          room.udpConnections.forEach((udpClient) => {
            if (senderId !== udpClient.playerId) {
              udpServer.send(
                gameplayEventBinary,
                0,
                gameplayEventBinary.length,
                udpClient.port,
                udpClient.address
              );
            }
          });
        }
      }
    } catch (e) {
      console.log("error parsing gamePlayEvent \n" + e);
    }
  });

  udpServer.on("listening", () => {
    const udp_address = udpServer.address();
    console.log(`UDP server listening on ${udp_address.port}`);
  });

  udpServer.bind(UDP_PORT);

  server.listen(TCP_PORT, () => {
    const address = server.address();
    console.log(`WebSocket is listening on ${address.port}`);
  });

  statsServer.listen(STATS_PORT, () => {
    console.log(`Stats server listening on ${STATS_PORT}`);
  });

  wsStatsServer.on("connection", () => {
    setImmediate(() => {
      util.getLobbyStats(lobby);
    });
  });

  app.get("/", (_req, res) => {
    res.render("index", {
      layout: "main",
    });
  });

  statsEmitter.on("updateStats", broadcastStats);
}

function broadcastStats (stats) {
  wsStatsServer.clients.forEach((client) => {
    var statsStr = JSON.stringify(stats);
    client.send(statsStr);
  });
}

/**
 * Adds connected client to the lobby after being authenticated
 * @param  {Object} connection object contains the request object, socket object and headers object.
 */
function addToLobby (connection) {
  var { request, socket, head } = connection;
  wsServer.handleUpgrade(request, socket, head, function done (ws) {
    wsServer.emit("connection", ws, request);
  });
}

/**
 * Rejects connected client access to the lobby due to authentication failure
 * @param  {Object} connection object contains the request object, socket object and headers object.
 */
function rejectConnection (connection) {
  var { socket } = connection;
  console.log("destroying connection");
  socket.destroy();
}

//create a server object:
module.exports = {
  statsEmitter,
  wsServer,
  udpServer,
  lobby,
  addToLobby,
  rejectConnection,
  config,
  startEdgeMultiplay,
};
