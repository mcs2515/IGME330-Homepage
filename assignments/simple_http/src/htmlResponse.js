var fs = require('fs'); //pull in the file system module

var index = fs.readFileSync(__dirname + "/../client/client.html");
var page2 = fs.readFileSync(__dirname + "/../client/client2.html");

var getIndex = function(request, response){
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(index);
    response.end();
};

var getPage2 = function(request, response){
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(page2);
    response.end();
};

module.exports.getIndex = getIndex;
module.exports.getPage2 = getPage2;