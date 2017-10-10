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
    fs = require('fs');

var archiver = require('archiver');
//const fs = require('fs')
const low = require('lowdb');
const fileAsync = require('lowdb/lib/file-async');

// Start database using file-async storage
const db = low();

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
    res.download(__dirname + '/data.csv', 'data.csv');
});

function processData() {
    const rawData = low('data.json', {
        storage: fileAsync,
        writeOnChange: false
    });
    rawData.defaults({
            lectures: []
        })
        .value();
    rawData.set('lectures', [])
        .value();
    db.get('lectures')
        .forEach(function(value) {
            var parsed = JSON.parse(value.lectures);
            for (i = 0; i < 5; i++) {
                rawData.get('lectures')
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
                    .value();
            }
        })
        .value();
    rawData.write();
    jsonData = rawData.getState();
    var csvData = new CSV(jsonData.lectures, {
        header: true
    }).encode();
    console.log(csvData);
    fs.writeFile('data.csv', csvData, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("the file was saved");
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
wss.on('connection', function connection(ws, req) {
  var location = url.parse(req.url, true);
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
    console.log("agregar esp8266");
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
    try{
      obj = JSON.parse(message);
      goodJson = true;
    } catch(e){
      goodJson = false;
      console.log('Error parsing JSON package, omiting package');
    }
    if(goodJson){
      saving = true;
      if (obj.type == "startRecording") {
        sensors.forEach(function(sensor) {
          sensor.send("startPreview", function ack(error) {
              // if error is not defined, the send has been completed,
              // otherwise the error object will indicate what failed.
          });
        });
        db.set('lectures', [])
          .value();
      } else if (obj.type == "stopRecording") {
        sensors.forEach(function(sensor) {
          sensor.send("stopPreview", function ack(error) {
              // if error is not defined, the send has been completed,
              // otherwise the error object will indicate what failed.
          });
        });
        saving = false;
        processData();
      } else if(obj.type == "patient"){
        patientName = obj.name;
        fs.writeFile('metadata.json', JSON.stringify(obj, null, 4), (err) => {
          if(err) throw err;
        });
      } else if(obj.type == "saveZip"){
        var d = new Date();
        var day = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        var hour = d.getHours();
        var minutes = d.getMinutes();
        var seconds = d.getSeconds();
        var output = fs.createWriteStream(__dirname + '/' + patientName + '-' + obj.name + '_' + day + '-' + month + '-' + year + '_' + hour + '-' + minutes + '-' + seconds +'.zip');
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
      } else {
        console.log(message);
        clients.forEach(function(client) {
          client.send(message, function ack(error) {
              // if error is not defined, the send has been completed,
              // otherwise the error object will indicate what failed.
          });
        });
        if (saving) {
          db.get('lectures')
            .push({
                lectures: message
            })
            .value();
        }
      }
    }
  });
});

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
}
