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
                score: 0,
                state: 'waiting',
            };
            user.name = data.name || 'User ' + user.id

            var stmt = db.prepare("INSERT INTO users (id, token, name, score, state) VALUES (?, ?, ?, ?, ?)");
            stmt.run(user.id, user.token, user.name, user.score, user.state);
            stmt.finalize();

            socket.send(JSON.stringify({
                type: 'user_token',
                user: user,
            }));
            wss.broadcast(JSON.stringify({
               type: 'new_user',
               user: user,
            }));
        } else if (data.action == 'list_users') {
            db.all("SELECT id, name, score, state FROM users",
                    function dbAll(err, rows) {
                var users = rows.map(function(row) {
                    return {
                        id: row.id,
                        name: row.name,
                        score: row.score,
                        state: row.state,
                    };
                });
                socket.send(JSON.stringify({
                    type: 'list_users',
                    users: users
                }));
            });
        }
    });
});

console.log('Websocket server started');

