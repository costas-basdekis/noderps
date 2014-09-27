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

    getUsersWaiting(function usersAreReady(waiting) {
        if (waiting == 0) {
            console.log('all ready!');
            doRound();
        } else {
            console.log('%s people waiting', waiting);
            broadcastListUsers();
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
    db.each("SELECT id, choice FROM users",
    function dbEach(err, row) {
        counts[row.choice]++;
        users.push({
            id: row.id,
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

exports.init = init;
exports.send = send;
exports.broadcast = broadcast;
exports.addUser = addUser;
exports.getUsers = getUsers;
exports.makeChoice = makeChoice;
exports.sendUserList = sendUserList;

