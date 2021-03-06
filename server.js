var express = require('express');
var http = require('http');

var io = require('socket.io')
const bodyParser = require('body-parser');

const socketEvents = require('./socket'); 
const routes = require('./routes'); 
const allConfigs = require('./config');

const passport = require('passport');
const { Strategy } = require('passport-jwt');
const { jwt } = require('./config');

passport.use(new Strategy(jwt, function(jwt_payload, done) {
    if(jwt_payload != void(0)) return done(false, jwt_payload);
    done();
}));

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

    appExecute() {
        this.appConfig();
        this.includeRoutes();

        this.http.listen(this.port, this.host, () => {
            console.log(`Listening on http://${this.host}:${this.port}`);
        })
    }
}

const app = new Server();
app.appExecute()