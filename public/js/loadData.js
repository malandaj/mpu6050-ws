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
        //console.log(headers);
        var counters = [];
        for (var i = 0; i < csvLines.length; i++)
            if (csvLines[i].length > 0) {
                points = csvLines[i].split(",");
                var id = points[8];
                id = id.replace(/"/g, "");
                for (j = 1; j < 7; j++) {
                    dataPoints[parseInt(id) - 1][j - 1].push({
                        x: parseInt(points[0]),
                        y: parseInt(points[j])
                    });
                }
            }
        return {
            header: headers,
            data: dataPoints[0].concat(dataPoints[1])
        };
    }

    $.get("sendFile", function(data) {
        var obj = getDataPointsFromCSV(data);
        var dps = obj.data;
        var headers = obj.header;
        console.log(headers);
        var chart = new CanvasJS.Chart("sensors", {
            backgroundColor: "transparent",
            zoomEnabled: true,
            exportEnabled: true,
            axisY: {
                gridColor: "rgba(255,255,255,.05)",
                tickColor: "rgba(255,255,255,.05)",
                labelFontColor: "#a2a2a2"
            },
            axisX: {
                labelFontColor: "#a2a2a2"
            },
            data: [],
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
        headers = headers.split(",");
        var headerArray = [];
        var cont = 1;
        var sCount = 1;
        var sLabel = 'Sensor'
        for (i = 0; i < nSensors * 6; i++) {
            if (cont == 7) {
                cont = 1;
                sCount = sCount + 1;
            }
            headerArray[i] = sLabel.concat(' ' + sCount + ' ').concat(headers[cont].replace(/"/g, ""));
            cont = cont + 1;
        }
        for (i = 0; i < dps.length; i++) {
            var newSeries = {
                type: "line",
                label: headerArray[i],
                toolTipContent: "{label}<br/>x: {x}, y: {y}",
                dataPoints: dps[i],
                showInLegend: true,
                name: headerArray[i]
            };
            chart.options.data.push(newSeries);
        }
        chart.render();
    });
};
