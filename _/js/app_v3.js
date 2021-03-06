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

    // Konstanta untuk Versi Dashboard
    const VERSION = 'v1.4.1';

    /**
     *
     * Menginisialiasi plugin daterange picker
     * Aktifkan mode timepicker
     * Gunakan format YYYY-MM-DD HH:mm:ss
     *
    */
    $('#range').daterangepicker({
        timePicker: true,

        "locale": {
            "cancelLabel": 'Clear',
            "format": "YYYY-MM-DD HH:mm:ss",
        }
    });

    //-----------------------------------------------------------------
    
    /**
     *
     * Parameter untuk konfigurasi google firebase
     * Konfigurasi ini bisa didapatkan pada firebase console
     * 
    */
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

    //------------------------------------------------------------------
    
    /**
     *
     * Menginisialisasi konfigurasi dan koneksi firebase
     * Mengaktifkan google analytics untuk firebase
     *  
    */
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    //------------------------------------------------------------------
    

    /**
     * 
     * Memanggil database pada firebase
     * 
    */
    var database = firebase.database();

    //------------------------------------------------------------------
    
    // Variable default untuk data berdasarkan rentang waktu
    var minDate, maxDate;

    // Variable default untuk menampung array yang berisi lokasi sensor
    var sensorLocations = [];

    // Variable default untuk menampung data sensor yang didapat dari firebase
    var tableData = [];

    // Variable untuk datatable
    var table;

    // String untuk keterangan periode/rentang waktu yang dipilih
    var period = '';

    // Inisialisasi plugin Datatables dengan konfigurasi default
    $('#sensor_data_tbl').DataTable();

    /**
     * Fungsi untuk mengaktifkan alarm bocor
     * 
    */
    function audioDown(id) {
      var x = document.createElement("AUDIO");

      if (x.canPlayType("audio/mpeg")) {
        x.setAttribute("src","_/audio/down.mp3");
      } else {
        x.setAttribute("src","_/audio/down.mp3");
      }
      x.setAttribute('id', id);
      x.setAttribute('allow', 'autoplay');
      x.setAttribute('muted', 'muted');
      x.setAttribute('class', 'd-none');
      document.body.appendChild(x);
    }

    //------------------------------------------------------------------
    
    /**
     * Fungsi untuk mengaktifkan alarm jika sudah tidak ada kebocoran
     * 
    */
    function audioUp(id) {
      var x = document.createElement("AUDIO");

      if (x.canPlayType("audio/mpeg")) {
        x.setAttribute("src","_/audio/up.mp3");
      } else {
        x.setAttribute("src","_/audio/up.mp3");
      }
      x.setAttribute('id', id);
      x.setAttribute('allow', 'autoplay');
      x.setAttribute('muted', 'muted');
      x.setAttribute('class', 'd-none');
      document.body.appendChild(x);
    }

    //------------------------------------------------------------------
    

    /**
     * 
     * Mengambil nama sensor dari firebase untuk ditampilkan menjadi
     * dropdown menu
     * 
    */
    database.ref('/').on('value', function (snapshot) {

        var value = snapshot.val();

        var option = '';

        // Default option
        option += '<option value="" data-location="">Choose Sensor</option>';

        // Buat daftar option untuk setiap sensor 
        $.each(value, function (index, value) {    
            
            option += '<option value="'+index+'" data-location="'+value.sensor_location+'">'+index+'</option>';
        });
        
        // Tampilkan opsi sensor
        $('#sensor_name').html(option);
    });

    //------------------------------------------------------------------
    
    /**
     * Fungsi untuk mengambil data sensor berdasarkan nama sensor
     * dan rentang waktu yang dipilih
     * 
     * @param  {string} sensor          [nama sensor yang dipilih]
     * @param  {string} sensor_location [lokasi sensor yang dipilih]
     * @param  {String} period          [periode atau rentang waktu]
     * @return {Void}
    */
    function getLeakTime(sensor, sensor_location, period = 'All the Time')
    {
        // Variabel data untuk menampung data sensor dari firebase berupa array
        var data = [];

        // Ambil data sensor berdasarkan nama sensor 
        database.ref('/'+sensor+'/').on('value', function (snap) {

            var sensor_data = snap.val();

            // Ambil semua data dari setiap index berdasarkan sensor yang dipilih
            $.each(sensor_data, function (index, value) {

                database.ref('/'+sensor+'/'+index).on('value', function (snapshot) {
                    
                    var sensor_data = snapshot.val();

                    // Simpan pada variabel data dalam bentuk array
                    data.push(value);
                })
            })
        })
        
        // Data volume kebocoran
        // var leaks = [];

        // Data waktu kebocoran
        var timeleak = [];

        // Format waktu yang digunakan
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour:'numeric', 
            minute:'numeric', 
            second:'numeric'
        };

        // Pisahkan data waktu kebocoran
        for(var i in data[0]) timeleak.push(data[0][i]);
        // for(var i in data[1]) leaks.push(data[1][i]);

        for (var i = 0; i < timeleak.length; i++) {
            var datetime = new Date(timeleak[i]); 
            tableData.push({
                raw_time:timeleak[i],
                time:datetime.toLocaleDateString('id-ID', options),
                status:'Bocor',
                location:sensor_location
                // volume:leaks[i]
            });
        }

        // Destroy Datatables Before Re-draw it to Renew Data
        $('#sensor_data_tbl').DataTable().destroy();

        // Inisialisasi Datatables dan kirim data sensor ke datatables
        table = $('#sensor_data_tbl').DataTable({

            "order": [[0,"desc"]], // Mengurutkan data berdasarkan kolom pertama
            'columnDefs': [ 
                {
                    // Menonaktifkan sorting pada kolom selain kolom pertama
                    'targets': [1,2,3],
                    'orderable': false,
                },
                { 
                    // Mendeklarasikan tipe data date untuk kolom pertama
                    type: 'date', 
                    'targets': [0] 
                }
            ],
            // Masukkan data dari variable tableData ke datatables
            "data" : tableData,
            columns : [
                {
                    "data" : "raw_time",
                    "visible" : false,
                    "searchable" : true
                },
                {
                    "data" : "time",
                },
                {
                    "data" : "status",
                },
                {
                    "data" : "location",
                }
            ],
            // Aktifkan fitur Datatables Responsive
            responsive: true,
            // Konfigurasi Button Datatables
            dom: "<'row'<'col-sm-12 col-md-6'l>>" +
            "<'row'<'col-sm-12 mt-4 mb-2'Btr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            buttons: [
            'copy', // Aktifkan tombol copy
            'print', // Aktifkan tombol print
            // Aktifkan tombol export excel
            {
                extend: 'excelHtml5',
                pageSize: 'A4',
                title: "Sensor Data - " + sensor,
                messageTop: "Sensor Data - " + sensor + " ("+ sensor +")\n",
                messageTop: "Period : " + period + "\n",
                exportOptions: {
                    columns: [1,2,3],
                }
            },
            // Aktifkan tombol export csv
            {
                extend: 'csv',
                exportOptions: {
                    columns : [1,2,3]
                }
            },
            // Aktifkan tombol export pdf
            {
                extend: 'pdfHtml5',
                pageSize: 'A4',
                orientation: 'potrait',
                title: "Sensor Data - " + sensor + " (" + period + ")",
                customize : function(doc) {
                    doc.content.splice(0, 1, {
                        text: [{
                            text: "Sensor Data " + sensor + "\n\n",
                            fontSize: 14,
                            alignment: 'center'
                        },
                        {
                            text: "Location: " + sensor_location + "\n",
                            fontSize: 10,
                            alignment: 'left'
                        },
                        {
                            text: "Period: " + period + "\n\n\n",
                            fontSize: 10,
                            alignment: 'left'
                        }]
                    });
                    doc.content[1].margin = [ 10, 0, 10, 0 ];
                    doc.content[1].table.widths = [200,100,200];
                },
                exportOptions: {
                    columns: [1,2,3],
                }
            }]
        });
    }

    /**
     * 
     * Fungsi event listener untuk menu pilih sensor
     * Agar data berubah ketika pilihan menu sensor diubah
     * 
    */
    $('#sensor_name').on('change', function () {
        var sensorName = $('#sensor_name').val();
        var sensorLocation = $(this).find(':selected').data('location');
        $('.title').text('Sensor Data: '+ sensorName + ' ('+sensorLocation+')');
        tableData = [];

        // Panggil fungsi getLeakTime(), kirim parameter nama dan lokasi sensor
        getLeakTime(sensorName, sensorLocation);
    })

    ///------------------------------------------------------------------
    
    /**
     *
     * Filter datatables untuk menampilkan data berdasarkan rentang waktu tertentu
     * Buat event listener ketika tombol apply pada form daterange diclick, maka data
     * akan ditampilkan sesuai dengan rentang waktu yang dipilih.
     * 
    */
    $('.applyBtn').on('click', function () {

        // Custom filtering function which will search data in column four between two values
        $.fn.dataTable.ext.search.push(
            function( settings, data, dataIndex ) {
                var range = $('#range').val().split(' - ');
                var min = new Date(range[0]);
                var max = new Date(range[1]);
                var date = new Date(data[0]);
                const options = { year: 'numeric', month: 'long', day: 'numeric', hour:'numeric', minute:'numeric', second:'numeric'  };
                var minPeriod = min.toLocaleDateString('en-EN', options);  
                var maxPeriod = max.toLocaleDateString('en-EN', options);  

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
            var sensorLocation = $('#sensor_name').find(':selected').data('location');

            $('#period').text('Period: ' + $('#range').val());
            
            tableData = [];
            
            getLeakTime(sensorName, sensorLocation, $('#range').val());
        });
    })

    //------------------------------------------------------------------
    
    /**
     * 
     * Ambil data status sensor untuk indikator sensor yang ditampilkan pada dashboard
     * 
    */
    database.ref('/').on('value', function (snapshot) {

        var value = snapshot.val();

        var graph = [];

        var colors = [];

        var sensors = [];

        $.each(value, function (index, value) {

            // Menampilkan lampu sensor sesuai jumlah sensor pada firebase
            graph.push('<div class="led-box mb-4"><div id="'+index+'" class=""></div><p>'+index+'</p></div>');
            $('.indicator').html(graph);
            
            sensors.push(index);

            // Ambil data status sensor dari setiap sensor
            database.ref('/'+index+'/sensor_status').on('value', function (snap) {

                if (value) {
                    // Tampilkan warna merah jika leak_status true (bocor) dan hijau jika false (tidak bocor)
                    var color = ((value.sensor_status === true) ? 'led-red' : 'led-green');
                    colors.push(color);
                }
            });

        });
        
        // Create Alarm Sound and Sensor Color Indicators
        for(var i = 0; i < sensors.length; i++) {
            audioUp(sensors[i]+'-up');
            audioDown(sensors[i]+'-down');

            // Jika warna sensor merah (bocor) maka aktifkan suara alarm 'danger'
            if(colors[i] === 'led-red') {
                document.getElementById(sensors[i]+'-down').play();
                document.getElementById(sensors[i]+'-down').muted = false;
                document.getElementById(sensors[i]+'-up').pause();
                document.getElementById(sensors[i]+'-up').muted = true;
            }
            // Selain itu aktifkan alarm dering
            else
            {
                document.getElementById(sensors[i]+'-up').play();
                document.getElementById(sensors[i]+'-up').muted = false;
                document.getElementById(sensors[i]+'-down').pause();
                document.getElementById(sensors[i]+'-down').muted = true;
            }

            // Ubah warna berdasarkan pada leak_status
            $('#'+sensors[i]).attr('class', colors[i]);
        }
    });

    //------------------------------------------------------------------
    
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

    //------------------------------------------------------------------
    
    // Ambil semua sensor untuk menampilkan chart
    database.ref('/').on('value', function (snapshot) {

        var value = snapshot.val();

        var chartData = [];

        var sensorLists = [];

        var count = [];

        $.each(value, function (index, value) { 
            
            sensorLists.push(index);

            sensorLists.reverse()
            
            var leakStatus = [];

            // Ambil data leak_status = true
            database.ref('/'+index+'/leak_time').on('value', function (snap) {

                var leak_data = snap.val();

                var leaks = [];

                $.each(leak_data, function (index_data, leak) {

                    if (leak) {
                        leaks.push(leak);
                        // const arrFiltered = leaks.filter(el => {
                        //   return el != null && el != '';
                        // });
                    }
                })

                leakStatus.push(leaks.length);
            })
            
            chartData.push({name:index, data:[leakStatus]});
        });

        // Konversi Array Leak Counter menjadi JSON
        var jsonData = JSON.stringify(chartData);

        // Konfigurasi Highchart
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

    // Menampilkan tahun pada teks copyright
    var year = new Date().getFullYear();
    $('.year').text(year);

    // Menampilkan versi dashboard
    $('.version').text(VERSION);
