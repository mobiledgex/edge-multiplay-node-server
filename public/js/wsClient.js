const host = window.location.hostname;
const port = window.location.port;
const wsClient = new WebSocket('ws://' + host + ':' + port);
wsClient.addEventListener('open', () => {
  var liveFeed = document.getElementById('live-feed');
  liveFeed.classList.add('live-feed');
});
//fixme add live-feed class attribute once the ws client is open
wsClient.addEventListener('message', (event) => {
  var stats = JSON.parse(event.data);
  document.getElementById('numOfConnectedClients').innerHTML = stats.numOfConnectedClients;
  document.getElementById('numAvailableRooms').innerHTML = stats.numAvailableRooms;
  document.getElementById('numFullRooms').innerHTML = stats.numFullRooms;
  document.getElementById('membersStillInLobby').innerHTML = stats.membersStillInLobby;
  document.getElementById('countOfPlayersAvailableRooms').innerHTML = stats.membersInAvailableRooms;
  document.getElementById('countOfPlayersFullRooms').innerHTML = stats.membersInFullRooms;
});
wsClient.addEventListener('close', () => {
  document.getElementById('live-feed').removeAttribute('class');
});
