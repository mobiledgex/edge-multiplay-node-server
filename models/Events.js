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

/**
 * Class representing an Event.
 *
 */
class Event {
  /**
   * @constructor
   * @param  {string} type type of the event
   */
  constructor (type) {
    this.type = type;
  }
  convertToJSONString () {
    return JSON.stringify(this);
  }
}

/**
 * Class representing a Room Join Event, RoomJoinEvent is sent from the server to the player once a JoinRoom request succeed
 * @extends Event
 */
class RoomJoinEvent extends Event {
  /**
   * @constructor
   * @param  {Room} room a Room Object contains the updated list of the room members
   */
  constructor (room) {
    super();
    this.type = "roomJoin";
    this.room = room;
  }
}

/**
 * Class representing a Room Created Event, RoomCreatedEvent is sent from the server to the player once a CreateRoom request succeed
 * @extends Event
 */
class RoomCreatedEvent extends Event {
  /**
   * @constructor
   * @param  {Room} room a Room Object contains the updated list of the room members
   */
  constructor (room) {
    super();
    this.type = "roomCreated";
    this.room = room;
  }
}

/**
 * Class representing a RoomMember Left Event, RoomMemberLeftEvent is sent from the server to the room members once a room member leaves the room
 * @extends Event
 */
class RoomMemberLeftEvent extends Event {
  /**
   * @constructor
   * @param  {string} idOfPlayerLeft id of the player who left the room
   */
  constructor (idOfPlayerLeft) {
    super();
    this.type = "memberLeft";
    this.idOfPlayerLeft = idOfPlayerLeft;
  }
}

/**
 * Class representing a the list of available rooms on the lobby, This is the response of EdgeManager.GetAvailableRooms()
 * @extends Event
 */
class AvailableRoomsListEvent extends Event {
  /**
   * @constructor
   * @param  {Array.<Room>} availableRooms list of available rooms on the lobby, an available room is a room which its roomMembers.length < maxPlayersPerRoom
   */
  constructor (availableRooms) {
    super();
    this.type = "availableRoomsList";
    this.availableRooms = availableRooms;
  }
}

/**
 * Class representing a Notification Event sent from the server, there are some standard notifications (create-room-faliure, join-room-faliure, new-room-created-in-lobby)
 *
 * @extends Event
 */
class NotificationEvent extends Event {
  /**
   * @constructor
   * @param  {string} notificationText notification text
   */
  constructor (notificationText) {
    super();
    this.type = "notification";
    this.notificationText = notificationText;
  }
}
/**
 * Class representing a Register Event sent from the server, Register Event is when the player establish its connection with the server and the player is assigned a player id and session id
 *
 * @extends Event
 */
class RegisterEvent extends Event {
  /**
   * @constructor
   * @param  {string} playerId unique player id assigned once the connection is established using uuid package
   * @param  {string} sessionId  unique identifier of the session using the |Sec-WebSocket-Key| header
   */
  constructor (playerId, sessionId) {
    super();
    this.type = "register";
    this.sessionId = sessionId;
    this.playerId = playerId;
  }
}
/**
 * Class representing a Player Joined Room Event from the server, PlayerJoinedRoom Event is sent by the server to room members once a new player join their room
 *
 * @extends Event
 */
class PlayerJoinedRoomEvent extends Event {
  /**
   * @constructor
   * @param  {Room} room a Room Object contains the updated list of the room members
   */
  constructor (room) {
    super();
    this.type = "playerJoinedRoom";
    this.room = room;
  }
}

/**
 * Class representing a the list of rooms on the lobby, This is the response of EdgeManager.GetRooms()
 * @extends Event
 */
class RoomsListEvent extends Event {
  /**
   * @constructor
   * @param  {Array.<Room>} rooms list of rooms on the lobby
   */
  constructor (rooms) {
    super();
    this.type = "roomsList";
    this.rooms = rooms;
  }
}

/**
 * Class representing GamePlayEvent, GamePlay Events are the wrapper for data transferred between players over the websocket and the udp server
 * @extends Event
 */
class GamePlayEvent extends Event {
  /**
   * @constructor
   * @param  {string} roomId unique room id assigned on room creation, the id is generated using uuid() module
   * @param  {string} senderId the playerId of the sender, a playerId is a unique player id assigned once the connection is established using uuid package
   * @param  {string} eventName the name of the gamePlayEvent, you can choose any name you like, there is only one reserved name "EdgeMultiplayObserver"(Don't use this name)
   * @param  {Array.<string>} stringData an array of strings to be transferred between players
   * @param  {Array.<integer>} integerData an array of integers to be transferred between players
   * @param  {Array.<float>} floatData an array of floating point numbers to be transferred between players
   * @param  {Array.<boolean>} booleanData an array of booleans to be transferred between players
   */
  constructor (
    roomId,
    senderId,
    eventName = "",
    stringData = [],
    integerData = [],
    floatData = [],
    booleanData = []
  ) {
    super();
    this.type = "GamePlayEvent";
    this.senderId = senderId;
    this.roomId = roomId;
    this.eventName = eventName;
    this.stringData = stringData;
    this.integerData = integerData;
    this.floatData = floatData;
    this.booleanData = booleanData;
  }
  static [Symbol.hasInstance] (obj) {
    if (obj.type !== "GamePlayEvent") {
      console.error("wrong event type");
      return false;
    }
    if (obj.senderId === "" || obj.senderId === undefined) {
      console.error("missing senderId");
      return false;
    }
    if (obj.roomId === "" || obj.roomId === undefined) {
      console.error("missing room id");
      return false;
    }
    if (obj.eventName === "" || obj.eventName === undefined) {
      console.error("missing event name");
      return false;
    }
    if (obj.stringData !== undefined && !Array.isArray(obj.stringData)) {
      console.error("stringData is not an array");
      return false;
    }
    if (obj.floatData !== undefined && !Array.isArray(obj.floatData)) {
      console.error("floatData is not an array");
      return false;
    }
    if (obj.integerData !== undefined && !Array.isArray(obj.integerData)) {
      console.error("integerData is not an array");
      return false;
    }
    if (obj.booleanData !== undefined && !Array.isArray(obj.booleanData)) {
      console.error("booleanData is not an array");
      return false;
    }
    return true;
  }
}
module.exports.Events = {
  RegisterEvent,
  RoomCreatedEvent,
  RoomJoinEvent,
  RoomCreatedEvent,
  RoomsListEvent,
  GamePlayEvent,
  PlayerJoinedRoomEvent,
  NotificationEvent,
  AvailableRoomsListEvent,
  RoomMemberLeftEvent,
};
