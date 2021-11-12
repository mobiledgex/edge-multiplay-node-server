/**
 * Copyright 2018-2021 MobiledgeX, Inc. All rights and licenses reserved.
 * MobiledgeX, Inc. 156 2nd Street #408, San Francisco, CA 94105
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function createRoomRequest (
    playerName,
    playerId,
    playerAvatar,
    maxPlayersPerRoom,
    minPlayersToStartGame
) {
    let createReq = {};
    createReq.type = "CreateRoom";
    createReq.playerName = playerName;
    createReq.playerId = playerId;
    createReq.playerAvatar = playerAvatar;
    createReq.maxPlayersPerRoom = maxPlayersPerRoom;
    createReq.minPlayersToStartGame = minPlayersToStartGame;
    return createReq;
}

function joinOrCreateRoomRequest (
    playerName,
    playerId,
    playerAvatar,
    maxPlayersPerRoom,
    minPlayersToStartGame
) {
    let joinOrCreateReq = {};
    joinOrCreateReq.type = "JoinOrCreateRoom";
    joinOrCreateReq.playerName = playerName;
    joinOrCreateReq.playerId = playerId;
    joinOrCreateReq.playerAvatar = playerAvatar;
    joinOrCreateReq.maxPlayersPerRoom = maxPlayersPerRoom;
    joinOrCreateReq.minPlayersToStartGame = minPlayersToStartGame;
    return joinOrCreateReq;
}

function joinRoomRequest (roomId, playerName, playerId, playerAvatar) {
    let joinRoomReq = {};
    joinRoomReq.type = "JoinRoom";
    joinRoomReq.roomId = roomId;
    joinRoomReq.playerName = playerName;
    joinRoomReq.playerId = playerId;
    joinRoomReq.playerAvatar = playerAvatar;
    return joinRoomReq;
}

function exitRoomRequest (roomId, playerId) {
    let exitRoomReq = {};
    exitRoomReq.type = "ExitRoom";
    exitRoomReq.roomId = roomId;
    exitRoomReq.playerId = playerId;
    return exitRoomReq;
}

module.exports.client_util = {
    createRoomRequest,
    joinOrCreateRoomRequest,
    joinRoomRequest,
    exitRoomRequest,
};
