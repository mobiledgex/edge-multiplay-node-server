# Edge-Mutiplay NodeJS Server
EdgeMultiplay is a game server that works with [EdgeMultiplay Unity Client](https://github.com/mobiledgex/edge-multiplay-unity-client), the server is built using NodeJS and the client is C# Unity.

## Documentation

Checkout the server documentation [here](https://mobiledgex.github.io/edge-multiplay-node-server/)

## Prequesites

- **[MobiledgeX Unity SDK](https://github.com/mobiledgex/edge-cloud-sdk-unity)**
- **EdgeMultiplay Unity Client**

### [EdgeMultiplay Unity Client Tutorials](https://www.youtube.com/watch?v=9kMz6Q3g0xQ&list=PLwUZZfaECSv18E5d0ooDR7S8416pImW8W)

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

#### For Running the server locally

On the Unity Client change the following:

- In EdgeManager check Use Local Host Server
- Specify the Host IP Address


<img src="img/LocalHostServer.png" width="500" height="250">

* For bug reports or contributions please check the [github repo](https://github.com/mobiledgex/edge-multiplay-node-server), and join the [discord server](https://discord.com/invite/CHCWfgrxh6)
