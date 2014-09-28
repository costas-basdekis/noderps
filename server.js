var http = require('http'),
    url = require('url');
    path = require('path'),
    fs = require('fs');

var staticRoot = './static';
var indexFile = '/html/index.html';

var server = http.createServer(function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log('requesting page %s', pathname);

    // Server index file for root
    if (pathname == '/') {
        pathname = indexFile;
    }

    var indexPath = path.join(process.cwd(), staticRoot, pathname);
    fs.readFile(indexPath, 'binary', function readFile(err, file) {
        if (err) {
            response.writeHeader(404, {'Content-Type': 'text/plain'});
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

