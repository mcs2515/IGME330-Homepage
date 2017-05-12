var http = require('http');
var htmlHandler = require('./htmlResponse.js');
var jsonHandler = require('./jsonResponse.js');
var imageHandler = require('./imageResponses.js');

var port = process.env.PORT || 3000;

var onRequest = function(request, response){
    console.log(request.url);
    
    switch (request.url){
            
        case '/':
            htmlHandler.getIndex(request, response);
            break;
        case '/page2':
            htmlHandler.getPage2(request, response);
            break;
        case '/helloJSON':
            jsonHandler.getHelloJSON(request, response);
            break;
        case '/timeJSON':
            jsonHandler.getTimeJSON(request, response);
            break;
        case '/dankmemes':
            imageHandler.getImage(request, response);
            break;
        default:
            htmlHandler.getIndex(request, response);
            break;
    }
};

http.createServer(onRequest).listen(port);

console.log("Listening on localhost: " + port)

