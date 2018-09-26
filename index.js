var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        server: server
    }),
    express = require('express'),
    app = express(),
    router = express.Router(),
    port = 3000,
    path = require('path'),
    os = require('os'),
    CSV = require('comma-separated-values'),
    fs = require('fs')
    opn = require('opn');

var archiver = require('archiver');
//const fs = require('fs')
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const FileSync = require('lowdb/adapters/FileSync')
const Memory = require('lowdb/adapters/Memory')

// Start database using memory storage
const db = low(new Memory());

db.defaults({
        lectures: []
    })
    .value();

// setup express middleware //
app.use(router);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Router //
router.use(function(req, res, next) {
    // .. some logic here .. like any other middleware
    next();
});

router.get('/', function(req, res) {
    res.render('indexsmooth');
});

router.get('/view', function(req, res) {
    res.render('view');
});

router.get('/sendFile', function(req, res) {
    //processData();
    console.log('send file');
    res.download('data.csv', 'data.csv');
});

function processData() {
    const adapter = new FileSync('db.json')
    const fileDB = low(adapter)
    fileDB.defaults({
      lectures: []
    }).write()
    fileDB.set('lectures', []).write()
    db.get('lectures')
        .forEach(function(value) {
            var parsed = JSON.parse(value.lectures);
            for (i = 0; i < 5; i++) {
                fileDB.get('lectures')
                    .push({
                        cont: parsed.lectures[(8 * i) + 7],
                        accX: parsed.lectures[(8 * i) + 0],
                        accY: parsed.lectures[(8 * i) + 1],
                        accZ: parsed.lectures[(8 * i) + 2],
                        gyroX: parsed.lectures[(8 * i) + 3],
                        gyroY: parsed.lectures[(8 * i) + 4],
                        gyroZ: parsed.lectures[(8 * i) + 5],
                        millis: parsed.lectures[(8 * i) + 6],
                        id: parsed.ID
                    })
                    .write();
            }
        })
        .value();
    fileDB.write();
    jsonData = fileDB.getState();
    var csvData = new CSV(jsonData.lectures, {
        header: true
    }).encode();
    fs.writeFile('data.csv', csvData, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("the file was saved");
        saveZip()
    });
}

//------ web sockets ------//
//list of clients and sensors
var clients = [];
var sensors = [];
var android = [];

//save data or show only
var saving = false;
var patientName;
var currentTest;
wss.on('connection', function connection(ws, req) {
  var location = url.parse(req.url, true);
  console.log(ws.protocol);
  if (ws.protocol == "webclient") {
    console.log("agregar navegador");
    clients.push(ws);
  } else if(ws.protocol == "androidclient"){
    console.log("agregar celular");
    android.push(ws);
    clients.forEach(function(client) {
      client.send("connected", function ack(error) {
          // if error is not defined, the send has been completed,
          // otherwise the error object will indicate what failed.
      });
    });
  } else {
    console.log("agregar sensor");
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    sensors.push(ws);
  }

  ws.on('error', function handleError(error){
    console.log(error);
  })

  ws.on('close', function close() {
    clients.forEach(function(client) {
      client.send("disconnected", function ack(error) {
          // if error is not defined, the send has been completed,
          // otherwise the error object will indicate what failed.
      });
    });
    console.log('disconnected');
  });

  ws.on('message', function incoming(message) {
    var obj;
    console.log(message);
    try{
      obj = JSON.parse(message);
      goodJson = true;
    } catch(e){
      goodJson = false;
      console.log('Error parsing JSON package, omiting package');
    }
    if(goodJson){
      console.log(obj);
      saving = true;
      if (obj.type == "startRecording") {
        sensors.forEach(function(sensor) {
          sensor.send("startPreview", function ack(error) {
              // if error is not defined, the send has been completed,
              // otherwise the error object will indicate what failed.
          });
        });
        db.set('lectures', []).write();
      } else if (obj.type == "stopRecording") {
        sensors.forEach(function(sensor) {
          sensor.send("stopPreview", function ack(error) {
              // if error is not defined, the send has been completed,
              // otherwise the error object will indicate what failed.
          });
        });
        saving = false;
        console.log(obj.name);
        currentTest = obj.name
        processData();
      } else if(obj.type == "patient"){
        patientName = obj.name;
        fs.writeFile('metadata.json', JSON.stringify(obj, null, 4), (err) => {
          if(err) throw err;
        });
      } else {
        clients.forEach(function(client) {
          client.send(message, function ack(error) {
              // if error is not defined, the send has been completed,
              // otherwise the error object will indicate what failed.
          });
        });
        android.forEach(function(device){
          device.send(message, function ack(error){
            //TODO
          })
        })
        if (saving) {
          db.get('lectures')
            .push({
                lectures: message
            })
            .write();
        }
      }
    }
  });
});

function saveZip(){
  var d = new Date();
  var day = d.getDate();
  var month = d.getMonth() + 1;
  var year = d.getFullYear();
  var hour = d.getHours();
  var minutes = d.getMinutes();
  var seconds = d.getSeconds();
  var output = fs.createWriteStream(patientName + '-' + currentTest + '_' + day + '-' + month + '-' + year + '_' + hour + '-' + minutes + '-' + seconds +'.zip');
  var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
  });

  // listen for all archive data to be written
  output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    //console.log('archiver has been finalized and the output file descriptor has closed.');
  });

  // good practice to catch this error explicitly
  archive.on('error', function(err) {
    throw err;
  });

  // pipe archive data to the file
  archive.pipe(output);

  archive.file('metadata.json', { name: 'metadata.json' });
  archive.file('data.csv', { name: 'data.csv' });
  archive.finalize();
}

const interval = setInterval(function ping() {
  sensors.forEach(function each(sensor) {
    if (sensor.isAlive === false) {
      console.log('unexpected disconnection of ' + sensor.protocol);
      clients.forEach(function(client) {
        client.send("disconnected_error", function ack(error) {
            // if error is not defined, the send has been completed,
            // otherwise the error object will indicate what failed.
        });
      });
      var index = sensors.indexOf(sensor)
      if(index > -1){
        sensors.splice(index, 1);
      }
      return sensor.terminate();
    }
    sensor.isAlive = false
    sensor.ping(noop);
  });
}, 5000);

function heartbeat() {
  console.log(this.protocol + ' heartbeat')
  this.isAlive = true
}

function noop() {}

//------ server declaration ------//
server.on('request', app);
server.listen(port, rdy);

function rdy() {
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    console.log('Listening on ' + addresses[0] + ':' + server.address().port);
    opn("http://127.0.0.1:3000");
}
