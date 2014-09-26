var ws = require('ws');
var WebSocketServer = ws.Server;
var db = require('./db').db;

var wss = new WebSocketServer({port: 7001});
wss.broadcast = function broadcast(data) {
    for (var i = 0, client ; client = this.clients[i] ; i++) {
        client.send(data);
    }
};

wss.on('connection', function onConnection(socket) {
    console.log('new connection');
    socket.on('message', function socketOnMessage(data, flags) {
        console.log('received: %s', data);
        try {
            data = JSON.parse(data)
        } catch (e) {
            return;
        }
        if (data.action == 'join') {
            console.log('new user');
            var id = Math.ceil(Math.random() * 1000000);
            var token = Math.ceil(Math.random() * 1000000);
            var name = data.name || 'User ' + id;

            var stmt = db.prepare("INSERT INTO users values (?, ?, ?)");
            stmt.run(id, token, name);
            stmt.finalize();

            socket.send(JSON.stringify({
                type: 'user_token',
                token: token
            }));
            wss.broadcast(JSON.stringify({
               type: 'new_user',
               id: id,
               name: name
            }));
        }
    });
});

