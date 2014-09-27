var db = require('../db').db;
var utils = require('./utils');

var handlers = {
    socket$connect: function socketOnMessage(socket, data) {
        var user = utils.addUser(socket);
    },
    socket$close: function socket$close(socket, data) {
        utils.removeUser(socket);
    },
    my_token: function my_token(socket, data) {
        utils.sendUserToken(socket);
    },
    rename: function rename(socket, data) {
        utils.renameUser(socket, data.name);
    },
    list_users: function list_users(socket, data) {
        utils.sendUserList(socket);
    },
    choose: function choose(socket, data) {
        utils.makeChoice(socket, data.choice);
    },
};

exports.handlers = handlers;

