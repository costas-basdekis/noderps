var db = require('../db').db;
var utils = require('./utils');

var handlers = {
    join: function join(socket, data) {
        var user = utils.addUser({name: data.name});

        utils.send(socket, {
            type: 'user_token',
            user: user,
        });
    },
    list_users: function list_users(socket, data) {
        utils.getUsers(function(users) {
            utils.send(socket, {
                type: 'list_users',
                users: users
            });
        });
    },
    choose: function choose(socket, data) {
        utils.makeChoice(data.token, data.choice);
    },
};

exports.handlers = handlers;

