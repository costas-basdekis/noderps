var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function serialize() {
    db.run("CREATE TABLE users (id LONG, token LONG, name TEXT)");
});

exports.db = db;

