var nSensors = 2;
window.onload = function() {
    function getDataPointsFromCSV(csv) {
        var dataPoints = csvLines = points = [];
        for (i = 0; i < nSensors; i++) {
            dataPoints[i] = [];
            for (j = 0; j < 6; j++) {
                dataPoints[i][j] = [];
            }
        }
        csvLines = csv.split(/[\r?\n|\r|\n]+/);
        headers = csvLines.shift();
        var counters = [];
        for (var i = 0; i < csvLines.length; i++)
            if (csvLines[i].length > 0) {
                points = csvLines[i].split(",");
                var id = points[8];
                id = id.replace(/"/g, "");
                for(j = 1; j < 7; j++){
                    dataPoints[parseInt(id)-1][j-1].push({
                            x: parseInt(points[0]),
                            y: parseInt(points[j])
                    });
                }
            }
        return dataPoints;
    }

    $.get("sendFile", function(data) {
        var dps = getDataPointsFromCSV(data);
        var charts = [];
        for (i = 0; i < nSensors; i++) {
            var name = "sensor".concat(i + 1);
            charts[i] = new CanvasJS.Chart(name, {
                backgroundColor: "transparent",
                axisY: {
                    gridColor: "rgba(255,255,255,.05)",
                    tickColor: "rgba(255,255,255,.05)",
                    labelFontColor: "#a2a2a2"
                },
                axisX: {
                    labelFontColor: "#a2a2a2"
                },
                data: [{
                    type: "line",
                    showInLegend: true,
                    name: "accX",
                    dataPoints: dps[i][0]
                }, {
                    type: "line",
                    showInLegend: true,
                    name: "accY",
                    dataPoints: dps[i][1]
                }, {
                    type: "line",
                    showInLegend: true,
                    name: "accZ",
                    dataPoints: dps[i][2]
                }, {
                    type: "line",
                    showInLegend: true,
                    name: "gyroX",
                    dataPoints: dps[i][3]
                }, {
                    type: "line",
                    showInLegend: true,
                    name: "gyroY",
                    dataPoints: dps[i][4]
                }, {
                    type: "line",
                    showInLegend: true,
                    name: "gyroZ",
                    dataPoints: dps[i][5]
                }],
                zoomEnabled: true,
                legend: {
                    cursor: "pointer",
                    itemclick: function(e) {
                        if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible)
                            e.dataSeries.visible = false;
                        else
                            e.dataSeries.visible = true;
                        e.chart.render();
                    }
                }
            });
            charts[i].render();
        }
    });
};
