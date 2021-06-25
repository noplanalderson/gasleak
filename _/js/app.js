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

    const VERSION = 'v1.0.2';

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

    var lastIndex = 0;

    var minDate, maxDate;

    var table;

    // Get Sensors
    database.ref('sensor_data/').on('value', function (snapshot) {

        var value = snapshot.val();

        var data = [];
        
        // Get Sensor Data from Every Sensor Name 
        $.each(value, function (index, value) {
            
            database.ref('sensor_data/'+index+'/').on('value', function (snap) {

                var sensor_data = snap.val();

                $.each(sensor_data, function (index_data, sensor_value) {

                    if (sensor_value) {

                        // Save Sensor Data to Array
                        data.push(sensor_value);
                    }

                    // Save Last Index of Sensor Data
                    lastIndex = index_data;
                })
            })
        });
        
        // Destroy Datatables Before Re-draw it to Renew Data
        $('#sensor_data_tbl').DataTable().destroy();

        var period;

        // Initialize Datatables
        table = $('#sensor_data_tbl').DataTable({

            // Enable Ordering by First Colum (Datetime)
            "order": [[0,"desc"]],

            // Create Select Filter After init Complete 
            initComplete: function() {
                this.api().columns().every( function (i) {
                if(i == 1 || i == 2 || i == 3)
                {
                    var column = this;
                    var select = $('<select><option value="">Show all</option></select>')
                        .appendTo($(column.footer()).empty())
                        .on('change', function () {
                            var val = $.fn.dataTable.util.escapeRegex($(this).val());
                            column.search(val ? '^'+val+'$' : '', true, false).draw();
                        })

                    column.data().unique().sort().each(function (d,j) {
                        if(column.search() === '^'+d+'$') {
                            select.append('<option value="'+d+'" selected="selected">'+d+'</option>')
                        }
                        else
                        {
                            select.append('<option value="'+d+'">'+d+'</option>');
                        }
                    });
                }
                });
            },

            // Parsing Sensor Data form Array to Datatables
            "data" : data,
                columns : [
                {"data" : "datetime"},
                {"data" : "sensor_name"},
                {"data" : "sensor_location"},
                {"data" : "leak_status"},
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
                title: "Sensor Data - " + period,
                messageTop: "Sensor Data - " + period + "\n",
                messageTop: "Period : " + period + "\n\n\n",
                exportOptions: {
                    columns: ':visible',
                }
            },
            {
                extend: 'csv',
                exportOptions: {
                    columns : ':visible'
                }
            },
            {
                extend: 'pdfHtml5',
                pageSize: 'A4',
                orientation: 'potrait',
                title: "Sensor Data - " + period,
                customize : function(doc) {
                    doc.content.splice(0, 1, {
                        text: [{
                            text: "Sensor Data \n",
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
                    doc.content[1].table.widths = [130,130,130,80];
                },
                exportOptions: {
                    columns: ':visible',
                }
            },
            {
                extend: 'colvis',
                text: 'Hide Column'
            }]
        });
    });

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
                    $('#period').text(period);
                    return true;
                }
                return false;
            }
        );
        
        // Refilter the table
        $('#range').on('change', function () {
            table.draw();
        });
    })
    // Get Sensor Name for Graph Indicators
    database.ref('sensor_data/').on('value', function (snapshot) {

        var value = snapshot.val();

        var sensors = [];

        var dataLeak = [];

        var graph = [];

        var colors = [];

        $.each(value, function (index, value) {

            // Save Sensor Name to Array
            sensors.push(index);

            // Save Graph to Array Before Rendering
            graph.push('<div class="led-box mb-4"><div id="'+index+'" class=""></div><p>'+index+'</p></div>');
            
            // Rendering Sensor Graph into .indicator class
            $('.indicator').html(graph);
            
            // Get Last Sensor Datetime Event
            database.ref('sensor_data/'+index+'/').orderByKey().limitToLast(1).on('value', function (snap) {

                var sensor_data = snap.val();

                $.each(sensor_data, function (index_data, sensor_data) {

                    if (sensor_data) {

                        // Save datetime from every Sensors to Array
                        dataLeak.push(sensor_data);

                        // Show led-red if leak_status iss true, and led-green if false
                        var color = (sensor_data.leak_status == true) ? 'led-red' : 'led-green';
                        
                        // Save Sensor Color State to Array
                        colors.push(color);
                    }
                })
            });

        });
        
        // Create Alarm Sound and Sensor Color Indicators
        for(var i = 0; i < sensors.length; i++) {
            num = i - 1;
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
            video: false,
            audio: true,
            sound: true
        }).then(stream => {
            window.localStream = stream;
            window.localAudio.srcObject  = stream;
            window.localAudio.autoplay = true;
        }).catch(err => {
            console.log("Error: " + err)
        });
    }

    getLocalStream();

    // Get All Sensors for Chart 
    database.ref('sensor_data/').on('value', function (snapshot) {

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
            database.ref('sensor_data/'+index+'/').orderByChild('leak_status').equalTo(true).on('value', function (snap) {

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