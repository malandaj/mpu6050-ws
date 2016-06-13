var dpsAccXS1 = []; // dataPoints Acc Sensor1
var dpsAccYS1 = []; // dataPoints Acc Sensor1
var dpsAccZS1 = []; // dataPoints Acc Sensor1
var dpsGyroXS1 = []; // dataPoints Gyro Sensor1
var dpsGyroYS1 = []; // dataPoints Gyro Sensor1
var dpsGyroZS1 = []; // dataPoints Gyro Sensor1
var dpsAccXS2 = []; // dataPoints Acc Sensor1
var dpsAccYS2 = []; // dataPoints Acc Sensor1
var dpsAccZS2 = []; // dataPoints Acc Sensor1
var dpsGyroXS2 = []; // dataPoints Gyro Sensor1
var dpsGyroYS2 = []; // dataPoints Gyro Sensor1
var dpsGyroZS2 = []; // dataPoints Gyro Sensor1
var dataLength = 300; // number of dataPoints visible at any point
var s1AccChart;
var s1GyroChart;
var s2AccChart;
var s2GyroChart;
var ws;
var banPreview = false;
var banSave = false;

window.onload = function () {
	document.getElementById("btnStartSaving").disabled = true;
	$('#btnDownload').attr('disabled', true);
	$('#btnDownload').bind('click', false);
	s1AccChart = new CanvasJS.Chart("sensor1Acc",{
		backgroundColor: "transparent",
		axisY:{
			gridColor: "rgba(255,255,255,.05)",
			tickColor: "rgba(255,255,255,.05)",
			labelFontColor: "#a2a2a2"
		},
		axisX:{
			labelFontColor: "#a2a2a2"
		},
		data:[{
			type: "line",
			showInLegend: true,
			name: "X",
			dataPoints: dpsAccXS1
		},{
			type: "line",
			showInLegend: true,
			name: "Y",
			dataPoints: dpsAccYS1
		},{
			type: "line",
			showInLegend: true,
			name: "Z",
			dataPoints: dpsAccZS1
		}],
		legend: {
			cursor:"pointer",
			itemclick : function(e) {
				if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
				e.dataSeries.visible = false;
				}
				else {
					e.dataSeries.visible = true;
				}
				s1AccChart.render();
			}
		}
	});
	s1GyroChart = new CanvasJS.Chart("sensor1Gyro",{
		backgroundColor: "transparent",
		axisY:{
			gridColor: "rgba(255,255,255,.05)",
			tickColor: "rgba(255,255,255,.05)",
			labelFontColor: "#a2a2a2"
		},
		axisX:{
			labelFontColor: "#a2a2a2"
		},
		data:[{
			type: "line",
			showInLegend: true,
			name: "X",
			dataPoints: dpsGyroXS1
		},{
			type: "line",
			showInLegend: true,
			name: "Y",
			dataPoints: dpsGyroYS1
		},{
			type: "line",
			showInLegend: true,
			name: "Z",
			dataPoints: dpsGyroZS1
		}],
		legend: {
			cursor:"pointer",
			itemclick : function(e) {
				if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
				e.dataSeries.visible = false;
				}
				else {
					e.dataSeries.visible = true;
				}
				s1GyroChart.render();
			}
		}
	});

	s2AccChart = new CanvasJS.Chart("sensor2Acc",{
		backgroundColor: "transparent",
		axisY:{
			gridColor: "rgba(255,255,255,.05)",
			tickColor: "rgba(255,255,255,.05)",
			labelFontColor: "#a2a2a2"
		},
		axisX:{
			labelFontColor: "#a2a2a2"
		},
		data:[{
			type: "line",
			showInLegend: true,
			name: "X",
			dataPoints: dpsAccXS2
		},{
			type: "line",
			showInLegend: true,
			name: "Y",
			dataPoints: dpsAccYS2
		},{
			type: "line",
			showInLegend: true,
			name: "Z",
			dataPoints: dpsAccZS2
		}],
		legend: {
			cursor:"pointer",
			itemclick : function(e) {
				if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
				e.dataSeries.visible = false;
				}
				else {
					e.dataSeries.visible = true;
				}
				s2AccChart.render();
			}
		}
	});
	s2GyroChart = new CanvasJS.Chart("sensor2Gyro",{
		backgroundColor: "transparent",
		axisY:{
			gridColor: "rgba(255,255,255,.05)",
			tickColor: "rgba(255,255,255,.05)",
			labelFontColor: "#a2a2a2"
		},
		axisX:{
			labelFontColor: "#a2a2a2"
		},
		data:[{
			type: "line",
			showInLegend: true,
			name: "X",
			dataPoints: dpsGyroXS2
		},{
			type: "line",
			showInLegend: true,
			name: "Y",
			dataPoints: dpsGyroYS2
		},{
			type: "line",
			showInLegend: true,
			name: "Z",
			dataPoints: dpsGyroZS2
		}],
		legend: {
			cursor:"pointer",
			itemclick : function(e) {
				if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
				e.dataSeries.visible = false;
				}
				else {
					e.dataSeries.visible = true;
				}
				s2GyroChart.render();
			}
		}
	});
	setupWs();
}

function setupWs(){
	var host = window.document.location.host.replace(/:.*/, '');
  ws = new WebSocket('ws://' + host + ':8080');

  ws.onmessage = function (event) {
		if(event.data == "fileRdy"){
			NProgress.done();
			$('#btnDownload').attr('disabled', false);
			$('#btnDownload').unbind('click', false);
			swal("File ready!", "You download the data using the button below the charts", "success")
		}else{
			var lecture = JSON.parse(event.data);
			if(lecture.ID == "Sensor1"){
				dpsAccXS1.push({
					x: lecture.cont,
					y: lecture.accX
				});
				dpsAccYS1.push({
					x: lecture.cont,
					y: lecture.accY
				});
				dpsAccZS1.push({
					x: lecture.cont,
					y: lecture.accZ
				});

				dpsGyroXS1.push({
					x: lecture.cont,
					y: lecture.gyroX
				});
				dpsGyroYS1.push({
					x: lecture.cont,
					y: lecture.gyroY
				});
				dpsGyroZS1.push({
					x: lecture.cont,
					y: lecture.gyroZ
				});

				if (dpsAccXS1.length == dataLength){
					dpsAccXS1.shift();
					dpsAccYS1.shift();
					dpsAccZS1.shift();
					dpsGyroXS1.shift();
					dpsGyroYS1.shift();
					dpsGyroZS1.shift();
				}

				s1AccChart.render();
				s1GyroChart.render();
			}else if(lecture.ID == "Sensor2") {
				dpsAccXS2.push({
					x: lecture.cont,
					y: lecture.accX
				});
				dpsAccYS2.push({
					x: lecture.cont,
					y: lecture.accY
				});
				dpsAccZS2.push({
					x: lecture.cont,
					y: lecture.accZ
				});

				dpsGyroXS2.push({
					x: lecture.cont,
					y: lecture.gyroX
				});
				dpsGyroYS2.push({
					x: lecture.cont,
					y: lecture.gyroY
				});
				dpsGyroZS2.push({
					x: lecture.cont,
					y: lecture.gyroZ
				});

				if (dpsAccXS2.length == dataLength){
					dpsAccXS2.shift();
					dpsAccYS2.shift();
					dpsAccZS2.shift();
					dpsGyroXS2.shift();
					dpsGyroYS2.shift();
					dpsGyroZS2.shift();
				}

				s2AccChart.render();
				s2GyroChart.render();
			}
		}
  };
}

function startPreview(){
	banPreview = !banPreview;
	if (banPreview){
		$("#btnStartPreview").html('Stop data');
		document.getElementById("btnStartSaving").disabled = false;
	}else{
		$("#btnStartPreview").html('Start data');
		document.getElementById("btnStartSaving").disabled = true;
	}
	ws.send("startPreview");
}

function startSaving(){
	banSave = !banSave;
	if(banSave){
		$("#btnStartSaving").html('Stop saving data');
		ws.send("startSaving");
	}else{
		$("#btnStartSaving").html('Start saving data');
		ws.send("stopSaving");
		NProgress.start();
		$("#btnStartPreview").html('Start data');
		ws.send("startPreview");
	}
}
