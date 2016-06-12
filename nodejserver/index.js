var server = require('http').createServer()
  , url = require('url')
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server })
  , express = require('express')
  , app = express()
  , port = 8080;

var path = require('path');
var saving = false;

const low = require('lowdb');
const storage = require('lowdb/lib/file-async')

var db = low('db.json', {
  storage: storage,
  writeOnChange: false
})

//init
db.defaults({ lectures: [] })
  .value()
var lectures = db.get('lectures', [])

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.render('index');
});

var clients = [];
var sensors = [];
wss.on('connection', function connection(ws) {
  if(ws.protocol != "arduino"){
    console.log("agregar navegador");
    clients.push(ws);
  }else if(ws.protocol == "arduino"){
    console.log("agregar sensor");
    sensors.push(ws);
  }

  ws.on('message', function incoming(message) {
    if(message == "startPreview"){
      sensors.forEach(function(sensor) {
        sensor.send('1');
      });
    }else if(message == "startSaving"){
      saving = true;
      console.log("Start saving");
    }else if(message == "stopSaving"){
      saving = false;
      db.write();
      console.log("Stop saving");
      prepareFiles();
    }else{
      if(saving){
        //console.log(message);
        lectures.push(message).value()
      }
      clients.forEach(function(client) {
        client.send(message, function ack(error){
          // if error is not defined, the send has been completed,
          // otherwise the error object will indicate what failed.
        });
      });
    }
    //var lecture = JSON.parse(message);
    //console.log('received: %s', lecture.millis);
  });

  ws.on('close', function() {
    //remove the client from clients list
    delete clients[ws];
  });
});

function prepareFiles(){
  console.log('Preparar archivos');
  data = JSON.stringify(db.getState());
  console.log(data);
}

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
