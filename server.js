var express = require('express');
var http = require('http');

var io = require('socket.io')
const bodyParser = require('body-parser');

const socketEvents = require('./socket'); 
const routes = require('./routes'); 
const allConfigs = require('./config');
const redis = require("./redis");




class Server {
    constructor() {
        this.port = 3000;
        this.host = 'localhost';

        this.app = express();
        this.http = http.Server(this.app);
        this.socket = io(this.http);
      
    }

    appConfig() {
        this.app.use(
            bodyParser.json()
        )
        new allConfigs.Config(this.app)
    }

    includeRoutes() {
        new routes(this.app).routesConfig();
        new socketEvents(this.socket).socketConfig();
    }

    initRedis() {
        new redis()
    }

    

    appExecute() {
        this.appConfig();
        this.includeRoutes();
        this.initRedis();

        this.http.listen(this.port, this.host, () => {
            console.log(`Listening on http://${this.host}:${this.port}`);
        })
    }
}

const app = new Server();
app.appExecute()