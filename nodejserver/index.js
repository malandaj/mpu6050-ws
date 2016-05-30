var server = require('http').createServer()
  , url = require('url')
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server })
  , express = require('express')
  , app = express()
  , port = 8080;

var path = require('path');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.render('index');
});

var clients = [];
wss.on('connection', function connection(ws) {
  if(ws.protocol != "arduino"){
    console.log("agregar navegador");
    clients.push(ws);
  }

  ws.on('message', function incoming(message) {
    console.log(message);
    //var lecture = JSON.parse(message);
    //console.log('received: %s', lecture.millis);
    clients.forEach(function(client) {
      client.send(message);
    });
  });

  ws.on('close', function() {
    //remove the client from clients list
    delete clients[ws];
  });
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
