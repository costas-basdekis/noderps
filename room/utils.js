var db = require('../db.js').db;

var wss;

function init($wss) {
    wss = $wss;
}

function send(socket, data) {
    var j = JSON.stringify(data);
    socket.send(j);
}

function broadcast(data) {
    var j = JSON.stringify(data);
    for (var i = 0, client ; client = wss.clients[i] ; i++) {
        client.send(j);
    }
}

function addUser(user) {
    console.log('new user');
    
    user = {
        id: Math.ceil(Math.random() * 1000000),
        token: Math.ceil(Math.random() * 1000000),
        score: 0,
        state: 'waiting',
        name: user.name,
    };
    user.name = user.name || 'User #' + user.id;

    db.run("INSERT INTO users (id, token, name, score, state) VALUES "+
           "($id, $token, $name, $score, $state)", {
        $id: user.id,
        $token: user.token,
        $name: user.name,
        $score: user.score,
        $state: user.state,
    });

    broadcastNewUser(user);

    return user;
}

function broadcastNewUser(user) {
    broadcast({
       type: 'new_user',
       user: user,
    });
}

function getUsers(callback) {
    var users = [];
    db.each("SELECT id, name, score, state FROM users",
    function dbEach(err, row) {
        users.push({
            id: row.id,
            name: row.name,
            score: row.score,
            state: row.state,
        });
    }, function dbEachComplete() {
        callback(users);
    });
}

CHOICES = ['rock', 'paper', 'sciscors'];

function makeChoice(token, choice) {
    if (CHOICES.indexOf(choice) == -1) {
        console.log('invalid selction %s', choice);
        return;
    }

    db.all("SELECT token, state FROM users WHERE token = $token",
    {$token: token},
    function dbAll(err, rows) {
        if (err) {
            console.log('error %s', err);
            return;
        } else if (rows.length == 0) {
            console.log('unknown user made a choice %s', token);
            return;
        }

        updateUserChoice(token, choice);
    })
}

function updateUserChoice(token, choice) {
    db.run("UPDATE users SET choice = $choice, state = $state "+
           "WHERE token = $token", {
        $token: token,
        $choice: choice,
        $state: 'ready',
    });

    checkAllUsersAreReady();
}

function checkAllUsersAreReady() {
    db.get("SELECT COUNT(*) AS waiting FROM users WHERE state = " +
           "'waiting'",
    function dbGet(err, row) {
        if (row.waiting == 0) {
            console.log('all ready!');
        } else {
            console.log('%s people waiting', row.waiting);
        }
    });
}

exports.init = init;
exports.send = send;
exports.broadcast = broadcast;
exports.addUser = addUser;
exports.getUsers = getUsers;
exports.makeChoice = makeChoice;

