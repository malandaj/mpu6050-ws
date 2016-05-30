window.onload = function () {
	var dps = []; // dataPoints
	var chart = new CanvasJS.Chart("sensor1ChartContainer",{
		title :{
			text: "Live Random Data"
		},
		data: [{
			type: "line",
			dataPoints: dps
		}]
	});

	var xVal = 0;
	var yVal = 100;
	var updateInterval = 10;
	var dataLength = 500; // number of dataPoints visible at any point

	var updateChart = function (count) {
		count = count || 1;
		// count is number of times loop runs to generate random dataPoints.

		for (var j = 0; j < count; j++) {
			yVal = yVal +  Math.round(5 + Math.random() *(-5-5));
			dps.push({
				x: xVal,
				y: yVal
			});
			xVal++;
		};
		if (dps.length > dataLength)
		{
			dps.shift();
		}

		chart.render();

	};

	// generates first set of dataPoints
	updateChart(dataLength);

	// update chart after specified time.
	setInterval(function(){updateChart()}, updateInterval);
}
