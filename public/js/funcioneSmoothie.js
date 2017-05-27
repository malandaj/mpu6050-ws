var banPreview = false;
var banSave = false;
var ws;
var dps = [];
var nSensors = 1; // Number of sensors
var nLecPackage = 5; // Number of lectures per JSON package
var charts = [];
var calibrated = 0;

window.onload = function() {
  document.getElementById("btnStartSaving").disabled = true;
  //document.getElementById("btnExport").disabled = true;
  //document.getElementById("btnExport").style.visibility = 'hidden';
  for (i = 0; i < nSensors; i++) {
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

    } catch (e){
      console.log(e);
    }
  };
}

var seriesOptions = [
  { strokeStyle: 'rgba(255, 0, 0, 1)', fillStyle: 'rgba(255, 0, 0, 0.1)', lineWidth: 1 },
  { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.1)', lineWidth: 1 },
  { strokeStyle: 'rgba(0, 0, 255, 1)', fillStyle: 'rgba(0, 0, 255, 0.1)', lineWidth: 1 },
  { strokeStyle: 'rgba(255, 255, 0, 1)', fillStyle: 'rgba(255, 255, 0, 0.1)', lineWidth: 1 }
  { strokeStyle: 'rgba(192, 192, 192, 1)', fillStyle: 'rgba(192, 192, 192, 0.1)', lineWidth: 1 }
  { strokeStyle: 'rgba(255, 0, 255, 1)', fillStyle: 'rgba(255, 0, 255, 0.1)', lineWidth: 1 }
];

function initPlot(plotID){
  // Initialize an empty TimeSeries for each axis
  var axisDataSets = [new TimeSeries(), new TimeSeries(), new TimeSeries(), new TimeSeries(), new TimeSeries(), new TimeSeries()];
  var plot = new SmoothieChart();
  for (var i = 0; i < axisDataSets.length; i++){
    plot.addTimeSeries(axisDataSets[i], seriesOptions[i]);
  }
}
