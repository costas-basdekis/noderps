var http = require('http'),
    url = require('url');
    path = require('path'),
    fs = require('fs');

var staticRoot = './static';
var indexFile = '/html/index.html';

CONTENT_TYPES = [
    {re: /\.html/, contentType: 'text/html'},
    {re: /\.js/, contentType: 'text/javascript'},
    {re: /\.css/, contentType: 'text/css'},
]
function getContentType(filename) {
    for (var i = 0, rule ; rule = CONTENT_TYPES[i] ; i++ ){
        if (rule.re.test(filename)) {
            return rule.contentType;
        }
    }

    return 'text/plain';
}

var server = http.createServer(function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log('requesting page %s', pathname);

    // Server index file for root
    if (pathname == '/') {
        pathname = indexFile;
    }

    var filePath = path.join(process.cwd(), staticRoot, pathname);
    fs.readFile(filePath, 'binary', function readFile(err, file) {
        if (err) {
            response.writeHeader(404, {'Content-Type': 'text/plain'});
            response.write(err + '\n');
            response.end();
        } else {
            var contentType = getContentType(filePath);
            response.writeHeader(200, {'Content-Type': contentType});
            response.write(file, 'binary');
            response.end();
        }
    });
});

exports.server = server;

