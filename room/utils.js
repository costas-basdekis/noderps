var db = require('../db.js').db;

var wss;

function init($wss) {
    wss = $wss;
}

function broadcast(data) {
    for (var i = 0, client ; client = wss.clients[i] ; i++) {
        client.send(data);
    }
}

exports.init = init;
exports.broadcast = broadcast;

