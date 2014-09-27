var ws = require('ws');
var WebSocketServer = ws.Server;
var db = require('./db').db;
var handlers = require('./room/handlers').handlers;
var utils = require('./room/utils');

var wss = new WebSocketServer({port: 7001});
utils.init(wss);

wss.handlers = handlers;
function extractMessage(data, flags) {
    if (flags.binary) {
        return {error: 'binary messages are not supported'};
    }
    if (data.length > 1000) {
        return {error: 'message was too big: ' + data.length};
    }
    console.log('received: %s', data);
    try {
        message = JSON.parse(data);
    } catch (e) {
        return {error: 'message was not JSON'};
    }

    return {message: message};
}
function socketOnMessage(data, flags) {
    var extracted = extractMessage(data, flags);
    if (extracted.error) {
        console.log(extracted.error);
        return;
    }
    var message = extracted.message;

    if (wss.handlers.hasOwnProperty(message.action)) {
        wss.handlers[message.action](this, message);
    } else {
        console.log('unknown action %s', message.action);
    }
}

wss.on('connection', function onConnection(socket) {
    console.log('new connectioni, now %s clients', wss.clients.length);
    if (wss.clients.length > 10) {
        console.log('too many clients, dropping');
        socket.close();
        return;
    }

    socket.on('message', socketOnMessage.bind(socket));
});

console.log('Websocket server started');

