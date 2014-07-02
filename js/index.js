/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var cb = {};
        
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();


        this.OCRInit();


        cb.webdb={};
        cb.webdb.db = null;

        cb.webdb.open = function() {
          var dbSize = 5 * 1024 * 1024; // 5MB
          cb.webdb.db = openDatabase("cb", "1", "cb", dbSize);
        };

        cb.webdb.onError = function(tx, e) {
          alert("There has been an error: " + e.message);
        };

        cb.webdb.onSuccess = function(tx, r) {
          // re-render the data.
          // loadTodoItems is defined in Step 4a
          //
        };

        cb.webdb.createTable = function() {
            var db = cb.webdb.db;
            db.transaction(function(tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                              "passenger(ID INTEGER PRIMARY KEY ASC, code TEXT, firstName TEXT, lastName TEXT, seat INTEGER, booked_on DATETIME, checkin_on DATETIME)", []);
                });
            db.transaction(function(tx) {
                tx.executeSql("DELETE FROM passenger",[]);
            });

        };

        cb.webdb.add = function(code, firstName, lastName, seat) {
          var db = cb.webdb.db;
          db.transaction(function(tx){
            tx.executeSql("INSERT INTO passenger(code, firstName, lastName, seat) VALUES (?,?,?,?)",
                [code, firstName, lastName, seat],
                cb.webdb.onSuccess,
                cb.webdb.onError);
           });
        };

        cb.webdb.getPaxList = function(renderFunc, code) {
            var db = cb.webdb.db;
            db.transaction(function(tx) {
                tx.executeSql("SELECT * FROM passenger WHERE code=?", [code], renderFunc,
                cb.webdb.onError);
            });
        };
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        $('#scan').click(this.scan);
        $('#loadDB').click(this.loadDB);
        $('#quitApp').click(this.quitApp);
    },
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    scan: function() {
        try {    
            var scanner = cordova.require("cordova/plugin/BarcodeScanner");

            scanner.scan( function (result) { 
                app.getPax(result.text);
            }, function (error) { 
                alert("Scanning failed: ", error); 
            });
        } catch (e) {
            app.getPax('AAAAA');
        }
    },
    loadDB: function() {
        $.getJSON( "http://shakso.com/paxList.htm", function( data ) {
            cb.webdb.open();
            cb.webdb.createTable();
            $.each( data.paxList, function( key, val ) {
                cb.webdb.add(val.code, val.firstName, val.lastName, val.seat);
            });
            $('#status').html("Status: " + data.paxList.length + " pax loaded");
        });
    },
    getPax: function(code) {
        cb.webdb.getPaxList(function(tx, rs) {
            tableOut="";

            if (rs.rows.length != 0) {
                tableOut="<p class='code'>Code: " + code + "</p>";
                tableOut=tableOut + "<table class='paxTable'><tr><th>Firstname</th><th>Lastname</th><th>SeatOut</th><th>Seatback</th></tr>";

                for (var i=0; i < rs.rows.length; i++) {
                    console.log(rs);
                    tableOut=tableOut + "<tr><td>" + rs.rows.item(i).firstName + "</td><td>"+ rs.rows.item(i).lastName + "</td><td>"+ rs.rows.item(i).seat + "</td></tr>";
                }
                
                tableOut=tableOut + "</table>";
                
            } else {
                tableOut="<p class='code'>Code: " + code + "</p><p>No such booking</p>";
            }
            
            $("#result").html(tableOut); 
        }, code);       
    },
    quitApp: function() {
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else if (navigator.device && navigator.device.exitApp) {
            navigator.device.exitApp();
        }
    },
    OCRInit: function() {
        // Set the language and YOUR api key here
            var languageFrom = "en";
            var apiKey = "vkKYNpa8r7";




            // Album image picker
            $("#selectImageAlbum").click(function(){
                navigator.camera.getPicture(function(imageData) {

                    window.resolveLocalFileSystemURI(imageData, pictureSuccess, null);

                }, null, { 
                    // Image Picker parameters
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    destinationType: Camera.DestinationType.FILE_URI,
                    MediaType: Camera.MediaType.PICTURE
                }); 
            });

            // Picture successfully taken              
            var pictureSuccess = function(fileEntry){


                // Get file info : name, uri, type
                fileType = null;
                fileEntry.file(function(file) { fileType = file.type; }, null);
                fileName = fileEntry.name;
                fileURI = fileEntry.fullPath;
                alert('file :' + fileURI + ' selected. Now proceed to conversion');
                          
                // File upload options
                var options = new FileUploadOptions();

                options.fileKey = "image";
                options.fileName = fileName;
                options.mimeType = fileType;
                options.chunkedMode = false;    
                
                // Adding language and apikey parameters in the request
                var params = new Object();
                params.language = languageFrom;
                params.apikey = apiKey;
                options.params = params;
                // Doing request
                var fileTransfer = new FileTransfer();
                fileTransfer.upload(fileURI, "http://api.ocrapiservice.com/1.0/rest/ocr", function(response) {

                    // Showing response data
                    if (response.responseCode == 200) {
                        //$("#resultText").html("Success");
                    } else {
                        $("#resultText").html("Failed");
                    }

                    // Request successfully completed 
                    $("#extractedText").html(decodeURIComponent(response.response));

                }, function(error) {
                    // Request unsuccessful


                    // Showing error dialog
                    switch (error.code) {
                        case FileTransferError.FILE_NOT_FOUND_ERR: navigator.notification.alert("File not found.", null, "Failed"); break;
                        case FileTransferError.INVALID_URL_ERR: navigator.notification.alert("Invalid URL.", null, "Failed"); break;
                        case FileTransferError.CONNECTION_ERR: navigator.notification.alert("Connection error.", null, "Failed"); break;
                        }
                    }, options);

            }
    }
}
