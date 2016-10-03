var banPreview = false;
var banSave = false;
var ws;
var dps = new Array();
var nSensors = 2;
var nLecPackage = 5; // Number of lectures per JSON package
var charts = new Array();
var calibrated = 0;

window.onload = function () {
	document.getElementById("btnStartSaving").disabled = true;
	$('#btnDownload').attr('disabled', true);
	$('#btnDownload').bind('click', false);
	for (i=0; i < nSensors; i++){
		dps[i] = new Array();
		for(j = 0; j < 8; j++){
			dps[i][j] = new Array();
		}
	}
	setupWebSocket();
	setupPlots();
}

function setupWebSocket(){
	var host = window.document.location.host.replace(/:.*/, '');
	ws = new WebSocket('ws://' + host + ':3000', 'client');

	// Log errors
	ws.onerror = function (error) {
  	console.log('WebSocket Error ' + error);
	};

	// Log messages from the server
	ws.onmessage = function (e) {
		try{
			var lectures = JSON.parse(e.data);
			for(i = 0; i < nLecPackage; i++){
				for(j = 0; j < 8; j++){
					var index = (8 * i)+j;
					dps[lectures.ID - 1][j].push({
						x: lectures.lectures[(8 * i)+7],
						y: lectures.lectures[index]
					})
					console.log(lectures.lectures[(8 * i)+6]);
				}
			}
		}catch(e){
			calibrated += 1;
			if(calibrated == nSensors){
				console.log("Calibration Complete");
				NProgress.done();
				swal.close();
				swal(
				  'Success',
				  'Calibration complete!',
				  'success'
				)
			}
		}

		// var sum = 0;
		// for(i=0; i < dps[0][6].length - 1; i++){
		// 	sum += (dps[0][6][i + 1].y) - (dps[0][6][i].y)
		// }

		var dataLength = 500; // number of dataPoints visible at any point - 10 seconds
		if(dps[nSensors - 1][7].length == dataLength){
			for(i = 0; i < nSensors; i++){
				for(j = 0; j < 8; j++){
					for(z = 0; z < nLecPackage; z++)
						dps[i][j].shift();
				}
			}
		}
		for(i = 0; i < nSensors; i++)
			charts[i].render();
	};
}

function startPreview(){
	banPreview = !banPreview;
	if (banPreview){
		$("#btnStartPreview").html('Stop data');
		document.getElementById("btnStartSaving").disabled = false;
		ws.send("startPreview");
	}else{
		$("#btnStartPreview").html('Start data');
		document.getElementById("btnStartSaving").disabled = true;
		ws.send("stopPreview");
	}
}

function startSaving(){
	banSave = !banSave;
	if(banSave){
		$("#btnStartSaving").html('Stop saving data');
		ws.send("startSaving");
	}else{
		$("#btnStartSaving").html('Start saving data');
		ws.send("stopSaving");
		$("#btnStartPreview").html('Start data');
	}
}

// function calibrate() {
// 	ws.send("calibrate")
// 	NProgress.start();
// 	indeterminateProgress.start();
// }

function calibrate(){
	swal({
	  title: 'Calibration',
	  text: 'Your MPU6050 should be placed in horizontal position, with package letters facing up. Don\'t touch it until you see a finish message.',
	  type: 'info',
		allowOutsideClick: false,
		allowEscapeKey: false,
	  showCancelButton: true,
		confirmButtonColor: '#1CA8DD',
		cancelButtonColor: '#d33',
	  confirmButtonText: 'Start calibration',
	}).then(function() {
		ws.send("calibrate")
		NProgress.start();
	  swal({
			title: 'Calibration in progress',
			text: 'Please wait. Don\'t touch the sensor until you see a finish message.',
			type: 'info',
			showConfirmButton: false,
			allowOutsideClick: false,
			allowEscapeKey: false
		})
	});
}

function setupPlots() {
	for(i = 0; i < nSensors; i++){
		var name = "sensor".concat(i + 1);
		charts[i] = new CanvasJS.Chart(name,{
			backgroundColor: "transparent",
			axisY:{
				gridColor: "rgba(255,255,255,.05)",
				tickColor: "rgba(255,255,255,.05)",
				labelFontColor: "#a2a2a2"
			},
			axisX:{
				labelFontColor: "#a2a2a2"
			},
			data: [{
				type: "line",
				showInLegend: true,
				name: "accX",
				dataPoints: dps[i][0]
			},{
				type: "line",
				showInLegend: true,
				name: "accY",
				dataPoints: dps[i][1]
			},{
				type: "line",
				showInLegend: true,
				name: "accZ",
				dataPoints: dps[i][2]
			},{
				type: "line",
				showInLegend: true,
				name: "gyroX",
				dataPoints: dps[i][3]
			},{
				type: "line",
				showInLegend: true,
				name: "gyroY",
				dataPoints: dps[i][4]
			},{
				type: "line",
				showInLegend: true,
				name: "gyroZ",
				dataPoints: dps[i][5]
			}],
			legend: {
				cursor: "pointer",
				itemclick: function (e) {
					if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible)
						e.dataSeries.visible = false;
					else
						e.dataSeries.visible = true;
					e.chart.render();
				}
			}
		});
	}
}
