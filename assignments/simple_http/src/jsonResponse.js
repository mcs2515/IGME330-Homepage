var getTimeString = function(){
    var d = new Date();
    var dateString = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    return dateString;
};

var getHelloJSON = function(request, response){
  var helloJSON= {
      message: "hello world",
  };
    
    var stringMessage = JSON.stringify(helloJSON);
    
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(stringMessage);
    response.end();
};

var getTimeJSON = function(request, response){
  var timeJSON= {
      time: getTimeString()
  };
    
    var stringMessage = JSON.stringify(timeJSON);
    
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(stringMessage);
    response.end();
};

module.exports.getHelloJSON = getHelloJSON;
module.exports.getTimeJSON = getTimeJSON;


