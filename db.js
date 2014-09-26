var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

console.log('New DB');
db.serialize(function serialize() {
    console.log('Creating DB');
    db.run("CREATE TABLE IF NOT EXISTS users (id LONG, token LONG, name TEXT)");
});

exports.db = db;

