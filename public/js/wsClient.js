const wsClient = new WebSocket('ws://0.0.0.0:7776')
wsClient.addEventListener('message', (event) => {
  var stats = JSON.parse(event.data)
  document.getElementById('numOfConnectedClients').innerHTML = stats.numOfConnectedClients;
  document.getElementById('numAvailableRooms').innerHTML = stats.numAvailableRooms;
  document.getElementById('numFullRooms').innerHTML = stats.numFullRooms;
  document.getElementById('membersStillInLobby').innerHTML = stats.membersStillInLobby;
  document.getElementById('countOfPlayersAvailableRooms').innerHTML = stats.membersInAvailableRooms;
  document.getElementById('countOfPlayersFullRooms').innerHTML = stats.membersInFullRooms;
})
wsClient.addEventListener('close', () => {
  document.getElementById("live-feed").removeAttribute("class");
})
