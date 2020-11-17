# Edge-Mutiplay NodeJS Server
EdgeMultiplay is a light game server sample that works with [EdgeMultiplay Unity Client](https://github.com/mobiledgex/edge-multiplay-unity-client), the server is built using NodeJS

## Documentation

Checkout the server documentation [here](https://mobiledgex.github.io/edge-mutiplay-node-server/index.html)

## Prequesites

- **[MobiledgeX Unity SDK](https://github.com/mobiledgex/edge-cloud-sdk-unity)**
- **EdgeMultiplay Unity Client**


## Usage

### Get Started Video :  https://www.youtube.com/watch?v=xzrqRzccr5A

#### For Running the server on your machine 

- Clone the repo.
- In your command line run ``` npm start ``` the server should be running on your local host.

On the Unity Client change the following:


- In EdgeManager check Use Local Host Server
- Specify the Host IP Address

<img src="img/LocalHostServer.png" width="500" height="250">


#### For Deploying your server to MobiledgeX Console

- In the Makedefs file, set the following parameters

```
ORG_NAME ?= Your Organization Name
APP_NAME ?= Your Application Name
APP_VERS ?= Your Application Version

```

- then in the command line  run this command ``` make ```

This should add your server's docker image  to MobiledgeX registery and MobiledgeX docker hub

- Create an app using the docker image and spawn your app instance on MobiledgeX Console
  
  
  For more info on how to define your Application on MobiledgeX Console, check https://www.youtube.com/watch?v=YorMXIi4J9c
  
On the Unity Client change the following:

- In Unity Editor, Click MobiledgeX/Setup
- Set your Organization Name, Application Name, Application Version and click Setup
<img src="img/ClientSetup.png" width="300" height="320">

