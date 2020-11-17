function createRoomRequest(playerName, playerId, playerAvatar, maxPlayersPerRoom) {
    let createReq = {}
    createReq.type = 'CreateRoom'
    createReq.playerName = playerName
    createReq.playerId = playerId
    createReq.playerAvatar = playerAvatar
    createReq.maxPlayersPerRoom = maxPlayersPerRoom
    return createReq
}

function joinOrCreateRoomRequest(playerName, playerId, playerAvatar, maxPlayersPerRoom) {
    let joinOrCreateReq = {}
    joinOrCreateReq.type = 'JoinOrCreateRoom'
    joinOrCreateReq.playerName = playerName
    joinOrCreateReq.playerId = playerId
    joinOrCreateReq.playerAvatar = playerAvatar
    joinOrCreateReq.maxPlayersPerRoom = maxPlayersPerRoom
    return joinOrCreateReq
}

function joinRoom(roomId, playerName, playerId, playerAvatar) {
    let joinRoomReq = {}
    joinRoomReq.type = 'JoinRoom'
    joinRoomReq.roomId = roomId
    joinRoomReq.playerName = playerName
    joinRoomReq.playerId = playerId
    joinRoomReq.playerAvatar = playerAvatar
    return joinRoomReq
}

module.exports.client_util ={
    createRoomRequest,
    joinOrCreateRoomRequest,
    joinRoom
}