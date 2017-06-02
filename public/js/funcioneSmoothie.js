var banPreview = false;
var banSave = false;
var ws;
var dps = [];
var nSensors = 4; // Number of sensors
var nLecPackage = 5; // Number of lectures per JSON package
var charts = [];
var calibrated = 0;

window.onload = function() {
  document.getElementById("btnStartSaving").disabled = true;
  //document.getElementById("btnExport").disabled = true;
  //document.getElementById("btnExport").style.visibility = 'hidden';

  for(var i = 0; i < nSensors; i++){
    // Initialize an empty TimeSeries for each axis
    dps[i] = [new TimeSeries(), new TimeSeries(), new TimeSeries(), new TimeSeries(), new TimeSeries(), new TimeSeries()];
    initPlot(i);
  }
  setupWebSocket();
};

function setupWebSocket() {
  var host = window.document.location.host.replace(/:.*/, '');
  ws = new WebSocket('ws://' + host + ':3000', 'client');

  // Log errors
  ws.onerror = function(error) {
      console.log('WebSocket Error ' + error);
  };

  // Log messages from the server
  ws.onmessage = function(e) {
    try {
      var lectures = JSON.parse(e.data);
      for (i = 0; i < nLecPackage; i++) {
        for (j = 0; j < 6; j++) {
          var index = (8 * i) + j;
          dps[lectures.ID - 1][j].append(new Date().getTime(), lectures.lectures[index]);
        }
      }
    } catch (e){
      console.log(e);
    }
  };
}

// Send message to sensors
function startPreview() {
  banPreview = !banPreview;
  if (banPreview) {
    $("#btnStartPreview").html('Stop data');
    document.getElementById("btnStartSaving").disabled = false;
    var msg = {
      type: "startRecording",
    };
    ws.send(JSON.stringify(msg));
  } else {
    $("#btnStartPreview").html('Start data');
    document.getElementById("btnStartSaving").disabled = true;
    var msg = {
      type: "stopRecording",
    };
    ws.send(JSON.stringify(msg));
  }
}

var seriesOptions = [
  { strokeStyle: 'rgba(255, 0, 0, 1)', lineWidth: 1 },
  { strokeStyle: 'rgba(0, 255, 0, 1)', lineWidth: 1 },
  { strokeStyle: 'rgba(0, 0, 255, 1)', lineWidth: 1 },
  { strokeStyle: 'rgba(255, 255, 0, 1)', lineWidth: 1 },
  { strokeStyle: 'rgba(192, 192, 192, 1)', lineWidth: 1 },
  { strokeStyle: 'rgba(255, 0, 255, 1)', lineWidth: 1 }
];

function initPlot(plotID){
  var name = "sensor".concat(plotID + 1);
  charts[plotID] = new SmoothieChart({responsive: true, millisPerPixel: 30, grid:{millisPerLine:6000,verticalSections:0,borderVisible:false}});
  for(var i = 0; i < dps[plotID].length; i++){
    charts[plotID].addTimeSeries(dps[plotID][i], seriesOptions[i]);
  }
  charts[plotID].streamTo(document.getElementById(name), 10);
}
