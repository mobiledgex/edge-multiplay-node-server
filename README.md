# Edge-Mutiplay NodeJS Server
EdgeMultiplay is a light game server sample that works with [EdgeMultiplay Unity Client](https://github.com/mobiledgex/edge-multiplay-unity-client), the server is built using NodeJS

## Documentation

Checkout the server documentation [here](https://mobiledgex.github.io/edge-mutiplay-node-server/index.html)

## Prequesites

- **MobiledgeX Unity SDK**
- **EdgeMultiplay Unity Client**


## Usage

### Get Started Video :  https://www.youtube.com/watch?v=xzrqRzccr5A

#### For Running the server on your machine 

- Clone the repo.
- In your command line run ``` npm start ``` the server should be running on your local host.
- In EdgeManager check Use Local Host Server
- Specify the Host IP Address

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
  Checkout this video on how to deploy your server on MobiledgeX Console https://www.youtube.com/watch?v=YorMXIi4J9c


