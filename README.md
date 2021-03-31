# Edge-Mutiplay NodeJS Server
EdgeMultiplay is an open source multiplayer game server that works with [EdgeMultiplay Unity Client](https://github.com/mobiledgex/edge-multiplay-unity-client). The server is built using NodeJS and we provide a ready made client written in C# Unity.

## Documentation

For more information on how to use the server, please refer to the server documentation [here](https://mobiledgex.github.io/edge-multiplay-node-server/)

## Prerequisites

- **[MobiledgeX Unity SDK](https://github.com/mobiledgex/edge-cloud-sdk-unity)**
- **EdgeMultiplay Unity Client**

## EdgeMultiplay Unity Client Tutorials

[![Video Tutorials](https://img.youtube.com/vi/9kMz6Q3g0xQ/0.jpg)](https://www.youtube.com/watch?v=9kMz6Q3g0xQ&list=PLwUZZfaECSv18E5d0ooDR7S8416pImW8W)


## [Discord server](https://discord.gg/CHCWfgrxh6)

## Usage

Download EdgeMultiplay Module from npm
```
npm install edge-multiplay
```
Example of Usage
```
const edgeMultiplay = require('edge-multiplay')

edgeMultiplay.wsServer.on('newConnection',(path, connection)=>{
  // your logic goes here 
  // On success call
  edgeMultiplay.addToLobby(connection)
  // On failure call edgeMultiplay.rejectConnection(connection)
})
```

#### To Run the Server locally

On the Unity Client change the following:

- In EdgeManager check Use Local Host Server
- Specify the Host IP Address

<img src="img/LocalHostServer.png" width="500" height="250">

For more information on how to run the server locally, please refer to our [setup guide](https://developers.mobiledgex.com/t/625988aa) on the MobiledgeX Developer Portal. 

* For bug reports or contributions please check the [github repo](https://github.com/mobiledgex/edge-multiplay-node-server), and join the [discord server](https://discord.com/invite/CHCWfgrxh6)
