var ws = require('ws');
var WebSocketServer = ws.Server;

var wss = new WebSocketServer({port: 7001});
wss.on('connection', function onConnection(socket) {
    socket.on('message', function socketOnMessage(message) {
        console.log('received: %s', message);
    });
});

