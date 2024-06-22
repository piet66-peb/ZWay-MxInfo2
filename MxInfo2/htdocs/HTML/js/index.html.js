
//h-------------------------------------------------------------------------------
//h
//h Name:         index.html.js
//h Type:         Javascript module (MxInfo2)
//h Purpose:      Generate index.html
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:      builds an index.html with all *.html files.
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V2.0.1 2024-06-04/peb
//v History:      V1.0   2019-03-09/peb first version
//v               V1.5   2021-01-01/peb [+]check login state
//v               2.0.0 2023-10-17/peb [+]MxLogging
//v               V2.0.1 2024-06-04/peb [-]check MxBaseModule version
//h Copyright:    (C) piet66 2019
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='index.html.js';
var VERSION='V2.0.1';
var WRITTEN='2024-06-04/peb';

//------------------
//b Data Definitions
//------------------
//get html language as default
var messageFormats = [
    //message texts (0+...):
    {//0
        de: 'MxInfo2 Index',
        en: 'MxInfo2 Index'
    },
    {//1
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {//2
        de: 'Hallo {0}, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo {0}, sorry, you have no administrator rights to read the data!'
    },
    {//3
        de: 'Angemeldet als Administrator ({0})',
        en: 'Logged in as administrator ({0})'
    },
    {//4
        de: "Angemeldet als Administrator ({0}, ZWAYSession: '{1}')",
        en: "Logged in as administrator ({0}, ZWAYSession: '{1}')"
    },
    {//5
        de: "Angemeldet als Administrator ({0}, ZWAYSession: 'leer')",
        en: "Logged in as administrator ({0}, ZWAYSession: 'empty')"
    },
];

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    document.title = ch_utils.buildMessage(0);

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    //first we must check if user is logged in as administrator
    //only administrator has right to get all data
    ch_utils.displayMessage(1);
    ch_utils.checkLoggedIn (go_on, BasicAuth);
    function go_on (sessionId, isAdmin, username) {
        if (!isAdmin && !username) {
            //ch_utils.alertMessage(1);
            ch_utils.displayMessage(1);
            checkMxVersion();
        } else
        if (!isAdmin) {
            //ch_utils.alertMessage(2, username);
            ch_utils.displayMessage(2, username);
            checkMxVersion();
        } else {
            if (sessionId === undefined) {
                ch_utils.displayMessage(3, 'API');
            } else
            if (!sessionId) {
                ch_utils.displayMessage(5, 'smarthome');
            } else {
                ch_utils.displayMessage(3, 'smarthome', sessionId);
            }
            checkMxVersion();
        }
    }

    function checkMxVersion() {
        var url = '/ZAutomation/api/v1/modules/MxBaseModule';
        ch_utils.ajax_get(url, success, fail);
        function success (data) {
/*            
            var v = data.data.version.split('.');
            var v_comp = [3, 8, 2];
            console.log('installed MxBaseModule version: '+v);
            console.log('required MxBaseModule version: >= '+v_comp);
            var correct_version = false;
            for (var i = 0; i < v_comp.length; i++) {
                if (v[i] === undefined) {
                    correct_version = false;
                    break;
                }
                var v_int = parseInt(v[i]);
                if ( v_int > v_comp[i]) {
                    correct_version = true;
                    break;
                }
                if (v_int < v_comp[i]) {
                    correct_version = false;
                    break;
                }
                correct_version = true;
            }
            readAndPrint(correct_version);
*/            
            readAndPrint(true);
        }
        function fail () {
            readAndPrint(false);
        }
    } //checkMxVersion

    function readAndPrint(Mxfound) {
        //read folder or file list
        var url = './files_'+lang+'.lis'; 
        ch_utils.ajax_get(url, success, fail);
        function success (data) {
            var htmlList;
            htmlList = buildIndexStatic(ch_utils.convertToUTF8(data), Mxfound);
            printHTML(htmlList);
        }
        function fail (data) {
            url = './files.lis'; 
            ch_utils.ajax_get(url, success);
        }
    } //readAndPrint

    function buildIndexStatic(fileList, Mxfound) {
        var fileArray = fileList.match(/[^\r\n]+/g);

        //build html file names:
        var htmlLines = '';
        fileArray.forEach( function (line) {
            var arr = line.split(' ');
            var fileName = arr[0];
            var text = line.replace(fileName, '');
            //console.log(fileName);
            //console.log(text);
            if (fileName !== 'index.html') {
                var filDisp = fileName.replace('.html', '');
                if (Mxfound === true || filDisp.indexOf('Mx') !== 0) {
                    htmlLines += '<tr><td><a href="'+fileName+
                        '?BasicAuth='+BasicAuth+'"><b><big>'+filDisp+'</big></b></a></td><td>'+text+'</td>';
                }
            }
        });

        //return html file
        var htmlStart = '<table><tbody>';
        var htmlEnd = '</tbody></table>';
        return htmlStart+htmlLines+htmlEnd;
    } //buildIndexStatic

    function printHTML(indexData) {
        ch_utils.displayMessage2(0);
        document.getElementById('json-renderer').innerHTML = indexData;
    } //printHTML
}); //document).ready
