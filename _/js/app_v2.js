/**
 * GASLEAK DASHBOARD
 *
 * Dashboard for Gasleak Monitoring with Arduino and RTDB Firebase
 * 
 * Copyright (c) 2021 - now and forever, Debu Semesta
 *
 *
 * @package GASLEAK DASHBOARD
 * @author  Debu Semesta
 * @copyright   Copyright (c) 2021 - now and forever, Debu Semesta. (https://rootdicalism.wordpress.com/)
 * @link    https://github.com/noplanalderson/gasleak
 * @since   Version 1.0.2
 * @filesource
 * 
*/

    const VERSION = 'v1.1.0';

    // Initialize Datetime Range Picker
    $('#range').daterangepicker({
        timePicker: true,

        "locale": {
            "cancelLabel": 'Clear',
            "format": "YYYY-MM-DD HH:mm:ss",
        }
    });

    // Firebase Configuration
    var firebaseConfig = {
        apiKey: "AIzaSyBOOCVHszEFrz1Zfztf3jeQkRdkIl7KdGo",
        authDomain: "gasleak-d2ef7.firebaseapp.com",
        databaseURL: "https://gasleak-d2ef7-default-rtdb.asia-southeast1.firebasedatabase.app/",
        projectId: "gasleak-d2ef7",
        storageBucket: "gasleak-d2ef7.appspot.com",
        messagingSenderId: "912162436419",
        appId: "1:912162436419:web:c0f1903c4870bc83a5abf6",
        measurementId: "G-HN6ZYE5NB0"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    // Initialize Database Utility
    var database = firebase.database();

    var minDate, maxDate;

    var sensorLocations = [];

    var tableData = [];

    var table;

    var period = '';

    // Initialize Datatables
    $('#sensor_data_tbl').DataTable();

    // Get Sensors
    database.ref('/').on('value', function (snapshot) {

        var value = snapshot.val();
        
        var sensorNames = [];
        // Get Sensor Data from Every Sensor Name 
        $.each(value, function (index, value) {
            
            
            sensorNames.push('<option value="'+index+'">'+index+'</option>');
            $('#sensor_name').html(sensorNames);
        });
    });

    function getLeakTime(sensor, period = 'All the Time')
    {
        database.ref('/'+sensor+'/leak_time/').on('value', function (snap) {

            var sensor_data = snap.val();

            // Get Sensor Data from Every Sensor Name 
            $.each(sensor_data, function (index, value) {

                if (value) {

                    // Save Sensor Data to Array
                    tableData.push({leak_time:[value]});

                }
            })
        })

        // Destroy Datatables Before Re-draw it to Renew Data
        $('#sensor_data_tbl').DataTable().destroy();

        // Initialize Datatables
        table = $('#sensor_data_tbl').DataTable({

            "order": [[0,"desc"]],

            // Parsing Sensor Data form Array to Datatables
            "data" : tableData,
            // Enable Ordering by First Colum (Datetime)
            columns : [
                {
                    "data" : "leak_time",
                },
            ],
            // Enable Datatables Responsive
            responsive: true,
            // Datatables Button Configurations
            dom: "<'row'<'col-sm-12 col-md-6'l>>" +
            "<'row'<'col-sm-12 mt-4 mb-2'Btr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            buttons: [
            'copy',
            'print',
            {
                extend: 'excelHtml5',
                pageSize: 'A4',
                title: "Sensor Data - " + sensor + " (" + period + ")",
                messageTop: "Sensor Data - " + period + "\n",
                messageTop: "Period : " + period + "\n\n\n",
                exportOptions: {
                    columns: [0],
                }
            },
            {
                extend: 'csv',
                exportOptions: {
                    columns : [0]
                }
            },
            {
                extend: 'pdfHtml5',
                pageSize: 'A4',
                orientation: 'potrait',
                title: "Sensor Data - " + sensor + " (" + period + ")",
                customize : function(doc) {
                    doc.content.splice(0, 1, {
                        text: [{
                            text: "Sensor Data " + sensor + "\n",
                            fontSize: 14,
                            alignment: 'center'
                        }, 
                        {
                            text: "Period : " + period + "\n\n\n",
                            fontSize: 11,
                            alignment: 'center'
                        }]
                    });
                    doc.content[1].margin = [ 10, 0, 10, 0 ];
                    doc.content[1].table.widths = [300];
                },
                exportOptions: {
                    columns: [0],
                }
            }]
        });
    }


    $('#sensor_name').on('change', function () {
        var sensorName = $('#sensor_name').val();
        $('.title').text('Sensor Data: '+ sensorName);
        tableData = [];
        getLeakTime(sensorName);
    })
    
    $('.applyBtn').on('click', function () {

        // Custom filtering function which will search data in column four between two values
        $.fn.dataTable.ext.search.push(
            function( settings, data, dataIndex ) {
                var range = $('#range').val().split(' - ');
                var min = new Date(range[0]);
                var max = new Date(range[1]);
                var date = new Date(data[0]);
                const options = { year: 'numeric', month: 'long', day: 'numeric', hour:'numeric', minute:'numeric', second:'numeric'  };
                var minPeriod = min.toLocaleDateString('id-ID', options);  
                var maxPeriod = max.toLocaleDateString('id-ID', options);  

                period = minPeriod + ' - ' + maxPeriod;
                if (
                    ( min === null && max === null ) ||
                    ( min === null && date <= max ) ||
                    ( min <= date  && max === null ) ||
                    ( min <= date  && date <= max )
                ) {
                    return true;
                }
                return false;
            }
        );
        
        // Refilter the table
        $('#range').on('change', function () {
            
            var sensorName = $('#sensor_name').val();
            $('#period').text('Period :' + $('#range').val());
            
            tableData = [];
            
            getLeakTime(sensorName, $('#range').val());
        });
    })

    // Get Sensor Name for Graph Indicators
    database.ref('/').on('value', function (snapshot) {

        var value = snapshot.val();

        var graph = [];

        var colors = [];

        var sensors = [];

        $.each(value, function (index, value) {

            // Generate Sensor Indicators
            graph.push('<div class="led-box mb-4"><div id="'+index+'" class=""></div><p>'+index+'</p></div>');
            
            $('.indicator').html(graph);
            
            sensors.push(index);

            database.ref('/'+index+'/').on('value', function (snap) {

                if (value) {

                    // Show led-red if leak_status is true, and led-green if false
                    var color = (value.sensor_status == true) ? 'led-red' : 'led-green';
                    colors.push(color);
                }
            });

        });

        // Create Alarm Sound and Sensor Color Indicators
        for(var i = 0; i < sensors.length; i++) {
            if(colors[i] === 'led-red') {
                document.getElementById('audio-down').play();
                document.getElementById('audio-down').muted = false;
            }
            else
            {
                document.getElementById('audio-up').play();
                document.getElementById('audio-up').muted = false;
            }

            // Change led color based on leak_status
            $('#'+sensors[i]).attr('class', colors[i]);
        }
    });

    // Get Browser Permission
    function getLocalStream() {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            sound: true
        }).then(stream => {
            window.localAudio.srcObject  = stream;
            window.localAudio.autoplay = true;
        }).catch(err => {
            console.log("Error: " + err)
        });
    }

    getLocalStream();

    // Get All Sensors for Chart 
    database.ref('/').on('value', function (snapshot) {

        var value = snapshot.val();

        var chartData = [];

        var sensorLists = [];

        var count = [];

        // Get Sensor Data from Every Sensor Name 
        $.each(value, function (index, value) { 
            
            sensorLists.push(index);

            sensorLists.reverse()
            
            var leakStatus = [];

            // Get data where leak_status = true
            database.ref('/'+index+'/leak_time').on('value', function (snap) {

                var leak_data = snap.val();

                var leaks = [];

                $.each(leak_data, function (index_data, leak) {

                    if (leak) {

                        leaks.push(leak);
                        const arrFiltered = leaks.filter(el => {
                          return el != null && el != '';
                        });

                    }
                })

                leakStatus.push(leaks.length);

                // console.log(leaks);
            })
            
            chartData.push({name:index, data:[leakStatus]});
        });

        // Convert Leak Counter Array to JSON
        var jsonData = JSON.stringify(chartData);

        // Begin Highchart
        $(function () {
            var chartype = {
                type: 'column'
            }
            var chartitle = {
                text: 'Leak Counter'
            }
            var chartsubtitle = {
                text: 'Gasleak Dashboard'
            }
            var chartxaxis = {
                categories: [
                    'Sensor Name',
                ],
                crosshair: true
            }
            var chartyaxis = {
                min: 0,
                allowDecimals: false,
                title: {
                    text: 'Leak Total (Event)'
                }
            }
            var chartooltip = {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            }
            var chartplotoptions = {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            }
            var chartseries = JSON.parse(jsonData)
            $('#graph-counter').highcharts({
                chart:chartype,
                title: chartitle,
                subtitle:chartsubtitle,
                xAxis:chartxaxis,
                yAxis: chartyaxis,
                tooltip: chartooltip,
                plotOptions: chartplotoptions,
                series: chartseries,
                animation: true
            });
        });
    });

    // Show year in copyright
    var year = new Date().getFullYear();
    $('.year').text(year);

    // Show dashboard version
    $('.version').text(VERSION);