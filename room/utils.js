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

function addUser(socket) {
    console.log('new user');
    
    user = {
        id: Math.ceil(Math.random() * 1000000),
        token: Math.ceil(Math.random() * 1000000),
        score: 0,
        state: 'waiting',
    };
    user.name = 'User #' + user.id;

    db.run("INSERT INTO users (id, token, name, score, state) VALUES "+
           "($id, $token, $name, $score, $state)", {
        $id: user.id,
        $token: user.token,
        $name: user.name,
        $score: user.score,
        $state: user.state,
    });

    socket.meta = socket.meta || {};
    socket.meta.user = user;

    sendUserToken(socket);

    broadcastNewUser(user);

    return user;
}

function sendUserToken(socket) {
    var user = socket.meta.user;
    send(socket, {
        type: 'user_token',
        user: user,
    });
}

function renameUser(socket, name) {
    var user = socket.meta.user;
    user.name = (name || 'User #' + user.id).substr(0, 20);

    db.run("UPDATE users SET name = $name WHERE id = $id;", {
        $id: user.id,
        $name: user.name,
    });

    broadcastChangedUser(user);
}

function removeUser(socket) {
    var user = socket.meta.user;
    db.run("DELETE FROM users WHERE id = $id",{
        $id: user.id,
    });

    broadcastDeletedUser(user);
}

function broadcastNewUser(user) {
    broadcast({
        type: 'new_user',
        user: {
            id: user.id,
            name: user.name,
            score: user.score,
            state: user.state,
        },
    });
}

function broadcastChangedUser(user) {
    broadcast({
        type: 'changed_user',
        user: {
            id: user.id,
            name: user.name,
            score: user.score,
            state: user.state,
        },
    });
}

function broadcastDeletedUser(user) {
    broadcast({
        type: 'removed_user',
        user: {
            id: user.id,
        },
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

function sendUserList(socket) {
    getUsers(function(users) {
        send(socket, {
            type: 'list_users',
            users: users
        });
    });
}

CHOICES = ['rock', 'paper', 'sciscors'];
CHOICES_BEAT = {
    'rock': 'sciscors',
    'sciscors': 'paper',
    'paper': 'rock',
};

function makeChoice(socket, choice) {
    var user = socket.meta.user;

    if (CHOICES.indexOf(choice) == -1) {
        console.log('invalid selction %s', choice);
        return;
    }

    updateUserChoice(user, choice);
}

function updateUserChoice(user, choice) {
    user.state = 'ready';
    db.run("UPDATE users SET choice = $choice, state = $state "+
           "WHERE id = $id", {
        $id: user.id,
        $choice: choice,
        $state: user.state,
    });

    getUsersWaiting(function usersAreReady(waiting) {
        if (waiting == 0) {
            console.log('all ready!');
            doRound();
        } else {
            console.log('%s people waiting', waiting);
            broadcastChangedUser(user);
        }
    });
}

function getUsersWaiting(callback) {
    db.get("SELECT COUNT(*) AS waiting FROM users WHERE state = " +
           "'waiting'",
    function dbGet(err, row) {
        callback(row.waiting);
    });
}

function doRound() {
    getScoresDelta(updateScores);
}

function getScoresDelta(callback) {
    var counts = {};
    for (var i = 0, choice ; choice = CHOICES[i] ; i++) {
        counts[choice] = 0;
    }
    var users = [];
    db.each("SELECT id, name, choice FROM users",
    function dbEach(err, row) {
        counts[row.choice]++;
        users.push({
            id: row.id,
            name: row.name,
            choice: row.choice,
        });
    }, function dbEachComplete(err) {
        if (err) {
            console.log('error in doRound: %s', err);
            return;
        }

        console.log('choice counts are', counts);

        for (var i = 0, user ; user = users[i] ; i++) {
            var choiceBeat = CHOICES_BEAT[user.choice];
            user.scoreDelta = counts[choiceBeat];
            console.log('user %s choice %s, beats %s with %s', user.id, user.choice, 
                        user.scoreDelta, choiceBeat);
        }
        
        callback(users);
    });
}

function updateScores(users) {
    console.log('updating scores');
    var stmt = db.prepare("UPDATE users SET score = score + $scoreDelta " +
                          "WHERE id = $id");
    for (var i = 0, user ; user = users[i] ; i++) {
        stmt.run({
            $id: user.id,
            $scoreDelta: user.scoreDelta,
        });
    }
    stmt.finalize();

    db.run("UPDATE users SET state = 'waiting', choice = ''",
    function runComplete(err) {
        if (err) {
            console.log('error updating state: %s', err);
            return;
        }

        broadcastListUsers();
        broadcastRoundResults(users);
    });
}

function broadcastListUsers() {
    getUsers(function(users) {
        broadcast({
            type: 'list_users',
            users: users
        });
    });
}

function broadcastRoundResults(users) {
    broadcast({
        type: 'round_results',
        users: users,
    });
}

exports.init = init;
exports.send = send;
exports.broadcast = broadcast;
exports.addUser = addUser;
exports.sendUserToken = sendUserToken;
exports.renameUser = renameUser;
exports.removeUser = removeUser;
exports.getUsers = getUsers;
exports.makeChoice = makeChoice;
exports.sendUserList = sendUserList;

