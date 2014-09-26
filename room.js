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
            var user = {
                id: Math.ceil(Math.random() * 1000000),
                token: Math.ceil(Math.random() * 1000000),
            };
            user.name = data.name || 'User ' + user.id

            var stmt = db.prepare("INSERT INTO users values (?, ?, ?)");
            stmt.run(user.id, user.token, user.name);
            stmt.finalize();

            socket.send(JSON.stringify({
                type: 'user_token',
                user: user
            }));
            wss.broadcast(JSON.stringify({
               type: 'new_user',
               user: user,
            }));
        } else if (data.action == 'list_users') {
            var users = [];
            db.each("SELECT id, name FROM users", function dbEach(err, row) {
                users.push({
                    id: row.id,
                    name: row.name,
                });
            });
            socket.send(JSON.stringify({
                type: 'list_users',
                users: users
            }));
        }
    });
});

console.log('Websocket server started');

