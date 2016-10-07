window.onload = function() {
    function getDataPointsFromCSV(csv) {
        var dataPoints = csvLines = points = [];
        csvLines = csv.split(/[\r?\n|\r|\n]+/);
        headers = csvLines.shift();
        console.log(headers);
        console.log(csvLines);

        // for (var i = 0; i < csvLines.length; i++)
        //   if (csvLines[i].length > 0) {
        //     points = csvLines[i].split(",");
        //     dataPoints.push({
        //       x: parseFloat(points[0]),
        //       y: parseFloat(points[1])
        //     });
        //   }
        // return dataPoints;
    }

    $.get("sendFile", function(data) {
        getDataPointsFromCSV(data);
    });
};
