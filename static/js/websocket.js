var rps = {};

document.addEventListener("DOMContentLoaded", reconnect, false);

function reconnect() {
    var socket = rps.socket;
    if (socket && (
        (socket.readyState == socket.CONNECTING) ||
        (socket.readyState == socket.OPEN))) {
        if (socket.readyState == socket.OPEN) {
            connected();
        }
        return;
    }
    document.querySelector('.web-socket-status').classList.remove('connected');
    console.log('Connecting to websocket server');
    var hostname = location.hostname;
    var port = (hostname == 'rps.next-tuesday.net') ? '7001' : '7002';
    socket = rps.socket = new WebSocket('ws://' + hostname + ':' + port);
    if (socket.readyState != socket.OPEN) {
        console.log('Could not connect to webscoket server, will retry');
        if (!rps.reconnectInterval) {
            rps.reconnectInterval = window.setInterval(reconnect, 1000);
        }
    } else if (socket.readyState == socket.OPEN) {
        connected();
    }
}
function connected() {
    console.log('Connected to websocket server');
    document.querySelector('.web-socket-status').classList.add('connected');
    rps.socket.onmessage = onMessage;
    rps.socket.onclose = reconnect;
    rps.reconnectInterval = window.clearInterval(rps.reconnectInterval);
    rps.socket.send(JSON.stringify({action: 'list_users'}));
    rps.socket.send(JSON.stringify({action: 'my_token'}));
}
function onMessage(data) {
    try {
        data = JSON.parse(data.data);
    } catch (e) {
        console.log('Message was not JSON', data);
        return;
    }

    if (data.type == 'user_token') {
        rps.myToken = data.user.token;
        rps.myId = data.user.id;
        rps.myName = data.user.name;

        var myUserOption = document.querySelector('[name=users] .my-user');
        if (myUserOption) {
            myUserOption.classList.remove('my-user');
        }

        var myUserOption = document.querySelector(
                '[name=users] [value="' + rps.myId + '"]');
        if (myUserOption) {
            myUserOption.classList.add('my-user');
        }
    } else if (data.type == 'new_user') {
        addUser(data.user);
    } else if (data.type == 'removed_user') {
        removeUser(data.user);
    } else if (data.type == 'changed_user') {
        renameUser(data.user);
    } else if (data.type == 'list_users') {
        listUsers(data.users);
    } else if (data.type == 'round_results') {
        outputRoundResults(data.users);
    }
}
function listUsers(users) {
    var usersList = document.querySelector('[name=users]');
    usersList.options.length = 0;
    for (var i = 0, user ; user = users[i] ; i++) {
        addUser(user);
    }
}
function getUserDisplay(user) {
    return user.name + ' - ' + user.score + ' - ' + user.state;
}
function addUser(user) {
    var option = document.createElement('option');
    if (user.id == rps.myId) {
        option.classList.add('my-user');
    }
    option.textContent = getUserDisplay(user);
    option.value = user.id;
    var usersList = document.querySelector('[name=users]');
    usersList.add(option);
}
function removeUser(user) {
    var option = document.querySelector('[name=users] [value="' + 
        user.id + '"]');
    if (option) {
        option.remove();
    }
}
function renameUser(user) {
    var option = document.querySelector('[name=users] [value="' + 
        user.id + '"]');
    if (option) {
        option.textContent = getUserDisplay(user);
    }
}
function outputRoundResults(users) {
    var text = users.map(function(user) {
        return user.name + ' +' + user.scoreDelta + ' with ' + user.choice;
    }).join(', ');
    var option = document.createElement('option');
    option.selected = true;
    option.textContent = text;
    var resultsList = document.querySelector('[name=results]');
    resultsList.add(option);
    var options = document.querySelectorAll('[name^=choice-]:checked');
    for (var i = 0, option ; option = options[i] ; i++) {
        option.checked = false;
    }
}

