var http = require('http'),
    path = require('path'),
    fs = require('fs');

var server = http.createServer(function onRequest(request, response) {
    console.log('requesting page');
    var indexPath = path.join(process.cwd(), 'static/html/index.html')
    fs.readFile(indexPath, 'binary', function readFile(err, file) {
        if (err) {
            response.writeHeader(500, {'Content-Type': 'text/plain'});
            response.write(err + '\n');
            response.end();
        } else {
            response.writeHeader(200, {'Content-Type': 'text/html'});
            response.write(file, 'binary');
            response.end();
        }
    });
});

exports.server = server;

