var ws = require('ws');
var WebSocketServer = ws.Server;
var db = require('./db').db;

var wss = new WebSocketServer({port: 7001});
wss.broadcast = function broadcast(data) {
    for (var i = 0, client ; client = this.clients[i] ; i++) {
        client.send(data);
    }
};

wss.handlers = {
    join: function join(socket, data) {
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
    },
    list_users: function list_users(socket, data) {
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
    },
    choose: function choose(socket, data) {
        if (['rock', 'paper', 'sciscors'].indexOf(data.choice) == -1) {
            console.log('invalid selction %s', data.choice);
            return;
        }

        db.all("SELECT token, state FROM users WHERE token = $token",
        {$token: data.token},
        function dbAll(err, rows) {
            if (err) {
                console.log('error %s', err);
                return;
            } else if (rows.length == 0) {
                console.log('unknown user made a choice %s', data.token);
                return;
            }
            var row = rows[0];

            db.run("UPDATE users SET choice = $choice, state = $state "+
                   "WHERE token = $token", {
                $token: data.token,
                $choice: data.choice,
                $state: 'ready',
            });

            db.get("SELECT COUNT(*) AS waiting FROM users WHERE state = " +
                   "'waiting'",
            function dbGet(err, row) {
                if (row.waiting == 0) {
                    console.log('all ready!');
                } else {
                    console.log('%s people waiting', row.waiting);
                }
            });
        })
    },
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

        if (data.action in wss.handlers) {
            wss.handlers[data.action](socket, data);
        } else {
            console.log('unknown action %s', data.action);
        }
    });
});

console.log('Websocket server started');

