var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

console.log('New DB');
db.serialize();
function createDB() {
    console.log('Creating DB');
    db.run("CREATE TABLE IF NOT EXISTS users (id LONG, token LONG, name TEXT, score LONG, state TEXT, choice TEXT)");
}

createDB();

exports.db = db;

