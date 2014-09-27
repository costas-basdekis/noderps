var ws = require('ws');
var WebSocketServer = ws.Server;
var db = require('./db').db;
var handlers = require('./room/handlers').handlers;
var utils = require('./room/utils');

var wss = new WebSocketServer({port: 7001});
utils.init(wss);

wss.handlers = handlers;
wss.on('connection', function onConnection(socket) {
    console.log('new connection');
    socket.on('message', function socketOnMessage(data, flags) {
        console.log('received: %s', data);
        try {
            data = JSON.parse(data)
        } catch (e) {
            return;
        }

        if (data.action in wss.handlers) {
            wss.handlers[data.action](socket, data);
        } else {
            console.log('unknown action %s', data.action);
        }
    });
});

console.log('Websocket server started');

