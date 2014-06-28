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

        $.getJSON( "http://shakso.com/paxList.htm", function( data ) {
            cb.webdb.open();
            cb.webdb.createTable();
            $.each( data.paxList, function( key, val ) {
                cb.webdb.add(val.code, val.firstName, val.lastName, val.seat);
            });
        });
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        $('#scan').click(this.scan);
    },

    // deviceready Event Handler
    //
    // The scope of `this` is the event. In order to call the `receivedEvent`
    // function, we must explicity call `app.receivedEvent(...);`
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

    getPax: function(code) {

        tableOut="<table border=1>";

        cb.webdb.getPaxList(function(tx, rs) {
            for (var i=0; i < rs.rows.length; i++) {
                console.log(rs);
                tableOut=tableOut + "<tr><td>" + rs.rows.item(i).firstName + "</td><td>"+ rs.rows.item(i).lastName + "</td><td>"+ rs.rows.item(i).seat + "</td></tr>";
            }
            tableOut=tableOut + "</table>";

            $("#result").html(tableOut); 
            console.log(tableOut);
        }, code);       
    }
};
