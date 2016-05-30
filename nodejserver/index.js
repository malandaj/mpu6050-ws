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

wss.on('connection', function connection(ws) {
  console.log(ws.id);
  ws.on('message', function incoming(message) {
    //var lecture = JSON.parse(message);
    console.log('received: %s', message);
    wss.clients.forEach(function(client) {
      if (client !== ws) client.send(message);
    });
  });
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
