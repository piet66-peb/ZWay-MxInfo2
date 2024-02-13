
//h-------------------------------------------------------------------------------
//h
//h Name:         Communication.html.js
//h Type:         Javascript module
//h Purpose:      Display Z-Wave communication from ZWay stored data
//h Project:      ZWay
//h Usage:        request data from ZWave module:
//h                 http://IP:8083/smarthome/user/MxInfo2/Communication.html
//h               read file from storage folder:
//h                 http://IP:8083/smarthome/user/MxInfo2/Communication.html?storage
//h               read file from testData folder:
//h                 http://IP:8083/smarthome/user/MxInfo2/Communication.html?testData
//h                 !! first rename files to zway_originPackets.json,
//h                                          zway_parsedPackets.json
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V5.4.2 2023-08-23/peb
//v History:      V1.0   2019-08-07/peb first version
//v               V1.9   2019-11-30/peb [+]mark, skip multiple entries
//v               V2.0   2019-12-04/peb [+]read classes+commands from csv file
//v               V2.1   2019-12-06/peb [+]statistics
//v               V2.2   2019-12-07/peb [*]changed from widgedpicker to pytesNET/tail.DateTime
//v               V2.8   2020-05-13/peb [*]get data via /ZWave.zway/PacketLog,
//v                                                     /ZWave.zway/CommunicationHistory
//v                                        instead of zway_originPackets.json,
//v                                                   zway_parsedPackets.json
//v               V4.5   2019-11-30/peb [+]data rates
//v               V4.9   2021-03-05/peb [*]draw report+ set data
//v               V5.0   2021-04-14/peb [+]draw rssi
//v               V5.2   2021-07-06/peb [x]consider other order in namespaces
//v               V5.3   2022-02-14/peb [+]skip multiples
//v               V5.4   2022-11-08/peb [+]drap datarates per used route
//v               V5.4.1 2023-07-04/peb [+]comment on wrong hop in received routes
//v               V5.4.2 2023-07-08/peb [+]error_count: count erroneous packets
//h Copyright:    (C) piet66 2019
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 6 */
/*jshint evil: true */
/*globals $, tail, sorttable, Chart, moment, ch_utils */
/*jslint bitwise: true */
/*jshint scripturl: true */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Communication.html.js';
var VERSION='V5.4.2';
var WRITTEN='2023-08-23/peb';

//------------------
//b Data Definitions
//------------------
// test data?
var dataDirArr = ['storage', 'testData'];
//# V2.8:
var flagReadFromFile = false;
var dataDirIx = 0;      //0=storage, 1=testData
var dataDir = dataDirArr[dataDirIx];

var fileArr = [{file: 'zway_originPackets.json',
                text: 'originPackets'},
               {file: 'zway_parsedPackets.json',
                text: 'parsedPackets'}
              ];
var fileDisplayIx = 0;
var zway_originPacketsjson, zway_parsedPacketsjson;
var zway_originPacketsexam, zway_parsedPacketsexam;
var vDevIdPre = 'ZWayVDev_zway_';

var classArray, nodeArray, batteryArray, classArrayReverse, deviceIDArray;
var priorityArrayIn, priorityArrayOut;
var notificationData;

var doRefresh = false;
var useRegex = false;
var invertFilter = false;
var IntervalId;
var update = false;
var devNodeIdSelected;
var devIdSelected;
var devIdData;
var maxRecordsSelected;
var lastTimeExamined;
var currentPage;

var multipleStatistics = {};
var multiplesHTML = '';
var statistics = {};
var statisticsHTML = '';
var statisticsPerHour = {};
var statisticsCurrHour;
var statisticsPerHourHTML = '';
var statisticsPerHourNodeHTML = '';
var statisticsPerCommand = {};
var statisticsPerCommandHTML = '';
var statisticsPerCommandNode = {};
var statisticsPerCommandNodeHTML = '';
var differencesStatistics = {};
var differencesHTML = '';
var usedRoutesOutgoing = {}, usedRoutesIncoming = {};
var usedRoutesOutgoingCount = {}, usedRoutesIncomingCount = {};

var lang;
var razberryURL = '';
var clickMark = '_click_';
var styleMark = '_style_';

var error_count;

var ixButtonTextBase = 37;
var ix_selectTexts = 59;
var ix_headerTexts = 63;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Ergebnis der Auswertung',
        en: 'Result of analysis'
    },
    {
        de: 'Echten Dateiname für {0} ermitteln aus {1}...',
        en: 'Getting real filename for {0} from {1}...'
    },
    {
        de: '{0} wird gelesen...',
        en: 'Reading {0}...'
    },
    {
        de: '{0}',
        en: '{0}'
    },
    {
        de: 'Z-Wave Kommunikation',
        en: 'Z-Wave Communication'
    },
    {//5
        de: '{0} ist eingelesen ({1}).',
        en: '{0} is read ({1}).'
    },
    { //6
        de: '{0}: {1} Einträge{2}, {3} - {4}, keine fehlerhaften Pakete',
        en: '{0}: {1} entries{2}, {3} - {4}, no erroneous packets'
    },
    {
        de: 'Uhrzeit: ',
        en: 'Time: '
    },
    {
        de: 'Keine Auswahl',
        en: 'Nothing selected'
    },
    { //9
        de: "{0}: {1} Einträge{2}, {3} - {4}, <font color='red'>{5} fehlerhaften Pakete >???</font>",
        en: "{0}: {1} entries{2}, {3} - {4}, <font color='red'>{5} erroneous packets >???</font>"
    },
    {
        de: 'not used',
        en: 'not used'
    },
    {
        de: 'Fehler beim Lesen von {0}: {1}',
        en: 'Error reading {0}: {1}'
    },
    {
        de: 'Statistik pro Stunde',
        en: "Statistics per hour"
    },
    {
        de: 'Statistik für Knoten {0} pro Stunde',
        en: "Statistics for node {0} per hour"
    },
    {
        de: 'Statistik für Knoten {0} pro Kommando',
        en: "Statistics for node {0} per command"
    },
    {
        de: 'Statistik pro Kommando',
        en: "Statistics per command"
    },
    { //16
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    { //17
        de: 'Hallo {0}, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo {0}, sorry, you have no administrator rights to read the data!'
    },
    {
        de: 'Keine Messwerte von Gerät {0} vorhanden!',
        en: 'No Sensor Values available of Device {0}!'
    },
    {
        de: '{0} Messwerte von Gerät {1}',
        en: '{0} Sensor Values of Device {1}'
    },
    {
        de: 'Differenzen zwischen originPackets und parsedPackets',
        en: "Differences betwen originPackets and parsedPackets"
    },
    {
        de: 'Keine Datenrate zu Knoten {0} vorhanden!',
        en: 'No Data Rate available for Node {0}!'
    },
    {
        de: '{0} ausgehende Datenrate zu Knoten {1}',
        en: '{0} outgoing Data Rate to Node {1}'
    },
    {
        de: 'Keine rssi Werte zu Knoten {0} vorhanden!',
        en: 'No rssi Values available for Node {0}!'
    },
    {
        de: '{0} rssi Werte zu Knoten {1}',
        en: '{0} rssi Values for Node {1}'
    },
    {
        de: 'Eingehend',
        en: 'incoming'
    },
    {
        de: 'Ausgehend',
        en: 'outgoing'
    },
    {
        de: 'Route {0}',
        en: 'Route {0}'
    },
    {
        de: 'Priority Route {0}',
        en: 'Priority Route {0}'
    },
    {
        de: 'not used',
        en: 'not used'
    },
    {
        de: 'Keine ausgehenden Routen zu Knoten {0} vorhanden!',
        en: 'No outgoing Routes available for Node {0}!'
    },
    {
        de: '{0} ausgehende Routen zu Knoten {1}',
        en: '{0} outgoing Routes to Node {1}'
    },
    {
        de: 'Keine eingehenden Routen von Knoten {0} vorhanden!',
        en: 'No incoming Routes available from Node {0}!'
    },
    {
        de: '{0} eingehende Routen von Knoten {1}',
        en: '{0} incoming Routes from Node {1}'
    },
    {
        de: 'Ausgehende Pakete an Knoten {0}',
        en: 'Outgoing Packets to Node {0}'
    },
    {
        de: 'Eingehende Pakete von Knoten {0}',
        en: 'Incoming Packets from Node {0}'
    },
    {
        de: 'Explorer Frames',
        en: 'Explorer Frames'
    },
    //button texts (37+...):
    {
        de: 'Quelldaten: ',
        en: 'Sources: '
    },
    {
        de: 'Intervall von: ',
        en: 'Time from: '
    },
    {
        de: 'bis: ',
        en: 'to: '
    },
    {
        de: 'Auswertung',
        en: 'Examine'
    },
    {
        de: 'Aktualisieren',
        en: 'Update'
    },
    {
        de: 'Automatik: ',
        en: 'Automatic: '
    },
    {
        de: 'Knoten: ',
        en: 'Node: '
    },
    {
        de: 'Analyse: ',
        en: 'Analysis: '
    },
    {
        de: 'Anzahl zu zeigender Einträge: ',
        en: 'Number of records to show: '
    },
    {
        de: 'Filter: ',
        en: 'Filter: '
    },
    {//10
        de: 'Regulärer Ausdruck: ',
        en: 'Regular expression: '
    },
    {
        de: 'Multiple überspringen: ',
        en: "Skip multiples: "
    },
    {
        de: 'Statistik',
        en: "Statistics"
    },
    {
        de: 'Multiple Einträge',
        en: "Multiple Entries"
    },
    {
        de: 'Statistik pro Stunde',
        en: "Statistics Per Hour"
    },
    {
        de: 'Statistik pro Stunde und Knoten',
        en: "Statistics Per Hour And Node"
    },
    {
        de: 'Kommandos pro Knoten',
        en: "Commands Per Node"
    },
    {
        de: 'Differenzen',
        en: "Differences"
    },
    {
        de: 'Kommandos (alle Knoten)',
        en: "Commands (all Nodes)"
    },
    {
        de: 'Messwerte von Gerät: ',
        en: "Sensor Values of Device: "
    },
    {
        de: 'Zeichnen',
        en: "Draw"
    },
    {//21
        de: 'invertieren: ',
        en: 'invert: '
    },

    //select texts (59+...):
    {
        de: 'Datenrate',
        en: 'Data Rate'
    },
    {
        de: 'rssi',
        en: 'rssi'
    },
    {
        de: 'Ausgehende Routen',
        en: 'Outgoing Routes'
    },
    {
        de: 'Eingehende Routen',
        en: 'Incoming Routes'
    },

    //header texts (63+...):
    {
        de: 'Knoten',
        en: 'Node'
    },
    {
        de: 'Name',
        en: 'Name'
    },
    {
        de: 'Ein',
        en: 'In'
    },
    {
        de: 'Identisch<br>Ein',
        en: 'Identical<br>n'
    },
    {
        de: 'Aus',
        en: 'Out'
    },
    {
        de: 'Identisch<br>Aus',
        en: 'Identical<br>Out'
    },
    {
        de: 'Ein+Aus',
        en: 'In+Out'
    },
    {
        de: 'Identisch<br>Ein+Aus',
        en: 'Identical<br>In+Out'
    },
    {
        de: 'Summe',
        en: 'Sum'
    },
    {
        de: 'Id',
        en: 'Id'
    },
    {
        de: 'Anzahl<br>Identisch',
        en: 'Count<br>Identics'
    },
    {
        de: 'Kommando',
        en: 'Command'
    },
    {
        de: 'Zeit',
        en: 'Time'
    },
    {
        de: 'pro Stunde ({0} Stunden)',
        en: 'per Hour ({0} Hours)'
    },
    {
        de: 'Stunde',
        en: 'Hour'
    },
    {
        de: 'Klasse Id',
        en: 'Class Id'
    },
    {
        de: 'Kommando Id',
        en: 'Command Id'
    },
    {
        de: 'Name',
        en: 'Name'
    },
    {
        de: 'Anzahl',
        en: 'Count'
    },
    {
        de: 'Index',
        en: 'Index'
    },
    {
        de: 'Knoten\noriginPackets',
        en: 'Node\noriginPackets'
    },
    {
        de: 'Source\nparsedPackets',
        en: 'Source\nparsedPackets'
    },
    {
        de: 'Dest.\nparsedPackets',
        en: 'Dest.\nparsedPackets'
    },
    {
        de: 'Zeit\noriginPackets',
        en: 'Time\noriginPackets'
    },
    {
        de: 'Zeit\nparsedPackets',
        en: 'Time\nparsedPackets'
    },
    {
        de: 'Identisch',
        en: 'Identics'
    },
    {
        de: 'besser',
        en: 'better'
    },
    {
        de: 'schlechter',
        en: 'worse'
    },
    {
        de: 'gerade ausreichend',
        en: 'just satisfactory'
    },
    {
        de: 'kbit/s',
        en: 'kbps'
    },
];

//config structure for chart.js
function tooltipPopup(route, packetIndex) {
    //console.log('route='+route+', packetIndex='+packetIndex);
    var ix = packetIndex.replace('<', '').replace('>', '');
    var obj = zway_originPacketsexam[ix];
    var txt = '';
    Object.keys(obj).forEach(function(key, i) {
        if (key[key.length-1] !== '_') {
            txt += key + ': ' + obj[key] + '\n';
        }
    });
    alert(txt);
}

var config = {
    type: 'line',
    data: {},
    options: {
        events: ['mousemove', 'click'],  //!!! for clickable custom tooltip
        animation: false,
        tooltips: {
            mode: 'index',
            intersect: true,
            footerFontStyle: 'normal',
            callbacks: {
                afterLabel: function(tooltipItem, data) {
                    var x_index = tooltipItem.index;
                    return data.datasets[tooltipItem.datasetIndex].tooltips[x_index];
               }
            },
            //exchange standard tooltip with custm tooltip (html with click):
            enabled: false,     //switchoff standard tooltip
            custom: function(tooltipModel) {
                var tooltipEl = document.getElementById('chartjs-tooltip');
                if (tooltipEl) {tooltipEl.remove();}
                //console.log(tooltipModel);

                // hide if no tooltip
                if (tooltipModel.opacity === 0) {
                    return;
                }
                if (!tooltipModel.body) {
                    return;
                }
                //console.log(tooltipModel);

                // create new html table element
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chartjs-tooltip';
                tooltipEl.innerHTML = '<table></table>';
                document.body.appendChild(tooltipEl);

                // set caret position
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltipModel.yAlign) {
                    tooltipEl.classList.add(tooltipModel.yAlign);
                } else {
                    tooltipEl.classList.add('no-transform');
                }

                function getBody(bodyItem) {
                    return bodyItem.lines;
                }
                function getAfter(bodyItem) {
                    return bodyItem.after || [];
                }
                var innerHtmlStyle = '<style>.toolbutton{text-align:left;}</style>';

                // tooltip title
                var innerHtmlHead = '<thead>';
                var titleLines = tooltipModel.title || [];
                for (var i = 0; i < titleLines.length; i++) {
                    var title = titleLines[i];
                    innerHtmlHead += '<tr><th>' + title + '</th></tr>';
                }
                innerHtmlHead += '</thead>';

                // all tooltip entries:
                var innerHtmlBody = '<tbody>';
                var bodyLines = tooltipModel.body.map(getBody);
                var bodyAfter = tooltipModel.body.map(getAfter);
                for (i = 0; i < bodyLines.length; i++) {
                    // tooltip entry line:
                    var colors = tooltipModel.labelColors[i];
                    var style = `
                        background : ${colors.borderColor};
                        border-color : ${colors.borderColor};
                        border-width : 2px;
                        white-space : 'nowrap';
                    `;
                    var span = '<span style="'+style+'">&nbsp; &nbsp; &nbsp;</span>&nbsp';
                    var body = bodyLines[i][0];

                    // all tooltip entry additions:
                    var innerHtmlAfter =  '';
                    var packetIndex, route;
                    for (var j = 0; j < bodyAfter[i].length; j++) {
                        var after = bodyAfter[i][j];
                        innerHtmlAfter += '<br>' + after;
                        if (!packetIndex && after.indexOf('<') === 0) {
                            packetIndex = after.replace(/>.*/, '>');
                            route = after.replace(/^.*\[/, '[');
                        }
                    }
                    innerHtmlBody += '<tr><td><button class="toolbutton" ';

                    if (packetIndex) {
                        innerHtmlBody += 'onclick="tooltipPopup(\''+route+'\',\''+packetIndex+'\')"';
                    }
                    innerHtmlBody += '>' + span + '<b>' + body + '</b>' + innerHtmlAfter;
                    innerHtmlBody += '</button></td></tr>';
                }
                innerHtmlBody += '</tbody>';
                //console.log(innerHtmlBody);

                var tableRoot = tooltipEl.querySelector('table');
                tableRoot.innerHTML = innerHtmlStyle + innerHtmlHead + innerHtmlBody;

                // `this` will be the overall tooltip
                var position = this._chart.canvas.getBoundingClientRect();

                // Display, position, and set styles for font
                tooltipEl.style.opacity = 1;
                tooltipEl.style.position = 'absolute';
                tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
                tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
                tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
                //tooltipEl.style.pointerEvents = 'none';   //!!!! disable for clickable tooltip
            } //tooltip custom
        },  //tooltips
        legend: {
            display: true,
            //hide legend if label is empty:
            labels: {
                filter: function(legendItem, data) {
                    if (!data.datasets[legendItem.datasetIndex].label) {
                        return false;
                    }
                    return true;
                }
            }
        },
        responsive: true,
        title: {
            display: true,
            text: ''
        },
        elements: {
            point: {
                pointStyle: 'crossRot',
                backgroundColor: 'black',
                borderColor: 'black'
            }
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                type: 'time',
                distribution: 'linear',
                time: {
                    displayFormats: {
                        //millisecond: "SSS [ms]",
                        millisecond: "HH:mm:ss",
                        second: "HH:mm:ss",
                        //second: "ddd HH:mm:ss",
                        minute: "HH:mm",
                        //minute: "ddd HH:mm",
                        //hour: "ddd HH:mm",
                        hour: "HH:mm",
                        //day: "ddd D.MMM",
                        day: "HH:mm",
                        week: "ll",
                        month: "MMM",
                        quarter: "[Q]Q - YYYY",
                        year: "YYYY"
                    },
                    tooltipFormat: 'ddd D.MMM YYYY, HH:mm'
                },
                scaleLabel: {
                    display: false,
                    labelString: 'time'
                },
                display: true,
                ticks: {}
            }],
            yAxes: [{
                display: true,
                position: 'right',
                ticks: {}
            }],
        }, //scales
     } //options
}; //config (chart.js)

var options_datetime_from = {
    animate: true,                  // [0.4.0]          Boolean
    classNames: false,              // [0.3.0]          Boolean, String, Array, null
    closeButton: true,              // [0.4.5]          Boolean
    dateFormat: "YYYY-mm-dd",       // [0.1.0]          String (PHP similar Date)
    dateStart: false,               // [0.4.0]          String, Date, Integer, False
    dateRanges: [],                 // [0.3.0]          Array
    dateBlacklist: true,            // [0.4.0]          Boolean
    dateEnd: false,                 // [0.4.0]          String, Date, Integer, False
    locale: lang,                   // [0.4.0]          String
    position: "bottom",             // [0.1.0]          String
    rtl: "auto",                    // [0.4.1]          String, Boolean
    startOpen: false,               // [0.3.0]          Boolean
    stayOpen: false,                // [0.3.0]          Boolean
    time12h: false,                 // [0.4.13][NEW]    Boolean
    timeFormat: "HH:ii:ss",         // [0.1.0]          String (PHP similar Date)
    timeHours: true,                // [0.4.13][UPD]    Integer, Boolean, null
    timeMinutes: true,              // [0.4.13][UPD]    Integer, Boolean, null
    timeSeconds: 0,                 // [0.4.13][UPD]    Integer, Boolean, null
    timeIncrement: true,            // [0.4.5]          Boolean
    timeStepHours: 1,               // [0.4.3]          Integer
    timeStepMinutes: 1,             // [0.4.3]          Integer
    timeStepSeconds: 1,             // [0.4.3]          Integer
    today: false,                    // [0.4.0]          Boolean
    tooltips: [],                   // [0.4.0]          Array
    viewDefault: "days",            // [0.4.0]          String
    viewDecades: false,              // [0.4.0]          Boolean
    viewYears: false,                // [0.4.0]          Boolean
    viewMonths: false,               // [0.4.0]          Boolean
    viewDays: true,                 // [0.4.0]          Boolean
    weekStart: 0                    // [0.1.0]          String, Integer
};
var options_datetime_to = {
    animate: true,                  // [0.4.0]          Boolean
    classNames: false,              // [0.3.0]          Boolean, String, Array, null
    closeButton: true,              // [0.4.5]          Boolean
    dateFormat: "YYYY-mm-dd",       // [0.1.0]          String (PHP similar Date)
    dateStart: false,               // [0.4.0]          String, Date, Integer, False
    dateRanges: [],                 // [0.3.0]          Array
    dateBlacklist: true,            // [0.4.0]          Boolean
    dateEnd: false,                 // [0.4.0]          String, Date, Integer, False
    locale: lang,                   // [0.4.0]          String
    position: "bottom",             // [0.1.0]          String
    rtl: "auto",                    // [0.4.1]          String, Boolean
    startOpen: false,               // [0.3.0]          Boolean
    stayOpen: false,                // [0.3.0]          Boolean
    time12h: false,                 // [0.4.13][NEW]    Boolean
    timeFormat: "HH:ii:ss",         // [0.1.0]          String (PHP similar Date)
    timeHours: true,                // [0.4.13][UPD]    Integer, Boolean, null
    timeMinutes: true,              // [0.4.13][UPD]    Integer, Boolean, null
    timeSeconds: 0,                 // [0.4.13][UPD]    Integer, Boolean, null
    timeIncrement: true,            // [0.4.5]          Boolean
    timeStepHours: 1,               // [0.4.3]          Integer
    timeStepMinutes: 1,             // [0.4.3]          Integer
    timeStepSeconds: 1,             // [0.4.3]          Integer
    today: false,                 // [0.4.0]          Boolean
    tooltips: [],                   // [0.4.0]          Array
    viewDefault: "days",            // [0.4.0]          String
    viewDecades: false,              // [0.4.0]          Boolean
    viewYears: false,                // [0.4.0]          Boolean
    viewMonths: false,               // [0.4.0]          Boolean
    viewDays: true,                 // [0.4.0]          Boolean
    weekStart: 0                    // [0.1.0]          String, Integer
};

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get server url
    var urlServer = window.location.href.replace(/:8083.*$/, ':8083');
    var urlDevices = urlServer + '/ZAutomation/api/v1/devices/';

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    //set source folder
    var dataDir = ch_utils.getParameter('dataDir');
    if (dataDir) {
        alert('taking data from '+dataDir+' folder');
    }

    //get html language
    lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    langTexts();
    ch_utils.requireAdmin(updateChart, BasicAuth);

    //------------- special functions ---------------------------------------

    function readDeviceIDs(fileIx) {
        var fil = razberryURL + '/ZAutomation/api/v1/namespaces';
        ch_utils.displayMessage(2, fil, '');
        deviceIDArray = {};
        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            data.data.forEach(function(chapter, ix) {
                if (chapter.id === "devices_all") {
                    chapter.params.forEach(function(device) { //id": "devices_all"
                        if (device.deviceId.indexOf(vDevIdPre === 0)) {
                            deviceIDArray[device.deviceId] = device.deviceName;
                        }
                    });
                }
            });
            buildSelectBoxDevId();
            getData(fileIx);
        }
     } //readDeviceIDs

    function completeDeviceId(Id) {
        var s = JSON.stringify(deviceIDArray);
        var pos1 = s.indexOf('"'+Id);
        var pos2;
        var fullId;
        if (pos1 >= 0) {
            pos2 = s.indexOf('"', pos1+1);
            fullId = s.substring(pos1+1, pos2);
        }
        //alert(Id+' '+fullId);
        return fullId;
    }

    function readZWaveClasses(fileIx) {
        var fil = 'data/zwave_classes.csv';
        ch_utils.displayMessage(2, fil, '');

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //build class array
            buildClassArray(data);
            getData(fileIx);
        }
     } //readZWaveClasses

    function readZWaveCommands(fileIx) {
        var fil = 'data/zwave_commands.csv';
        ch_utils.displayMessage(2, fil, '');

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //add commands to class array
            addClassArrayCommands(data);
            getData(fileIx);
        }
     } //readZWaveCommands

    function readZWaveNotifications(fileIx) {
        var fil = 'data/notifications.json';
        ch_utils.displayMessage(2, fil, '');

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //get data
            notificationData = data;
            getData(fileIx);
        }
     } //readZWaveNotifications

    function readNodes(fileIx) {
        var fil = '/ZWaveAPI/Data/0';
        ch_utils.displayMessage(2, fil, '');

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //build nodes array
            buildNodeArray(data.devices, data.controller);
            buildSelectBoxNodeId ();
            getData(fileIx);
        }
     } //readNodes

    function buildNodeArray(nodeData, controllerData) {
        nodeArray = {};
        batteryArray = {};
        priorityArrayIn = {};
        priorityArrayOut = {};
        var devName, devPriority;
        var controller = controllerData.data.nodeId.value;
        nodeArray[controller] = 'Z-Way Controller';
        Object.keys(nodeData).forEach(function(device, ix) {
            var priorityRoutesDev, route, devPriority, i;
            if (device*1 === controller) {
                priorityRoutesDev = nodeData[device].data.priorityRoutes;
                Object.keys(priorityRoutesDev).forEach(function(devicePrio, ix) {
                    if (!isNaN(devicePrio) &&
                        priorityRoutesDev[devicePrio] && priorityRoutesDev[devicePrio].value) {
                        route = '[' + controller;
                        devPriority = priorityRoutesDev[devicePrio].value;
                        if (devPriority) {
                            for (i = 0; i < devPriority.length; i++) {
                                if (devPriority[i] === 0) {break;}
                                route += ',' + devPriority[i];
                            }
                        }
                        route += ','+devicePrio+']';
                        priorityArrayOut[devicePrio] = route;
                    }
                });
            } else {
                priorityRoutesDev = nodeData[device].data.priorityRoutes;
                if (priorityRoutesDev[controller] && priorityRoutesDev[controller].value) {
                    route = '[' + device;
                    devPriority = priorityRoutesDev[controller].value;
                    if (devPriority) {
                        for (i = 0; i < devPriority.length; i++) {
                            if (devPriority[i] === 0) {break;}
                            route += ',' + devPriority[i];
                        }
                    }
                    route += ','+controller+']';
                    priorityArrayIn[device] = route;
                }
    
                devName = nodeData[device].data.givenName.value;
                if (!nodeArray[device] || devName.length > 0) {
                    nodeArray[device] = devName;
                }
                if (!nodeData[device].data.isListening.value &&
                    !nodeData[device].data.isAwake.value) {
                    batteryArray[device] = devName;
                }
            }
        });
        nodeArray[255] = 'Broadcast';
        //console.log(priorityArrayIn);
        //console.log(priorityArrayOut);
    } //buildNodeArray

    function buildClassArray(classDataCSV) {
        var allRows = classDataCSV.split(/\r?\n|\r/);
        classArray = {};
        for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
            var rowCells = allRows[singleRow].split(',');
            var classIdHex = rowCells[0];
            var classId    = parseInt(classIdHex, 16);
            var className  = rowCells[2];
            classArray[classId] = {classIdHex: classIdHex,
                                   className:  className};
        }
    } //buildClassArray

    function addClassArrayCommands(commandDataCSV) {
        var allRows = commandDataCSV.split(/\r?\n|\r/);
        classArrayReverse = {};
        for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
            var rowCells = allRows[singleRow].split(',');
            var classIdHex = rowCells[0];
            var classId    = parseInt(classIdHex, 16);
            var commandIdHex = rowCells[1];
            if (commandIdHex.length > 0) {
                var commandId    = parseInt(commandIdHex, 16);
                var commandName  = rowCells[3];
                classArray[classId][commandId] = {commandIdHex: commandIdHex,
                                                  commandName:  commandName};
                classArrayReverse[commandName] = {classId: classId,
                                                  commandId: commandId};
            }
        }
    } //addClassArrayCommands

    function langTexts() {
        document.title = messageFormats[4][lang];
        for (var i = 0; i < fileArr.length; i++) {
            buttonTextFileIx(i);
        }
        ch_utils.buttonText('label1', 0);
        ch_utils.buttonText('label2', 1);
        ch_utils.buttonText('label3', 2);
        ch_utils.buttonText('showRange', 3);
        ch_utils.buttonText('update', 4);
        ch_utils.buttonText('textRefresh', 5);
        ch_utils.buttonText('label4', 6);
        ch_utils.buttonText('label5', 7);
        ch_utils.buttonText('label6', 8);
        ch_utils.buttonText('label7', 9);
        ch_utils.buttonText('textRegex', 10);
        ch_utils.buttonText('textInvert', 21);
        ch_utils.buttonText('textSkip', 11);
        ch_utils.buttonText('statistics', 12);
        ch_utils.buttonText('multiples', 13);
        ch_utils.buttonText('statisticsPerHour', 14);
        ch_utils.buttonText('statisticsPerHourNode', 15);
        ch_utils.buttonText('statisticsPerCommand', 18);
        ch_utils.buttonText('statisticsPerCommandNode', 16);
        ch_utils.buttonText('differences', 17);
        ch_utils.buttonText('labelDevice', 19);
        ch_utils.buttonText('graphDevice', 20);

        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        el = document.getElementById("checkboxRegex");
        if (el) {
            el.checked = useRegex;
        }
        el = document.getElementById("checkboxInvert");
        if (el) {
            el.checked = invertFilter;
        }
        options_datetime_from.locale = lang;
        tail.DateTime(".datetime_from", options_datetime_from);
        options_datetime_to.locale = lang;
        tail.DateTime(".datetime_to", options_datetime_to);
    } //langTexts

    var time_modified_old;
    var time_modified_new;
    function getData(fileIx) {
        if (fileIx === -fileArr.length) {
            time_modified_old = fileArr[0].timeModifiedUnix;
            time_modified_new = undefined;
        } else {
            time_modified_new = fileArr[0].timeModifiedUnix;
            if (time_modified_old !== undefined && time_modified_new === time_modified_old) {
                //alert('no change');
                return;
            }
        }

        if (deviceIDArray === undefined) {
            readDeviceIDs(fileIx);
        } else
        if (classArray === undefined) {
            readZWaveClasses(fileIx);
        } else
        if (classArrayReverse === undefined) {
            readZWaveCommands(fileIx);
        } else
        if (notificationData === undefined) {
            readZWaveNotifications(fileIx);
        } else
        if (nodeArray === undefined) {
            //printJSON(classArray, 6);
            readNodes(fileIx);
        } else
        if (fileIx < fileArr.length) {
            //check for changes
            if (update && fileIx === 1) {
                var buff = zway_originPacketsjson;
                var len = buff.length;
                if (lastTimeExamined === buff[len-1].updateTime) {
                    //correct value array to string in output
                    for (var i = 0; i < len; i++) {
                        var entry = buff[i];
                        if (entry.hasOwnProperty('value')) {
                            entry.value = JSON.stringify(entry.value);
                        }
                        if (entry.hasOwnProperty('hops')) {
                            entry.hops = JSON.stringify(entry.hops);
                        }

                        if (entry.hasOwnProperty('lastFailPath')) {
                            entry.lastFailPath = JSON.stringify(entry.lastFailPath);
                        }
                        entry.index = '<'+i+'>';
                    }
                    return;
                }
            }
            loadData(fileIx);
        } else {
            //preset date/time picker
            var pickerString = $("#datetime_from").val();
            var timeString = fileArr[fileDisplayIx].time_start;
            var s;
            if (!pickerString || pickerString < timeString) {
                s = timeString.split(/[- :]/);
                tail.DateTime(".datetime_from").selectDate(s[0], s[1]-1, s[2], s[3], s[4], s[5]);
            }
            pickerString = $("#datetime_to").val();
            timeString = fileArr[fileDisplayIx].time_end;
            if (!pickerString) {
                s = timeString.split(/[- :]/);
                tail.DateTime(".datetime_to").selectDate(s[0], s[1]-1, s[2], s[3], s[4], s[5]);
                $("#datetime_to").val(undefined);
            }

            examSourceFile(fileDisplayIx);
            //console.log(usedRoutesOutgoing);
            //console.log(usedRoutesIncoming);

            if (update) {
                printRange(fileDisplayIx, true);
            } else {
                printSourceFile(fileDisplayIx);
                update = true;
            }
        }
    } //getData

    function loadData(fileIx) {
        var fil = fileArr[fileIx].file;
        //ch_utils.displayMessage(2, fileArr[fileIx].text, dataDir);
        ch_utils.displayMessage(2, fileArr[fileIx].text, dataDir);

        fileArr[fileIx].buffer  = fil.replace(".", "");
        fileArr[fileIx].bufferexam  = fil.replace(".json", "exam");

        var url;
        if (! flagReadFromFile || ! dataDir) {          //via ZWave module
            if (fil === 'zway_originPackets.json') {
                url = url = '/ZWave.zway/PacketLog';
            }
            if (fil === 'zway_parsedPackets.json') {
                url = url = '/ZWave.zway/CommunicationHistory';
            }
        } else if (dataDir === dataDirArr[0]) {         //from storage
            url = url = '/ZWaveAPI/Run/loadObject("'+fil+'")';
        } else {
            url = dataDir+'/'+fil;                      //from test Folder
        }

        ch_utils.ajax_get(url, success);
        function success (data) {
            if (! flagReadFromFile) {
                data = data.data;
            }
            //store data
            ch_utils.displayMessage(5, fil, ch_utils.userTime(Date.now()));
            eval((fileArr[fileIx].buffer+' = data'));

            var len = !data ? 0 : data.length;
            //alert(len);
            if (len === 0) {
                alert('no data');
            } else {
                fileArr[fileIx].updateTime_start = data[0].updateTime;
                fileArr[fileIx].updateTime_end   = data[len-1].updateTime;
                fileArr[fileIx].time_start = ch_utils.userTime(data[0].updateTime);
                fileArr[fileIx].time_end   = ch_utils.userTime(data[len-1].updateTime);
                getData(++fileIx);
            }
        }
    } //loadData

    function examSourceFile(fileIx) {
        var skipMultiples = false;
        var el = document.getElementById("skipCheckbox");
        if (el) {
            skipMultiples = el.checked || false;
        }

        var arr = [];
        var i;
        var entry;

        var buff = eval(fileArr[fileIx].buffer);
        var len_f = buff.length;
        var buff1 = [];
        if (fileIx === 0) {
            buff1 = zway_parsedPacketsjson;
        }

        // set initials
        eval(fileArr[fileIx].bufferexam+' = []');
        multipleStatistics = {};
        statistics = {};
        statisticsPerHour = {};
        statisticsCurrHour = undefined;
        statisticsPerCommand = {};
        statisticsPerCommandNode = {};
        differencesStatistics = {};

        // examine new (last) part of data buffer
        error_count = 0;
        for (i = 0; i < len_f; i++) {
            entry = buff[i];
            var val = correctValue(entry);
            var v;
            var frameType;
            var item = {};
            var currClassId;
            var currCommandId;
            var multiplesId = checkIdentical(entry, buff, len_f, i);
            var multiplesIdIx = 0;
            if (multiplesId) {
                if (! multipleStatistics.hasOwnProperty(multiplesId)) {
                    multipleStatistics[multiplesId] = {count: 0,
                                                       index: i,
                                                       nodeId: entry.nodeId
                                                     };
                }
                multiplesIdIx = multipleStatistics[multiplesId].count;
                multipleStatistics[multiplesId].count += 1;
                item.identicalEntry = multiplesIdIx + ' ********************* '+multiplesId;
            }
/*            
            if (multiplesId && skipMultiples) {
                var skipEntry = false;
                for (var e = 0; e < arr.length; e++) {
                    if (arr[e].hasOwnProperty('identicalEntry') &&
                        arr[e].identicalEntry === item.identicalEntry) {
                        skipEntry = true;
                        break;
                    }
                 }
                if (skipEntry) {
                    continue;
                }
            }
*/
            //correct value array to string in output
            if (entry.hasOwnProperty('value')) {
                entry.value = JSON.stringify(entry.value);
            }
            entry.hops = JSON.stringify(entry.hops);
            if (entry.hasOwnProperty('lastFailPath')) {
                entry.lastFailPath = JSON.stringify(entry.lastFailPath);
            }

            //add index to output
            entry.index = '<'+i+'>';
            buff1[i].index = '<'+i+'>';

            //compare zway_originPacketsjson and zway_parsedPacketsjson
            var nodeOrigin = entry.nodeId.toString();
            var srcParsed  = buff1[i].src.toString().replace(/:.*$/, '');
            var destParsed  = buff1[i].dest.toString().replace(/:.*$/, '');
            if (! (nodeOrigin === srcParsed || nodeOrigin === destParsed) ||
                entry.updateTime !== buff1[i].updateTime) {
                differencesStatistics[i] = {nodeId: entry.nodeId,
                                            src:    buff1[i].src,
                                            dest:   buff1[i].dest,
                                            updateTimeOrigin: entry.updateTime+' '+ch_utils.userTime(entry.updateTime),
                                            updateTimeParsed: buff1[i].updateTime+' '+ch_utils.userTime(buff1[i].updateTime)
                };
            }

            var duplicate = examLine_duplicate(entry);
            if (duplicate >= 0) {
                item.duplicate = duplicate;
            }
            item.updateTime = examLine1(entry);
            if (item.updateTime.indexOf('Explore Frame') > 0) {
                item['updateTime'+styleMark] = "background-color:lightpink;";
            } else
            if (item.updateTime.indexOf('singlecast') > 0) {
                item['updateTime'+styleMark] = "background-color:yellow;";
            } else
            if (item.updateTime.indexOf('delivered=true') > 0) {
                item['updateTime'+styleMark] = "background-color:lightgreen;";
            } else
            if (item.updateTime.indexOf('delivered=true') > 0) {
                item['updateTime'+styleMark] = "background-color:lightpink;";
            } else
            if (item.updateTime.indexOf('Node Info') > 0) {
                item['updateTime'+styleMark] = "background-color:lightblue;";
            }

            item.nodeId     = examLine2(entry);
            item['nodeId'+styleMark] = "color:red;";

            var speed = examLine_speed(entry);
            if (speed) {
                item.speed = speed;
                item['speed'+clickMark] = "javascript:drawChart("+entry.nodeId+", 'speed');";
                item['speed'+styleMark] = "color:blue;";
            }

            var route = examLine_route(entry);
            if (route) {
                item.route = route;
                item['route'+clickMark] = "javascript:drawChart("+entry.nodeId+", 'route', '"+route+
                                         "', '"+item.updateTime.replace(/^.*, /, '')+
                                         "');";
                item['route'+styleMark] = "color:blue;";
                if (route.indexOf('undefined') > 0 || route.indexOf('battery powered!') > 0) {
                    item['route'+styleMark] = 'color:red; font-weight:bold;';
                } else
                if (route.indexOf('[1,') === 0) {
                    if (!usedRoutesOutgoing.hasOwnProperty(entry.nodeId)) {
                        usedRoutesOutgoing[entry.nodeId] = [];
                        usedRoutesOutgoingCount[entry.nodeId] = {};
                    }
                    if (usedRoutesOutgoing[entry.nodeId].indexOf(route) < 0) {
                        usedRoutesOutgoing[entry.nodeId].push(route);
                        usedRoutesOutgoingCount[entry.nodeId][route] = 1;
                    } else {
                        usedRoutesOutgoingCount[entry.nodeId][route] = 
                            usedRoutesOutgoingCount[entry.nodeId][route] + 1;
                    }
                } else
                if (route.indexOf(',1]') > 0) {
                    if (!usedRoutesIncoming.hasOwnProperty(entry.nodeId)) {
                        usedRoutesIncoming[entry.nodeId] = [];
                        usedRoutesIncomingCount[entry.nodeId] = {};
                    }
                    if (usedRoutesIncoming[entry.nodeId].indexOf(route) < 0) {
                        usedRoutesIncoming[entry.nodeId].push(route);
                        usedRoutesIncomingCount[entry.nodeId][route] = 1;
                    } else {
                        usedRoutesIncomingCount[entry.nodeId][route] = 
                            usedRoutesIncomingCount[entry.nodeId][route] + 1;
                    }
                }
            }

            var NUMBER = 44;
            var rssi = examLine_rssi(buff1[i]);
            if (rssi) {
                item.rssi = rssi;
                item['rssi'+clickMark] = "javascript:drawChart("+entry.nodeId+", 'rssi', '"+route+
                                         "', '"+item.updateTime.replace(/^.*, /, '')+
                                         "');";
                item['rssi'+styleMark] = "color:blue;";
            }

            var deviceId = vDevIdPre + entry.nodeId + '-0';
            var deviceP2 = 'undefined';

            currClassId = undefined;
            currCommandId = undefined;
            if (item.updateTime.indexOf('frameType=Node Info') > 0) {
                item.classCommand = 'Node Info';
                item.classes = JSON.stringify(val.slice(3));
            } else {
                var ret = examLine3(val, buff1[i]);
                currClassId   = ret.classId;
                currCommandId = ret.commandId;
                item.classCommand = ret.line;
                if (ret.line.indexOf('undefined') > 0 || ret.line.indexOf('???') > 0) {
                    item['classCommand'+styleMark] = 'color:red; font-weight:bold;';
                }

                //add multichannel endpoint
                if (entry.delivered) {
                    if (ret.destEndpoint) {
                        //entry.nodeId = entry.nodeId+':'+ret.destEndpoint;
                        item.nodeId  = item.nodeId.replace('=', ':'+ret.destEndpoint+'=');
                        deviceId = vDevIdPre + entry.nodeId + '-' + ret.destEndpoint;
                    }
                } else {
                    if (ret.srcEndpoint) {
                        //entry.nodeId = entry.nodeId+':'+ret.srcEndpoint;
                        item.nodeId  = item.nodeId.replace('=', ':'+ret.srcEndpoint+'=');
                        deviceId = vDevIdPre + entry.nodeId + '-' + ret.srcEndpoint;
                    }
                }

                ///special treatment for Security Message Encapsulation
                if (ret.app) {
                    v = ret.v;
                } else {
                    //item.val = JSON.stringify(val);
                    v = reduceValue(val, item.classCommand.split("=").length - 1);
                    //item.v = JSON.stringify(v);
                }
                if (v) {
                    var ret2 = examLine4(v);
                    item.value = ret2.line;
                    deviceP2 = ret2.deviceP2;
                }
            }

            //set device id
            var devTitle;
            if (deviceP2 !== 'undefined') {         //set in examLine4
                deviceId += '-' + deviceP2;
             } else
                if (currClassId === 37) {          //not set in examLine4
                    deviceId += '-' + currClassId;
            } else {
                deviceId = undefined;
            }
            if (deviceId) {
                var deviceTitle = deviceIDArray[deviceId];
                if (! deviceTitle) {
                    deviceId = completeDeviceId(deviceId);
                    if (deviceId) {
                        deviceTitle = deviceIDArray[deviceId];
                    }
                }
                if (deviceTitle) {
                    item[deviceId] = deviceTitle;
                    item[deviceId+clickMark] = urlDevices+deviceId+'" target="_blank';
                    item[deviceId+styleMark] = "color:blue;";
                    if (item.hasOwnProperty('value')) {
                        item['value'+clickMark] = "javascript:drawChart("+entry.nodeId+", '"+deviceId+"');";
                        item['value'+styleMark] = "color:blue;";
                    }
                }
            }
            if (item.hasOwnProperty('value') && typeof item.value === 'string') {
                    if (item.value.indexOf('Success') >= 0) {
                        item['value'+styleMark] = "background-color:yellow;";
                    } else
                    if (item.value.indexOf('Failed') >= 0) {
                        item['value'+styleMark] = "background-color:lightpink;";
                    } else
                    if (item.value.indexOf('jammed') >= 0) {
                        item['value'+styleMark] = "background-color:lightpink;";
                    }
            }

            //add index to output
            item.index = '<'+i+'>';

            //add classCommand to multipleStatistics
            if (multiplesId) {
                //if (! multipleStatistics.hasOwnProperty(multiplesId)) {
                //    multipleStatistics[multiplesId] = {count: 0,
                //                                       index: i,
                //                                      nodeId: entry.nodeId
                //                                     };
                //}
                //multipleStatistics[multiplesId].count += 1;
                multipleStatistics[multiplesId].command = item.classCommand;
            }

            addStatistics(item);
            addStatisticsPerHour(item);
            addStatisticsPerCommand(item, currClassId, currCommandId, multiplesId);
            addStatisticsPerCommandNode(item, currClassId, currCommandId, multiplesId);
if (multiplesId && multiplesIdIx > 0 && skipMultiples) {
    continue;
}
            arr.push(item);
            if (JSON.stringify(item).indexOf('???') >= 0) {
                error_count += 1;
            }
        } //for all entries

        //add new entries to buffexam
        var buffexam = eval(fileArr[fileIx].bufferexam);
        eval(fileArr[fileIx].bufferexam+' = arr');
        lastTimeExamined = buff[len_f - 1].updateTime;

        //build statistics html
        buildHtmlStatistics();

        //build statistics per hour html
        buildHtmlStatisticsPerHour();

        //build multiples html
        buildHtmlMultiples();

        //build differences html
        buildHtmlDifferences();
    } //examSourceFile

    function buildHtmlDifferences(){
        function red (val1, val2, val3) {
            if (val3) {
                if ((val2+':').indexOf(val1+':') !== 0 &&
                    (val3+':').indexOf(val1+':') !== 0) {
                    return "<font color='red'>"+val1+"</font>";
                }
            } else {
                if (val1 !== val2) {
                    return "<font color='red'>"+val1+"</font>";
                }
            }
            return val1;
        }
        var indexT = messageFormats[ix_headerTexts + 19][lang];
        var nodeOrigT = messageFormats[ix_headerTexts + 20][lang];
        var srcParsedT = messageFormats[ix_headerTexts + 21][lang];
        var destParsedT = messageFormats[ix_headerTexts + 22][lang];
        var timeOrigT = messageFormats[ix_headerTexts + 23][lang];
        var timeParsedT = messageFormats[ix_headerTexts + 24][lang];

        differencesHTML =  '';
        differencesHTML += '<table id="indextable" class="sortable">';
        differencesHTML += '<thead><tr>';
        differencesHTML += '<th id="index">'+indexT+'</th>';
        differencesHTML += '<th id="nodeOrig">'+nodeOrigT+'</th>';
        differencesHTML += '<th id="srcParsed">'+srcParsedT+'</th>';
        differencesHTML += '<th id="destParsed">'+destParsedT+'</th>';
        differencesHTML += '<th id="timeOrig">'+timeOrigT+'</th>';
        differencesHTML += '<th id="timeParsed">'+timeParsedT+'</th>';
        differencesHTML += '</tr></thead>';

        differencesHTML += '<tbody>';
        Object.keys(differencesStatistics).forEach(function(index) {
            differencesHTML += '<tr>';
            differencesHTML += '<td headers="index" align=center>'+index+'</td>';
            differencesHTML += '<td headers="nodeOrig" align=center>'+red(differencesStatistics[index].nodeId,
                                                             differencesStatistics[index].src,
                                                             differencesStatistics[index].dest)+'</th>';
            differencesHTML += '<td headers="srcParsed" align=center>'+differencesStatistics[index].src+'</th>';
            differencesHTML += '<td headers="destParsed" align=center>'+differencesStatistics[index].dest+'</th>';
            differencesHTML += '<td headers="timeOrig">'+red(differencesStatistics[index].updateTimeOrigin,
                                                             differencesStatistics[index].updateTimeParsed)+'</th>';
            differencesHTML += '<td headers="timeParsed">'+differencesStatistics[index].updateTimeParsed+'</th>';
            differencesHTML += '</tr>';
        });
        differencesHTML += '</tbody>';
        differencesHTML += '</table>';
    } //buildHtmlDifferences

    function buildHtmlMultiples(){
        var idT = messageFormats[ix_headerTexts + 9][lang];
        var timeT = messageFormats[ix_headerTexts + 12][lang];
        var nodeIdT = messageFormats[ix_headerTexts + 0][lang];
        var nodeT = messageFormats[ix_headerTexts + 1][lang];
        var countT = messageFormats[ix_headerTexts + 10][lang];
        var commandT = messageFormats[ix_headerTexts + 11][lang];

        multiplesHTML =  '';
        multiplesHTML += '<table id="indextable" class="sortable">';
        multiplesHTML += '<thead><tr>';
        multiplesHTML += '<th id="id">'+idT+'</th>';
        multiplesHTML += '<th id="time">'+timeT+'</th>';
        multiplesHTML += '<th id="count">'+countT+'</th>';
        multiplesHTML += '<th id="nodeId">'+nodeIdT+'</th>';
        multiplesHTML += '<th id="node">'+nodeT+'</th>';
        multiplesHTML += '<th id="command">'+commandT+'</th>';
        multiplesHTML += '</tr></thead>';

        //sort by identical count
        var sortArray = [];
        Object.keys(multipleStatistics).sort().forEach(function(key) {
            sortArray.push({key: key, count: multipleStatistics[key].count});
        });
        sortArray.sort((a, b) => (a.count < b.count));

        multiplesHTML += '<tbody>';
        sortArray.forEach( function (item) {
            var key = item.key;
            multiplesHTML += '<tr>';
            multiplesHTML += '<td headers="id" align=center>'+key+'</td>';
            multiplesHTML += '<td headers="time">'+ch_utils.userTime(key.replace(/-.*$/, ''))+'</td>';
            multiplesHTML += '<td headers="count" align=center>'+multipleStatistics[key].count+'</td>';
            multiplesHTML += '<td headers="nodeId" align=center>'+multipleStatistics[key].nodeId+'</td>';
            multiplesHTML += '<td headers="node">'+nodeArray[multipleStatistics[key].nodeId]+'</td>';
            multiplesHTML += '<td headers="command">'+multipleStatistics[key].command+'</td>';
            multiplesHTML += '</tr>';
        });
        multiplesHTML += '</tbody>';
        multiplesHTML += '</table>';
    } //buildHtmlMultiples

    function view(number) {
        if (number > 0) {return number;}
        return '';
    }

    //build statistics per hour html
    function buildHtmlStatisticsPerHour() {
        var hourT = messageFormats[ix_headerTexts + 14][lang];
        var countInT = messageFormats[ix_headerTexts + 2][lang];
        var identicalInT = messageFormats[ix_headerTexts + 3][lang];
        var countOutT = messageFormats[ix_headerTexts + 4][lang];
        var identicalOutT = messageFormats[ix_headerTexts + 5][lang];
        var sumT = messageFormats[ix_headerTexts + 6][lang];
        var identicalSumT = messageFormats[ix_headerTexts + 7][lang];

        var countInS = 0;
        var identicalInS = 0;
        var countOutS = 0;
        var identicalOutS = 0;
        var sumS = 0;
        var identicalSumS = 0;

        //add missing hours
        var start = fileArr[0].updateTime_start;
        var end   = fileArr[0].updateTime_end;
        var hour;
        for (var i = start+3600; i <= end; i+=3600) {
            hour = ch_utils.userTime(i).replace(/:.*$/, '');
            if (! statisticsPerHour.hasOwnProperty(hour)) {
                statisticsPerHour[hour] = {};
                statisticsPerHour[hour].all = {countIn: 0,
                                               identicalIn: 0,
                                               countOut: 0,
                                               identicalOut: 0};
            }
        }
        //sort by hour
        var ordered = {};
        Object.keys(statisticsPerHour).sort().forEach(function(key) {
            ordered[key] = statisticsPerHour[key];
        });

        statisticsPerHourHTML =  '<table id="indextable" class="sortable">';
        statisticsPerHourHTML += '<thead><tr>';
        statisticsPerHourHTML += '<th id="hour">'+hourT+'</th>';
        statisticsPerHourHTML += '<th id="countIn">'+countInT+'</th>';
        statisticsPerHourHTML += '<th id="countOut">'+countOutT+'</th>';
        statisticsPerHourHTML += '<th id="sum">'+sumT+'</th>';
        statisticsPerHourHTML += '<th id="identicalIn">'+identicalInT+'</th>';
        statisticsPerHourHTML += '<th id="identicalOut">'+identicalOutT+'</th>';
        statisticsPerHourHTML += '<th id="identicalSum">'+identicalSumT+'</th>';
        statisticsPerHourHTML += '</tr></thead>';

        statisticsPerHourHTML += '<tbody>';
        Object.keys(ordered).forEach(function(key) {
            statisticsPerHourHTML += '<tr>';
            statisticsPerHourHTML += '<td headers="hour" align=center>'+key+':00</td>';
            statisticsPerHourHTML += '<td headers="countIn" align=right>'+view(statisticsPerHour[key].all.countIn)+'</td>';
            statisticsPerHourHTML += '<td headers="countOut" align=right>'+view(statisticsPerHour[key].all.countOut)+'</td>';
            statisticsPerHourHTML += '<td headers="sum" align=right>'+view(statisticsPerHour[key].all.countIn+
                                                   statisticsPerHour[key].all.countOut)+'</td>';
            statisticsPerHourHTML += '<td headers="identicalIn" align=right>'+view(statisticsPerHour[key].all.identicalIn)+'</td>';
            statisticsPerHourHTML += '<td headers="identicalOut" align=right>'+view(statisticsPerHour[key].all.identicalOut)+'</td>';
            statisticsPerHourHTML += '<td headers="identicalSum" align=right>'+view(statisticsPerHour[key].all.identicalIn+
                                                            statisticsPerHour[key].all.identicalOut)+'</td>';
            statisticsPerHourHTML += '</tr>';

            countInS += statisticsPerHour[key].all.countIn;
            identicalInS += statisticsPerHour[key].all.identicalIn;
            countOutS += statisticsPerHour[key].all.countOut;
            identicalOutS += statisticsPerHour[key].all.identicalOut;
        });
        statisticsPerHourHTML += '</tbody>';

        var hourS = messageFormats[ix_headerTexts + 8][lang];
        sumS = countInS + countOutS;
        identicalSumS = identicalInS + identicalOutS;
        statisticsPerHourHTML += '<tfoot>';
        statisticsPerHourHTML += '<tr>';
        statisticsPerHourHTML += '<th id="hour">'+hourS+'</th>';
        statisticsPerHourHTML += '<th id="countIn" align=right>'+view(countInS)+'</th>';
        statisticsPerHourHTML += '<th id="countOut" align=right>'+view(countOutS)+'</th>';
        statisticsPerHourHTML += '<th id="sum" align=right>'+view(sumS)+'</th>';
        statisticsPerHourHTML += '<th id="identicalIn" align=right>'+view(identicalInS)+'</th>';
        statisticsPerHourHTML += '<th id="identicalOut" align=right>'+view(identicalOutS)+'</th>';
        statisticsPerHourHTML += '<th id="identicalSum" align=right>'+view(identicalSumS)+'</th>';
        statisticsPerHourHTML += '</tr>';
        statisticsPerHourHTML += '</tfoot></table>';
    } //buildHtmlStatisticsPerHour

    //build statistics per command html
    function buildHtmlStatisticsPerCommand(nodeId) {
        var classIdT = messageFormats[ix_headerTexts + 15][lang];
        var commandIdT = messageFormats[ix_headerTexts + 16][lang];
        var nameT = messageFormats[ix_headerTexts + 17][lang];
        var countT = messageFormats[ix_headerTexts + 18][lang];
        var multiplesT = messageFormats[ix_headerTexts + 25][lang];

        var countS = 0;
        var multiplesS = 0;

        statisticsPerCommandHTML =  '<table id="indextable" class="sortable">';
        statisticsPerCommandHTML += '<thead><tr>';
        statisticsPerCommandHTML += '<th id="classId">'+classIdT+'</th>';
        statisticsPerCommandHTML += '<th id="commandId">'+commandIdT+'</th>';
        statisticsPerCommandHTML += '<th id="name">'+nameT+'</th>';
        statisticsPerCommandHTML += '<th id="count">'+countT+'</th>';
        statisticsPerCommandHTML += '<th id="multiples">'+multiplesT+'</th>';
        statisticsPerCommandHTML += '</tr></thead>';

        statisticsPerCommandHTML += '<tbody>';
        Object.keys(statisticsPerCommand).forEach(function(classCommand) {
            if (classCommand) {
                var classId = statisticsPerCommand[classCommand].classCommandId.substr(0,3);
                var commandId = statisticsPerCommand[classCommand].classCommandId.substr(3);
                statisticsPerCommandHTML += '<tr>';
                statisticsPerCommandHTML += '<td headers="classId" align=center>'+classId+'</td>';
                statisticsPerCommandHTML += '<td headers="commandId" align=center>'+commandId+'</td>';
                statisticsPerCommandHTML += '<td headers="name" align=left>'+classCommand+'</td>';
                statisticsPerCommandHTML += '<td headers="count" align=center>'+view(statisticsPerCommand[classCommand].count)+'</td>';
                statisticsPerCommandHTML += '<td headers="multiples" align=center>'+view(statisticsPerCommand[classCommand].multiples)+'</td>';
                statisticsPerCommandHTML += '</tr>';
                countS += statisticsPerCommand[classCommand].count;
                multiplesS += statisticsPerCommand[classCommand].multiples;
            }
        });
        statisticsPerCommandHTML += '</tbody>';

        var sumT = messageFormats[ix_headerTexts + 8][lang];
        statisticsPerHourHTML    += '<tfoot>';
        statisticsPerHourHTML    += '<tr>';
        statisticsPerCommandHTML += '<th id="classId">'+sumT+'</th>';
        statisticsPerCommandHTML += '<th id="commandId"></th>';
        statisticsPerCommandHTML += '<th id="name"></th>';
        statisticsPerCommandHTML += '<th id="count">'+countS+'</th>';
        statisticsPerCommandHTML += '<th id="multiples">'+multiplesS+'</th>';
        statisticsPerHourHTML    += '</tr>';
        statisticsPerHourHTML    += '</tfoot></table>';
    } //buildHtmlStatisticsPerCommand

    //build statistics per command and node html
    function buildHtmlStatisticsPerCommandNode(nodeId) {
        var classIdT = messageFormats[ix_headerTexts + 15][lang];
        var commandIdT = messageFormats[ix_headerTexts + 16][lang];
        var nameT = messageFormats[ix_headerTexts + 17][lang];
        var countT = messageFormats[ix_headerTexts + 18][lang];
        var multiplesT = messageFormats[ix_headerTexts + 25][lang];

        var countS = 0;
        var multiplesS = 0;

        statisticsPerCommandNodeHTML =  '<table id="indextable" class="sortable">';
        statisticsPerCommandNodeHTML += '<thead><tr>';
        statisticsPerCommandNodeHTML += '<th id="classId">'+classIdT+'</th>';
        statisticsPerCommandNodeHTML += '<th id="commandId">'+commandIdT+'</th>';
        statisticsPerCommandNodeHTML += '<th id="name">'+nameT+'</th>';
        statisticsPerCommandNodeHTML += '<th id="count">'+countT+'</th>';
        statisticsPerCommandNodeHTML += '<th id="multiples">'+multiplesT+'</th>';
        statisticsPerCommandNodeHTML += '</tr></thead>';

        statisticsPerCommandNodeHTML += '<tbody>';
        if (nodeId && statisticsPerCommandNode.hasOwnProperty(nodeId)) {
            Object.keys(statisticsPerCommandNode[nodeId]).forEach(function(classCommand) {
                if (classCommand) {
                    var classId = statisticsPerCommand[classCommand].classCommandId.substr(0,3);
                    var commandId = statisticsPerCommand[classCommand].classCommandId.substr(3);
                    statisticsPerCommandNodeHTML += '<tr>';
                    statisticsPerCommandNodeHTML += '<td headers="classId" align=center>'+classId+'</td>';
                    statisticsPerCommandNodeHTML += '<td headers="commandId" align=center>'+commandId+'</td>';
                    statisticsPerCommandNodeHTML += '<td headers="name" align=left>'+classCommand+'</td>';
                    statisticsPerCommandNodeHTML += '<td headers="count" align=center>'+view(statisticsPerCommandNode[nodeId][classCommand].count)+'</td>';
                    statisticsPerCommandNodeHTML += '<td headers="multiples" align=center>'+view(statisticsPerCommandNode[nodeId][classCommand].multiples)+'</td>';
                    statisticsPerCommandNodeHTML += '</tr>';
                    countS += statisticsPerCommandNode[nodeId][classCommand].count;
                    multiplesS += statisticsPerCommandNode[nodeId][classCommand].multiples;
                }
            });
        }
        statisticsPerCommandNodeHTML += '</tbody>';

        var sumT = messageFormats[ix_headerTexts + 8][lang];
        statisticsPerHourNodeHTML    += '<tfoot>';
        statisticsPerHourNodeHTML    += '<tr>';
        statisticsPerCommandNodeHTML += '<th id="classId">'+sumT+'</th>';
        statisticsPerCommandNodeHTML += '<th id="commandId"></th>';
        statisticsPerCommandNodeHTML += '<th id="name"></th>';
        statisticsPerCommandNodeHTML += '<th id="count">'+countS+'</th>';
        statisticsPerCommandNodeHTML += '<th id="multiples">'+multiplesS+'</th>';
        statisticsPerHourNodeHTML   += '</tr>';
        statisticsPerHourNodeHTML    += '</tfoot></table>';
    } //buildHtmlStatisticsPerCommandNode

    //build statistics per hour and node html
    function buildHtmlStatisticsPerHourNode(nodeId) {
        var hourT = messageFormats[ix_headerTexts + 14][lang];
        var countInT = messageFormats[ix_headerTexts + 2][lang];
        var identicalInT = messageFormats[ix_headerTexts + 3][lang];
        var countOutT = messageFormats[ix_headerTexts + 4][lang];
        var identicalOutT = messageFormats[ix_headerTexts + 5][lang];
        var sumT = messageFormats[ix_headerTexts + 6][lang];
        var identicalSumT = messageFormats[ix_headerTexts + 7][lang];

        var countInS = 0;
        var identicalInS = 0;
        var countOutS = 0;
        var identicalOutS = 0;
        var sumS = 0;
        var identicalSumS = 0;

        statisticsPerHourNodeHTML =  '<table id="indextable" class="sortable">';
        statisticsPerHourNodeHTML += '<thead><tr>';
        statisticsPerHourNodeHTML += '<th id="hour">'+hourT+'</th>';
        statisticsPerHourNodeHTML += '<th id="countIn">'+countInT+'</th>';
        statisticsPerHourNodeHTML += '<th id="countOut">'+countOutT+'</th>';
        statisticsPerHourNodeHTML += '<th id="sum">'+sumT+'</th>';
        statisticsPerHourNodeHTML += '<th id="identicalIn">'+identicalInT+'</th>';
        statisticsPerHourNodeHTML += '<th id="identicalOut">'+identicalOutT+'</th>';
        statisticsPerHourNodeHTML += '<th id="identicalSum">'+identicalSumT+'</th>';
        statisticsPerHourNodeHTML += '</tr></thead>';

        //sort by node number
        var ordered = {};
        Object.keys(statisticsPerHour).sort().forEach(function(key) {
            ordered[key] = statisticsPerHour[key];
        });
        statisticsPerHourNodeHTML += '<tbody>';
        Object.keys(ordered).forEach(function(key) {
            statisticsPerHourNodeHTML += '<tr>';
            statisticsPerHourNodeHTML += '<td headers="hour" align=center>'+key+':00</td>';
            if (statisticsPerHour[key].hasOwnProperty(nodeId)) {
                statisticsPerHourNodeHTML += '<td headers="countIn" align=right>'+view(statisticsPerHour[key][nodeId].countIn)+'</td>';
                statisticsPerHourNodeHTML += '<td headers="countOut" align=right>'+view(statisticsPerHour[key][nodeId].countOut)+'</td>';
                statisticsPerHourNodeHTML += '<td headers="sum" align=right>'+view(statisticsPerHour[key][nodeId].countIn+
                                                       statisticsPerHour[key][nodeId].countOut)+'</td>';
                statisticsPerHourNodeHTML += '<td headers="identicalIn" align=right>'+view(statisticsPerHour[key][nodeId].identicalIn)+'</td>';
                statisticsPerHourNodeHTML += '<td headers="identicalOut" align=right>'+view(statisticsPerHour[key][nodeId].identicalOut)+'</td>';
                statisticsPerHourNodeHTML += '<td headers="identicalSum" align=right>'+view(statisticsPerHour[key][nodeId].identicalIn+
                                                                statisticsPerHour[key][nodeId].identicalOut)+'</td>';
                countInS += statisticsPerHour[key][nodeId].countIn;
                identicalInS += statisticsPerHour[key][nodeId].identicalIn;
                countOutS += statisticsPerHour[key][nodeId].countOut;
                identicalOutS += statisticsPerHour[key][nodeId].identicalOut;
            } else {
               statisticsPerHourNodeHTML += '<td headers="countIn" align=right></td>';
               statisticsPerHourNodeHTML += '<td headers="countOut" align=right></td>';
               statisticsPerHourNodeHTML += '<td headers="sum" align=right></td>';
               statisticsPerHourNodeHTML += '<td headers="identicalIn" align=right></td>';
               statisticsPerHourNodeHTML += '<td headers="identicalOut" align=right></td>';
               statisticsPerHourNodeHTML += '<td headers="identicalSum" align=right></td>';
            }
            statisticsPerHourNodeHTML += '</tr>';
        });
        statisticsPerHourNodeHTML += '</tbody>';

        var hourS = messageFormats[ix_headerTexts + 8][lang];
        sumS = countInS + countOutS;
        identicalSumS = identicalInS + identicalOutS;
        statisticsPerHourNodeHTML += '<tfoot>';
        statisticsPerHourNodeHTML += '<tr>';
        statisticsPerHourNodeHTML += '<th id="hour">'+hourS+'</th>';
        statisticsPerHourNodeHTML += '<th id="countIn" align=right>'+view(countInS)+'</th>';
        statisticsPerHourNodeHTML += '<th id="countOut" align=right>'+view(countOutS)+'</th>';
        statisticsPerHourNodeHTML += '<th id="sum" align=right>'+view(sumS)+'</th>';
        statisticsPerHourNodeHTML += '<th id="identicalIn" align=right>'+view(identicalInS)+'</th>';
        statisticsPerHourNodeHTML += '<th id="identicalOut" align=right>'+view(identicalOutS)+'</th>';
        statisticsPerHourNodeHTML += '<th id="identicalSum" align=right>'+view(identicalSumS)+'</th>';
        statisticsPerHourNodeHTML += '</tr>';
        statisticsPerHourNodeHTML += '</tfoot></table>';
    } //buildHtmlStatisticsPerHourNode

    function buildHtmlStatistics(){
        var nodeIdT = messageFormats[ix_headerTexts + 0][lang];
        var nodeT = messageFormats[ix_headerTexts + 1][lang];
        var countInT = messageFormats[ix_headerTexts + 2][lang];
        var identicalInT = messageFormats[ix_headerTexts + 3][lang];
        var countOutT = messageFormats[ix_headerTexts + 4][lang];
        var identicalOutT = messageFormats[ix_headerTexts + 5][lang];
        var sumT = messageFormats[ix_headerTexts + 6][lang];
        var identicalSumT = messageFormats[ix_headerTexts + 7][lang];

        var countInS = 0;
        var identicalInS = 0;
        var countOutS = 0;
        var identicalOutS = 0;
        var sumS = 0;
        var identicalSumS = 0;

        statisticsHTML =  '<table id="indextable" class="sortable">';
        statisticsHTML += '<thead><tr>';
        statisticsHTML += '<th id="nodeId">'+nodeIdT+'</th>';
        statisticsHTML += '<th id="node">'+nodeT+'</th>';
        statisticsHTML += '<th id="countIn">'+countInT+'</th>';
        statisticsHTML += '<th id="countOut">'+countOutT+'</th>';
        statisticsHTML += '<th id="sum">'+sumT+'</th>';
        statisticsHTML += '<th id="identicalIn">'+identicalInT+'</th>';
        statisticsHTML += '<th id="identicalOut">'+identicalOutT+'</th>';
        statisticsHTML += '<th id="identicalSum">'+identicalSumT+'</th>';
        statisticsHTML += '</tr></thead>';

        //add missing nodes
        Object.keys(nodeArray).forEach(function(nodeId, ix) {
            if (nodeId > 1 && ! statistics.hasOwnProperty(nodeId)) {
                statistics[nodeId] = {node: nodeArray[nodeId],
                                      countIn: 0,
                                      identicalIn: 0,
                                      countOut: 0,
                                      identicalOut: 0};
            }
        });

        //sort by node number
        var ordered = {};
        Object.keys(statistics).sort().forEach(function(key) {
            ordered[key] = statistics[key];
        });

        statisticsHTML += '<tbody>';
        Object.keys(ordered).forEach(function(key) {
            statisticsHTML += '<tr>';
            statisticsHTML += '<td headers="nodeId" align=center>'+key+'</td>';
            statisticsHTML += '<td headers="node">'+statistics[key].node+'</td>';
            statisticsHTML += '<td headers="countIn" align=right>'+view(statistics[key].countIn)+'</td>';
            statisticsHTML += '<td headers="countOut" align=right>'+view(statistics[key].countOut)+'</td>';
            statisticsHTML += '<td headers="sum" align=right>'+view(statistics[key].countIn+
                                                   statistics[key].countOut)+'</td>';
            statisticsHTML += '<td headers="identicalIn" align=right>'+view(statistics[key].identicalIn)+'</td>';
            statisticsHTML += '<td headers="identicalOut" align=right>'+view(statistics[key].identicalOut)+'</td>';
            statisticsHTML += '<td headers="identicalSum" align=right>'+view(statistics[key].identicalIn+
                                                            statistics[key].identicalOut)+'</td>';
            statisticsHTML += '</tr>';

            countInS += statistics[key].countIn;
            identicalInS += statistics[key].identicalIn;
            countOutS += statistics[key].countOut;
            identicalOutS += statistics[key].identicalOut;
        });
        statisticsHTML += '</tbody>';

        var nodeIdS = messageFormats[ix_headerTexts + 8][lang];
        var nodeS = '';
        sumS = countInS + countOutS;
        identicalSumS = identicalInS + identicalOutS;
        statisticsHTML += '<tfoot>';
        statisticsHTML += '<tr>';
        statisticsHTML += '<th id="nodeId">'+nodeIdS+'</th>';
        statisticsHTML += '<th id="node">'+nodeS+'</th>';
        statisticsHTML += '<th id="countIn" align=right>'+view(countInS)+'</th>';
        statisticsHTML += '<th id="countOut" align=right>'+view(countOutS)+'</th>';
        statisticsHTML += '<th id="sum" align=right>'+view(sumS)+'</th>';
        statisticsHTML += '<th id="identicalIn" align=right>'+view(identicalInS)+'</th>';
        statisticsHTML += '<th id="identicalOut" align=right>'+view(identicalOutS)+'</th>';
        statisticsHTML += '<th id="identicalSum" align=right>'+view(identicalSumS)+'</th>';
        statisticsHTML += '</tr>';

        function perHour(number, hours) {
            if (number === 0) {return '';}
            return Math.round(number/hours);
        }

        var hours = Math.round((fileArr[0].updateTime_end - fileArr[0].updateTime_start)/(60*60)*100)/100;
        var hoursS = ch_utils.buildMessage(ix_headerTexts + 13, hours, '');
        statisticsHTML += '<tr>';
        statisticsHTML += '<th id="nodeId">'+nodeIdS+'</th>';
        statisticsHTML += '<th id="node">'+hoursS+'</th>';
        statisticsHTML += '<th id="countIn" align=right>'+perHour(countInS, hours)+'</th>';
        statisticsHTML += '<th id="countOut" align=right>'+perHour(countOutS, hours)+'</th>';
        statisticsHTML += '<th id="sum" align=right>'+perHour(sumS, hours)+'</th>';
        statisticsHTML += '<th id="identicalIn" align=right>'+perHour(identicalInS, hours)+'</th>';
        statisticsHTML += '<th id="identicalOut" align=right>'+perHour(identicalOutS, hours)+'</th>';
        statisticsHTML += '<th id="identicalSum" align=right>'+perHour(identicalSumS, hours)+'</th>';
        statisticsHTML += '</tr>';
        statisticsHTML += '</tfoot></table>';
    } //buildHtmlStatistics

    //add to statistics array
    function addStatistics(item){
        var nodeId = item.nodeId.replace(/[:=].*$/, '');
        var node   = item.nodeId.replace(/^.*=/, '');
        var direction = item.updateTime.indexOf('delivered') > 0 ? 'out' : 'in';
        var identical = 0;
        if (item.hasOwnProperty('identicalEntry')) {
            identical = 1;
        }

        if (! statistics.hasOwnProperty(nodeId)) {
            statistics[nodeId] = {node: node,
                                  countIn: 0,
                                  identicalIn: 0,
                                  countOut: 0,
                                  identicalOut: 0};
        }
        if (direction === 'in') {
            statistics[nodeId].countIn += 1;
            statistics[nodeId].identicalIn += identical;
        } else {
            statistics[nodeId].countOut += 1;
            statistics[nodeId].identicalOut += identical;
        }
        return;
    } //addStatistics

    //add to statistics per hour array
    function addStatisticsPerHour(item){
        var nodeId = item.nodeId.replace(/[:=].*$/, '');
        var node   = item.nodeId.replace(/^.*=/, '');
        var direction = item.updateTime.indexOf('delivered') > 0 ? 'out' : 'in';
        var identical = 0;
        if (item.hasOwnProperty('identicalEntry')) {
            identical = 1;
        }

        //set current hour
        var currHour = item.updateTime.replace(/^[^=]*=/, '').replace(/:.*$/, '');
        if (currHour !== statisticsCurrHour) {
            statisticsCurrHour = currHour;
            statisticsPerHour[statisticsCurrHour] = {};
            statisticsPerHour[statisticsCurrHour].all     = {countIn: 0,
                                                             identicalIn: 0,
                                                             countOut: 0,
                                                             identicalOut: 0};
        }

        if (! statisticsPerHour[statisticsCurrHour].hasOwnProperty(nodeId)) {
            statisticsPerHour[statisticsCurrHour][nodeId] = {node: node,
                                                             countIn: 0,
                                                             identicalIn: 0,
                                                             countOut: 0,
                                                             identicalOut: 0};
        }
        if (direction === 'in') {
            statisticsPerHour[statisticsCurrHour][nodeId].countIn += 1;
            statisticsPerHour[statisticsCurrHour][nodeId].identicalIn += identical;
            statisticsPerHour[statisticsCurrHour].all.countIn += 1;
            statisticsPerHour[statisticsCurrHour].all.identicalIn += identical;
        } else {
            statisticsPerHour[statisticsCurrHour][nodeId].countOut += 1;
            statisticsPerHour[statisticsCurrHour][nodeId].identicalOut += identical;
            statisticsPerHour[statisticsCurrHour].all.countOut += 1;
            statisticsPerHour[statisticsCurrHour].all.identicalOut += identical;
        }
        return;
    } //addStatisticsPerHour

    function lpadNumber(num) {
        if (num === undefined) {return '   ';}
        var n = num || 0;
        return ("   " + n).substr(-3);
    }

    //add to statistics per command array
    function addStatisticsPerCommand(item, currClassId, currCommandId, multiplesId){
        var classCommand = item.classCommand;
        var classCommandId = lpadNumber(currClassId)+lpadNumber(currCommandId);

        if (!statisticsPerCommand.hasOwnProperty(classCommand)) {
            statisticsPerCommand[classCommand] = {classCommandId: classCommandId,
                                                  count: 0,
                                                  multiples: 0};
        }

        statisticsPerCommand[classCommand].count += 1;
        if (multiplesId) {
            statisticsPerCommand[classCommand].multiples += 1;
        }
        return;
    } //addStatisticsPerCommand

    //add to statistics per command and node array
    function addStatisticsPerCommandNode(item, currClassId, currCommandId, multiplesId){
        var nodeId = item.nodeId.replace(/[:=].*$/, '');
        var node   = item.nodeId.replace(/^.*=/, '');
        var classCommand = item.classCommand;
        var classCommandId = lpadNumber(currClassId)+lpadNumber(currCommandId);

        if (!statisticsPerCommandNode.hasOwnProperty(nodeId)) {
            statisticsPerCommandNode[nodeId] = {};
        }

        if (! statisticsPerCommandNode[nodeId].hasOwnProperty(classCommand)) {
            statisticsPerCommandNode[nodeId][classCommand] = {classCommandId: classCommandId,
                                                              count: 0,
                                                              multiples: 0};
        }
        statisticsPerCommandNode[nodeId][classCommand].count += 1;
        if (multiplesId) {
            statisticsPerCommandNode[nodeId][classCommand].multiples += 1;
        }
        return;
    } //addStatisticsPerCommandNode

    // ITU-T G.9959 checksum, input: ascii string
    function GenCheckSum(dataString){
        var CheckSum = 0xFF;
        for (var i = 0; i < dataString.length; i++) {
            CheckSum ^= dataString.charCodeAt(i);
        }
        return decToHex(CheckSum);
    }
    // ITU-T G.9959 checksum, input: hex string
    function GenCheckSumHex(hexString){
        var len = hexString.length;
        var CheckSum = 0xFF;
        for (var i = 0; i < hexString.length/2; i++) {
            CheckSum ^= parseInt(hexString.substr(i*2,2),16);
        }
        return decToHex(CheckSum);
    }

    //check for identical entry
    function checkIdentical(entry, buff, len_f, ix) {
        var ret;
        var valueE;
        if (typeof entry.value === 'object') {
            valueE = JSON.stringify(entry.value);
        } else {
            valueE = entry.value;
        }
        var hopsE;
        if (typeof entry.hops === 'object') {
            hopsE = JSON.stringify(entry.hops);
        } else {
            hopsE = entry.hops;
        }
       
        var lastFailPathE;
        if (typeof entry.lastFailPath === 'object') {
            lastFailPathE = JSON.stringify(entry.lastFailPath);
        } else {
            lastFailPathE = entry.lastFailPath;
        }
       
        var frameTypeE = entry.frameType;
        var deliveredE = entry.delivered;
        var deliveryTimeE = entry.deliveryTime;
        for (var i = 0; i < len_f; i++) {
            if (i === ix) {continue;}
            if (buff[i].updateTime > entry.updateTime + 10) {break;}
            if (buff[i].updateTime !== entry.updateTime) {continue;}
            //if (buff[i].updateTime < entry.updateTime - 1) {continue;}
            //if (buff[i].updateTime > entry.updateTime + 1) {continue;}
            if (buff[i].nodeId !== entry.nodeId) {continue;}
            if (buff[i].frameType !== frameTypeE) {continue;}
            if (buff[i].delivered !== deliveredE) {continue;}
            if (buff[i].deliveryTime !== deliveryTimeE) {continue;}
            if (buff[i].duplicate !== entry.duplicate) {continue;}
            var valueI;
            if (typeof buff[i].value === 'object') {
                valueI = JSON.stringify(buff[i].value);
            } else {
                valueI = buff[i].value;
            }
            if (valueI !== valueE) {continue;}
            var hopsI;
            if (typeof buff[i].hops === 'object') {
                hopsI = JSON.stringify(buff[i].hops);
            } else {
                hopsI = buff[i].hops;
            }
            if (hopsI !== hopsE) {continue;}
           
            var lastFailPathI;
            if (typeof buff[i].lastFailPath === 'object') {
                lastFailPathI = JSON.stringify(buff[i].lastFailPath);
            } else {
                lastFailPathI = buff[i].lastFailPath;
            }
            if (lastFailPathI !== lastFailPathE) {continue;}

            var multiplesId = entry.updateTime+'-'+GenCheckSum(JSON.stringify(entry));
            if (entry.delivered !== undefined) {
                multiplesId += '-out';
            } else {
                multiplesId += '-in';
            }
            return multiplesId;
        }
        return ret;
    } //checkIdentical

    //update time
    function examLine1(entry) {
        var line;
        line = entry.updateTime+'='+ch_utils.userTime(entry.updateTime);
        if (entry.hasOwnProperty('frameType')) {
            line += ', frameType='+entry.frameType;
        }
        if (entry.hasOwnProperty('delivered')) {
            line += ', delivered='+entry.delivered;
        }
        return line;
    } //examLine1

    //format value array
    function correctValue(entry) {
        var line;
        line = entry.value;
        if (entry.hasOwnProperty('delivered')) {
            line = line.slice(4, line.length-1);
        }
        return line;
    } //correctValue

    //node
    function examLine2(entry) {
        var line = entry.nodeId;
        var nodeName = nodeArray[entry.nodeId];
        try {
            line += '='+nodeName;
        } catch(err) {
            line += '=???';
        }
        if (!nodeName && nodeArray[entry.nodeId] === undefined) {
            nodeArray[entry.nodeId] = 'undefined';
            var elId = document.getElementById('selNodeId');
            var option = new Option(entry.nodeId+': '+nodeName, entry.nodeId);
            elId.options[elId.options.length] = option;
        }
        return line;
    } //examLine2

    //speed
    function examLine_speed(entry) {
        if (entry.speed) {
            return entry.speed;
        }
        return undefined;
    } //examLine_speed

    //duplicate
    function examLine_duplicate(entry) {
        return entry.duplicate;
    } //examLine_duplicate

    //rssi
    function examLine_rssi(entry) {
        // RSSI - rssi = 256
        // RSSI == 127 >> not available
        if (!entry.rssi) {return undefined;}
        if (typeof entry.rssi !== 'object') {
            return entry.rssi;
        } else {
            return ('['+entry.rssi.toString()+']').replace('not available', '');
        }
        return undefined;
    } //examLine_rssi

    //route
    function examLine_route(entry) {
        var route = false;
        var source, target;
        if (entry.hops !== '[]') {
            route = entry.hops;
            if (entry.hasOwnProperty('delivered')) {
                source = 1;
                target = entry.nodeId;
            } else {
                target = 1;
                source = entry.nodeId;
            }
            route = route.replace('[', '['+source+',').replace(']', ','+target+']');
        } else {    //TODO experimental
            if (entry.hasOwnProperty('delivered')) {
                source = 1;
                target = entry.nodeId;
            } else {
                target = 1;
                source = entry.nodeId;
            }
            route = '['+source+','+target+']';
        }

        //check if all hops existing or battery devices:
        var err_text = '';
        var hops = route.substring(1, route.length-1).split(",");
        hops.forEach(function(hop, ix) {
            if (nodeArray[hop] === undefined) {
                err_text = ' ??? node '+hop+' in route is undefined!';
            } else if (ix > 0 && ix < hops.length-1 && batteryArray[hop] !== undefined) {
                err_text = ' ??? hop '+hop+' in route is battery powered!';
            }
        });

        return route+err_text;
    } //examLine_route

    //class and command
    function examLine3(val, item1) {
        var line = '??? '+JSON.stringify(val);
        var ret = {};
        var classId, commandId;
        try {
            if (val.length === 0) {ret.line = line; return ret;}
            classId = val[0];
            ret.classId = classId;
            line = classId+'='+classArray[classId].className;
            ret.commandId = undefined;

            if (val.length <= 1) {ret.line = line; return ret;}
            commandId = val[1];
            ret.commandId = commandId;
            if (commandId) {
                line += ', '+commandId;
                try {
                    line += '='+classArray[classId][commandId].commandName;
                } catch (err) {
                    line += '=???';
                }
            }

            if (val.length <= 2) {ret.line = line; return ret;}
            //86=Command Class CRC16 Encap, 1=CRC16 Encap
            if (classId === 86 && commandId === 1) {
                classId = val[2];
                commandId = undefined;
                if (val.length > 3) {
                    commandId = val[3];
                }
                line += ', '+classId+'='+classArray[classId].className;
                ret.classId = classId;
                ret.commandId = undefined;
                if (commandId) {
                    line += ', '+commandId;
                    try {
                        line += '='+classArray[classId][commandId].commandName;
                        ret.commandId = commandId;
                    } catch (err) {
                        line += '=???';
                    }
                }
            } else

            //96=Command Class Multi Channel, 13=Multi Channel Cmd Encap
            if (classId === 96 && commandId === 13) {
                classId = val[4];
                commandId = undefined;
                if (val.length > 5) {
                    commandId = val[5];
                }
                line += ', '+classId+'='+classArray[classId].className;
                ret.classId = classId;
                ret.commandId = undefined;
                if (commandId) {
                    line += ', '+commandId;
                    try {
                        line += '='+classArray[classId][commandId].commandName;
                        ret.commandId = commandId;
                    } catch (err) {
                        line += '=???';
                    }
                }
                ret.srcEndpoint = val[2];
                ret.destEndpoint = val[3];
            } else

            //89=Association Group Info, 6=Association Group Command List Report
            if (classId === 89 && commandId === 6) {
                classId = val[4];
                commandId = undefined;
                if (val.length > 5) {
                    commandId = val[5];
                }
                line += ', '+classId+'='+classArray[classId].className;
                ret.classId = classId;
                ret.commandId = undefined;
                if (commandId) {
                    line += ', '+commandId;
                    try {
                        line += '='+classArray[classId][commandId].commandName;
                        ret.commandId = commandId;
                    } catch (err) {
                        line += '=???';
                    }
                }
            } else

            //152=Security, 129=Security Message Encapsulation
            //152=Security, 193=Security Message Encapsulation Nonce Get
            if (classId === 152 && [129,193].includes(commandId)) {
                if (item1) {
                    if (item1.application) {
                        var app = item1.application;
                        var pos1 = app.indexOf('(');
                        var app1, app2, arr, class_command;
                        if (pos1 >= 0) {
                            app1 = app.substr(0, pos1-1).trim();
                            var pos2 = app.indexOf(')');
                            app2 = app.substr(pos1+1, pos2-1);
                            ret.v_hex = app2;
                            arr = hexString2intArray(app2);
                            class_command = classArrayReverse[app1];
                            if (class_command) {
                                arr.unshift(class_command.commandId);
                                arr.unshift(class_command.classId);
                                app1 = class_command.classId+'='+
                                                classArray[class_command.classId].className+', '+
                                       class_command.commandId+'='+app1;
                                ret.classId = class_command.classId;
                                ret.commandId = class_command.commandId;
                            }
                            ret.v     = arr;
                        } else {
                            app1   = app;
                            class_command = classArrayReverse[app];
                            if (class_command) {
                                app1 = class_command.classId+'='+
                                                classArray[class_command.classId].className+', '+
                                       class_command.commandId+'='+app;
                                ret.classId = class_command.classId;
                                ret.commandId = class_command.commandId;
                            }
                        }
                        line += ', '+app1;
                        ret.app = app;
                    } else {
                       line += ', ???  due to nonce lookup problem';
                    }
                }
            }
        } catch(err) {
            //line = JSON.stringify(val)+', '+err.message;
            if (commandId) {
                line = '??? classId='+classId+', commandId='+commandId+': '+err.message+'!';
            } else
            if (classId) {
                line = '??? classId='+classId+': '+err.message+'!';
            } else {
                line = 'classCommand '+err.message+'!';
            }
        }

        ret.line = line;
        return ret;
    } //examLine3

    //reduce value array, count=number of '='signs
    function reduceValue(val, count) {
        var v;
        var sp = 0;

        //86=Command Class CRC16 Encap, 1=CRC16 Encap
        if (val[0] === 86 && val[1] === 1) {
            sp = 2;
        } else

        //96=Command Class Multi Channel, 13=Multi Channel Cmd Encap
        if (val[0] === 96 && val[1] === 13) {
            sp = 4;
        } else

        //89=Association Group Info, 6=Association Group Command List Report
        if (val[0] === 89 && val[1] === 6) {
            sp = 4;
        }
        v = val.slice(sp);

        ///suppress v if no more parameters:
        count = count%2;
        if (v.length === count || v.length === count+2 ) {
            v = undefined;
        }
        return v;
    } //reduceValue

    function hexString2intArray(str) {
        var arr = str.replace(/ /g, '').split(",");
        for(var i=0; i<arr.length; i++) { arr[i] = parseInt(arr[i], 16); }
        return arr;
    }

    function intArray2hexString(arr) {
        var i;
        try {
            for(i=0; i<arr.length; i++) { arr[i] = hex2a(arr[i].toString(16)); }
        } catch(err) {
            for(i=0; i<arr.length; i++) { arr[i] = arr[i].toString(16); }
        }
        return JSON.stringify(arr);
    }

    function hex2a(hexx) {
        var hex = hexx.toString();//force conversion
        var str = '';
        for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }

	function decToHex(decimal) {
		//return ("00" + decimal.toString(16).toUpperCase()).slice(-2);
		return (decimal.toString(16).toUpperCase()).slice(-2);
	}

    //examine value array: val[0]=class, val[1]=command
    function examLine4(val) {
        var prec;
        var scale;
        var size, dec, i;
        var sensorVal;
        var scaleString = '???';
        var line = JSON.stringify(val);
        var deviceP2 = 'undefined';
        var ret = {};

        try {
            switch (val[0]) {
                case 32:    //32=Command Class Basic
                    deviceP2 = val[0];
                    switch (val[1]) {
                        case 1:     //1=Basic Set
                        case 3:     //3=Basic Report
                           line = val[2];
                           break;
                    }
                    break;
                case 37:    //37=Command Class Switch Binary
                case 48:    //48=Command Class Sensor Binary
                    deviceP2 = val[0];
                    switch (val[1]) {
                        case 1:     //1=Binary Set
                        case 3:     //3=Binary Report
                           line = val[2] === 0 ? 'off' : 'on';
                           break;
                   }
                   break;
                case 38:    //38=Command Class Switch Multilevel
                    deviceP2 = val[0];
                    switch (val[1]) {
                        case 1:     //1=Switch Multilevel Set
                        case 3:     //3=Switch Multilevel Report
                           switch (val[2]) {
                               case 0:   line = 'off'; break;
                               case 255: line = 'on'; break;
                               default:  line = val[2]; break;
                           }
                           if (val.length !== 3)
                           {line += ', data: '+JSON.stringify(val);}  //version 2,3,4
                           break;
                   }
                   break;
                case 49:    //Command Class Sensor Multilevel
                    deviceP2 = val[0] + '-' + val[2];
                    switch (val[1]) {
                        case 5:     //Multilevel Sensor Report
                            switch (val[2]) {
                                case 1:     //temperature
                                    line = 'temperature';
                                    break;
                                case 3:     //luminance
                                    line = 'luminance';
                                    break;
                                case 4:    //power
                                    line = 'power';
                                    break;
                                case 5:    //humidity
                                    line = 'humidity';
                                    break;
                                case 27:    //ultraviolet
                                    line = 'ultraviolet';
                                    break;
                                default:
                                    line = val[2]+'=???';
                                    break;
                            }
                            prec = binaryParse(val[3], 0, 3);
                            scale = binaryParse(val[3], 3, 2);
                            size = binaryParse(val[3], 5, 3);
                            if (val[2] === 1) {
                                if (scale === 0) {
                                    scaleString = '°C';
                                } else if (scale === 1) {
                                    scaleString = '°F';
                                }
                            } else if (val[2] === 3) {
                                if (scale === 0) {
                                    scaleString = '%';
                                } else if (scale === 1) {
                                    scaleString = 'Lux';
                                }
                            } else if (val[2] === 4) {
                                if (scale === 0) {
                                    scaleString = 'W';
                                } else if (scale === 1) {
                                    scaleString = 'Btu/h';
                                }
                            } else if (val[2] === 5) {
                                if (scale === 0) {
                                    scaleString = '%';
                                } else if (scale === 1) {
                                    scaleString = 'g/m3';
                                }
                            } else if (val[2] === 27) {
                                if (scale === 0) {
                                    scaleString = 'UV index';
                                }
                            }
                            sensorVal = valueToInt(val, 4, size, prec);
                            line += ' '+sensorVal+ch_utils.convertToUTF8(scaleString);
                            break;
                    }
                    break;  //49
                case 50:    //Command Class Meter
                    deviceP2 = val[0] + '-' + val[1];
                    switch (val[1]) {
                        case 2:     //Meter Report
                            switch (val[2]) {
                                case 1:     //electric
                                    line = 'electric';
                                    break;
                                case 2:     //gas meter
                                    line = 'gas meter';
                                    break;
                                case 3:     //water meter
                                    line = 'water meter';
                                    break;
                                case 33:    //electric meter (not documented!)
                                    line = 'electric meter';
                                    break;
                                default:
                                    line = val[2]+'=???';
                                    break;
                            }
                            prec = binaryParse(val[3], 0, 3);
                            scale = binaryParse(val[3], 3, 2);
                            size = binaryParse(val[3], 5, 3);
                            if (val[2] === 1 || val[2] === 33) {
                                if (scale === 0) {
                                    scaleString = 'kWh';
                                } else if (scale === 1) {
                                    scaleString = 'kVAh';
                                } else if (scale === 2) {
                                    scaleString = 'W';
                                } else if (scale === 3) {
                                    scaleString = 'Pulse count';
                                } else if (scale === 4) {
                                    scaleString = 'V';
                                } else if (scale === 5) {
                                    scaleString = 'A';
                                } else if (scale === 6) {
                                    scaleString = 'Power Factor';
                                } else if (scale === 7) {
                                    scaleString = 'M.S.T.';
                                }
                            }
                            sensorVal = valueToInt(val, 4, size, prec);
                            line += ' '+sensorVal+scaleString;
                            break;
                    }
                    //TODO for test only !!!!!!!!!!!!!!!!!!!
                    if (line[0] !== '[') {line += ', data: '+JSON.stringify(val);}
                    break;  //50
                case 91:    //91=Central Scene
                    deviceP2 = val[0];
                    line = 'Scene #'+val[4];
                    //TODO for test only !!!!!!!!!!!!!!!!!!!
                    if (line[0] !== '[') {line += ', data: '+JSON.stringify(val);}
                    break;
                case 98:    //98=Door Lock
                    deviceP2 = val[0];
                    switch (val[1]) {
                        case 1:     //1=Door Lock Operation Set
                            //Door Lock Mode
                            switch (val[2]) {
                                case 0:
                                    line = 'Door Unsecured';
                                    break;
                                case 1:
                                    line = 'Door Unsecured with timeout';
                                    break;
                                case 2:
                                    line = 'Door Unsecured for inside Door Handles';
                                    break;
                                case 3:
                                    line = 'Door Unsecured for inside Door Handles with timeout';
                                    break;
                                case 4:
                                    line = 'Door Unsecured for outside Door Handles';
                                    break;
                                case 5:
                                    line = 'Door Unsecured for outside Door Handles with timeout';
                                    break;
                                case 255:
                                    line = 'Door Secured';
                                    break;
                                default:
                                    line = val[5]+'=???';
                                    break;
                            }
                            break;
                        case 3:     //3=Door Lock Operation Report
                            //Door Lock Mode
                            switch (val[2]) {
                                case 0:
                                    line = 'Door Unsecured, ';
                                    break;
                                case 1:
                                    line = 'Door Unsecured with timeout, ';
                                    break;
                                case 2:
                                    line = 'Door Unsecured for inside Door Handles, ';
                                    break;
                                case 3:
                                    line = 'Door Unsecured for inside Door Handles with timeout, ';
                                    break;
                                case 4:
                                    line = 'Door Unsecured for outside Door Handles, ';
                                    break;
                                case 5:
                                    line = 'Door Unsecured for outside Door Handles with timeout, ';
                                    break;
                                case 254:
                                    line = 'Door/Lock State Unknown, ';
                                    break;
                                case 255:
                                    line = 'Door Secured, ';
                                    break;
                                default:
                                    line = val[5]+'=???, ';
                                    break;
                            }
                            //Door Condition
                            switch (val[4]) {
                                case 0:
                                    line += 'Latch Open, Bolt Locked, Door Open';
                                    break;
                                case 1:
                                    line += 'Latch Open, Bolt Locked, Door Closed';
                                    break;
                                case 2:
                                    line += 'Latch Open, Bolt Unlocked, Door Open';
                                    break;
                                case 3:
                                    line += 'Latch Open, Bolt Unlocked, Door Closed';
                                    break;
                                case 4:
                                    line += 'Latch Closed, Bolt Locked, Door Open';
                                    break;
                                case 5:
                                    line += 'Latch Closed, Bolt Locked, Door Closed';
                                    break;
                                case 6:
                                    line += 'Latch Closed, Bolt Unlocked, Door Open';
                                    break;
                                case 7:
                                    line += 'Latch Closed, Bolt Unlocked, Door Closed';
                                    break;
                                default:
                                    line += val[5]+'=???';
                                    break;
                            }
                            break;
                    }
                    //TODO for test only !!!!!!!!!!!!!!!!!!!
                    if (line[0] !== '[') {line += ', data: '+JSON.stringify(val);}
                    break;

                case 99:    //99=User Code
                    deviceP2 = 'undefined';
                    switch (val[1]) {
                        case 1:     //3=User Code Set
                        case 3:     //3=User Code Report
                            //User ID
                            line = 'User ID='+val[2];
                            //User ID Status
                            switch (val[3]) {
                                case 0:
                                    line += ' Available(not set)';
                                    break;
                                case 1:
                                    line += ' Occupied';
                                    break;
                                case 2:
                                    line += ' Reserved by administrator';
                                    break;
                                case 254:
                                    line += ' Status not available';
                                    break;
                               default:
                                    line += ' '+val[3]+'=???';
                                    break;
                            }
                            //Parameters
                            line += ', User Code='+intArray2hexString(val.slice(4));
                    }
                    break;

                case 108:    //108=Command Class Supervision
                    deviceP2 = val[0];
                    switch (val[1]) {
                        case 2:     //5=Supervision Report
                            //Status
                            switch (val[3]) {
                                case 0:
                                    line = 'No Support';
                                    break;
                                case 1:
                                    line = 'Working';
                                    break;
                                case 2:
                                    line = 'Failed';
                                    break;
                                case 255:
                                    line = 'Success';
                                    break;
                               default:
                                    line = val[5]+'=???';
                                    break;
                            }
                    }
                    //TODO for test only !!!!!!!!!!!!!!!!!!!
                    if (line[0] !== '[') {line += ', data: '+JSON.stringify(val);}
                    break;

                case 112:    //112=Command Class Configuration
                    switch (val[1]) {
                        case 4:     //5=Configuration Set
                            //Parameter No
                            line = 'Parameter='+val[2];
                            switch(0b10000000 & val[3]) {
                                case 0:     //no default
                                    //Size
                                    size = 7 & val[3];
                                    line += ', '+size*8+'bit';
                                    //Values
                                    dec = 0;
                                    for (i = 1; i <= size; i++) {
                                        dec = dec * 256 + val[3+i];
                                    }
                                    line += ' Value='+dec+' '+JSON.stringify(val.slice(4));
                                    break;
                                case 1:     //set to default
                                    line += ' set to default';
                                    break;
                            }
                            break;
                        case 5:     //5=Configuration Get
                            //Parameter No
                            line = 'Parameter='+val[2];
                            break;
                        case 6:     //6=Configuration Report
                            //Parameter No
                            line = 'Parameter='+val[2];
                            //Size
                            size = 7 & val[3];
                            line += ', '+size*8+'bit';
                            //Values
                            dec = 0;
                            for (i = 1; i <= size; i++) {
                                dec = dec * 256 + val[3+i];
                            }
                            line += ' Value='+dec+' '+JSON.stringify(val.slice(4));
                    }
                    //TODO for test only !!!!!!!!!!!!!!!!!!!
                    if (line[0] !== '[') {line += ', data: '+JSON.stringify(val);}
                    break;

              case 113:    //113=Command Class Alarm
                    deviceP2 = val[0] + '-' + val[6];
                    switch (val[1]) {
                        case 5:     //5=Notification Report
                            //Notification Status
                            switch (val[5]) {
                                case 0:
                                    line = 'unsolicited transmissions disabled or queued notifications';
                                    break;
                                case 254:
                                    line = 'empty event queue';
                                    break;
                                case 255:
                                    line = 'unsolicited transmissions enabled';
                                    break;
                                default:
                                    line = val[5]+'=???';
                                    break;
                            }
                            //Notification Type
                            var nType = notificationData[val[6]].type;
                            line += ', '+nType;
                            //Notification Event/State
                            var nEvent = notificationData[val[6]].events[val[7]];
                            line += ', '+nEvent;
                            //Parameters
                            if (val.length > 10) {
                                var ret2 = examLine4(val.slice(9));
                                line += ', '+ret2.line;
                                if (ret2.deviceP2 !== 'undefined') {
                                    deviceP2 += '-' + ret2.deviceP2;
                                }
                            } else {
                                //TODO for test only !!!!!!!!!!!!!!!!!!!
                                if (line[0] !== '[') {line += ', data: '+JSON.stringify(val);}
                            }
                           break;
                   }
                   break; //113
                case 128:    //128=Command Class Battery
                    deviceP2 = val[0];
                    switch (val[1]) {
                        case 3:     //3=Battery Report
                           line = val[2]+'%';
                           if (val[2] === 255) {
                               line += ' = low warning';
                           }
                           break;
                   }
                   break;
            }
        } catch(err) {
            line += ', '+err.message;
        }
        ret.line = line;
        ret.deviceP2 = deviceP2;
        return ret;
    } //examLine4

    function binaryParse(i, start, len) {
        //convert integer to binary
        var hex = '00000000'+i.toString(2);
        hex = hex.substr(hex.length - 8);

        //cut requested part from binary
        hex = hex.substr(start, len);

        //return as integer
        return parseInt(hex, 2);
    } //binaryParse

    function valueToInt(val, start, len, prec) {
        //convert single values to hex and concat
        var valHex = '';
        for (var i = start; i < start+len; i++) {
            var hex = '00'+val[i].toString(16);
            hex = hex.substr(hex.length - 2);
            valHex += hex;
        }

        //return after converted to int
        var ret = parseInt(valHex, 16);

        //check it negative
        var test = val[start] & 0x80;
        var neg = test === 0 ? false : true;

        if (neg) {
            ret = ret - (0x1 <<(8*len));
        }
        return ret/Math.pow(10, prec);
    } //valueToInt

    function printSourceFile(fileIx) {
        var messno = 6;
        if (error_count) {messno = 9;}
        printJSON(eval(fileArr[fileIx].buffer),
                  messno,
                  fileArr[fileIx].text,
                  zway_originPacketsjson.length,
                  '', //dataDir,
                  fileArr[fileIx].time_start,
                  fileArr[fileIx].time_end,
                  error_count);
        scrollDown(true);
       //if (error_count) {alert(error_count+' erroneous packets found (>>???)');}
    } //printSourceFile

    function printRange(fileIx, exam) {
        ///get max records to display
        maxRecordsSelected = document.getElementById("maxRecords").value;
        if (maxRecordsSelected && maxRecordsSelected >= '1') {
            maxRecordsSelected = maxRecordsSelected;
        } else {
            maxRecordsSelected = undefined;
        }

        //get search text
        var selText = document.getElementById("selText").value.trim();

        ///get times from timepicker and convert to unix time
        var time_start = $('#datetime_from').val();
        if (!time_start) {
            time_start = fileArr[0].time_start;
        }
        var start_unix = toTimestamp(time_start);
        var time_end   = $('#datetime_to').val();
        if (!time_end) {
            time_end = fileArr[0].time_end;
        }
        var end_unix   = toTimestamp(time_end);

        if (exam === undefined) {
            exam = false;
        }
        var buffer;
        if (exam) {
            buffer = fileArr[fileIx].bufferexam;
        } else {
            buffer = fileArr[fileIx].buffer;
        }

        String.prototype.regexIndexOf = function(regex, startpos) {
           var indexOf = this.substring(startpos || 0).search(regex);
            return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
        };

        ///print file range
        var range = eval(buffer).filter(function (packet) {
            var u = (packet.updateTime+'').replace(/=.*/, '');
            var d = (packet.nodeId+'').replace(/=.*/, '');
            var s = JSON.stringify(packet);
            if (useRegex) {
                return u >= start_unix && u <= end_unix &&
                      (devNodeIdSelected === undefined || devNodeIdSelected === d ||
                       devNodeIdSelected === packet.src+'' || devNodeIdSelected === packet.dest+'' ||
                       (packet.src+'').indexOf(devNodeIdSelected+':') === 0 ||
                       (packet.dest+'').indexOf(devNodeIdSelected+':') === 0 ||
                       (d+'').indexOf(devNodeIdSelected+':') === 0
                      ) &&
                       (selText === undefined || 
                        !invertFilter && s.regexIndexOf(selText) >= 0 ||
                        invertFilter  && s.regexIndexOf(selText) < 0);
            } else {
                return u >= start_unix && u <= end_unix &&
                      (devNodeIdSelected === undefined || devNodeIdSelected === d ||
                       devNodeIdSelected === packet.src+'' || devNodeIdSelected === packet.dest+'' ||
                       (packet.src+'').indexOf(devNodeIdSelected+':') === 0 ||
                       (packet.dest+'').indexOf(devNodeIdSelected+':') === 0 ||
                       (d+'').indexOf(devNodeIdSelected+':') === 0
                      ) &&
                      (selText === undefined || 
                       !invertFilter && s.indexOf(selText) >= 0 ||
                       invertFilter  && s.indexOf(selText) < 0);
            }
        });
        if (maxRecordsSelected) {
            range = range.slice(range.length - maxRecordsSelected);
        }

        var buffName = exam === true ? messageFormats[0][lang] : fileArr[fileIx].text;
        var messno = 6;
        if (error_count) {messno = 9;}
        if (range.length === 0) {
            printJSON(range,
                      messno,
                      buffName,
                      range.length,
                      '', //dataDir,
                      time_start,
                      time_end,
                      error_count);
        } else {
            printJSON(range,
                      messno,
                      buffName,
                      range.length,
                      '', //dataDir,
                      ch_utils.userTime((range[0].updateTime+'').replace(/=.*$/, '')),
                      ch_utils.userTime((range[range.length-1].updateTime+'').replace(/=.*$/, '')),
                      error_count);
        }

        scrollDown(true);
     } //printRange

    function scrollDown(flag) {
        if (flag) {
            $("#json-renderer").scrollTop($("#json-renderer")[0].scrollHeight);
        }
    } //scrollDown

    function scrollUp(flag) {
        if (flag) {
            $("#json-renderer").scrollTop(0);
        }
    } //scrollUp

    function buttonTextFileIx(fileIx) {
        var buttonId = fileArr[fileIx].file.replace('.', '');
        var el = document.getElementById(buttonId);
        if (el) {
            el.firstChild.data = fileArr[fileIx].text;
            ch_utils.buttonVisible(buttonId, true);
        }
    } //buttonTextFileIx

//------------- event listeners -----------------------------------------------
    document.getElementById('zway_originPacketsjson').addEventListener('click', function() {
        currentPage = 'zway_originPacketsjson';
        printRange(0);
        //printSourceFile(0);
    });

    document.getElementById('zway_parsedPacketsjson').addEventListener('click', function() {
        currentPage = 'zway_parsedPacketsjson';
        printRange(1);
        //printSourceFile(1);
    });

    document.getElementById('showRange').addEventListener('click', function() {
        currentPage = 'showRange';
        printRange(fileDisplayIx, true);
    });

    document.getElementById('update').addEventListener('click', function() {
        updateChart(true);
    });

    var el = document.getElementById("refreshCheckbox");
    if (el) {
        $('#refreshCheckbox').change(toggleDoRefresh);
    }

    function toggleDoRefresh() {
        var el = document.getElementById("refreshCheckbox");
        if (!el) {
            doRefresh = false;
        } else {
            doRefresh = el.checked;
            setRefreshInterval(doRefresh);
        }
    } //toggleDoRefresh

    document.getElementById('statistics').addEventListener('click', function() {
        currentPage = 'statistics';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        printHTML(statisticsHTML, ixButtonTextBase + 12);
    });

    document.getElementById('statisticsPerHour').addEventListener('click', function() {
        currentPage = 'statisticsPerHour';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        printHTML(statisticsPerHourHTML, 12);
    });

    document.getElementById('statisticsPerHourNode').addEventListener('click', function() {
        currentPage = 'statisticsPerHourNode';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        buildHtmlStatisticsPerHourNode(devNodeIdSelected);
        printHTML(statisticsPerHourNodeHTML, 13, devNodeIdSelected);
    });

    document.getElementById('statisticsPerCommand').addEventListener('click', function() {
        currentPage = 'statisticsPerCommand';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        buildHtmlStatisticsPerCommand();
        printHTML(statisticsPerCommandHTML, 15);
    });

    document.getElementById('statisticsPerCommandNode').addEventListener('click', function() {
        currentPage = 'statisticsPerCommandNode';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        buildHtmlStatisticsPerCommandNode(devNodeIdSelected);
        printHTML(statisticsPerCommandNodeHTML, 14, devNodeIdSelected);
    });

    document.getElementById('multiples').addEventListener('click', function() {
        currentPage = 'multiples';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        printHTML(multiplesHTML, ixButtonTextBase + 13);
    });

    document.getElementById('differences').addEventListener('click', function() {
        currentPage = 'differences';
        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        printHTML(differencesHTML, 20);
    });

    document.getElementById('graphDevice').addEventListener('click', function() {
        var tooltipEl = document.getElementById('chartjs-tooltip');
        if (tooltipEl) {tooltipEl.remove();}

        doRefresh = false;
        setRefreshInterval(doRefresh);
        var el = document.getElementById("refreshCheckbox");
        if (el) {
            el.checked = doRefresh;
        }
        if (devIdSelected === 'outgoing') {
            ch_utils.buttonVisible("toLeftRight", true);
            buildRouteData(devNodeIdSelected, devIdSelected);
            if (!devIdData) {
                ch_utils.displayMessage(30, devNodeIdSelected);
            } else {
                ch_utils.displayMessage(31, devIdData.values[0].length-2, devNodeIdSelected);
                drawDeviceData(devIdData, devNodeIdSelected);
            }
        } else if (devIdSelected === 'incoming') {
            ch_utils.buttonVisible("toLeftRight", true);
            buildRouteData(devNodeIdSelected, devIdSelected);
            if (!devIdData) {
                ch_utils.displayMessage(32, devNodeIdSelected);
            } else {
                ch_utils.displayMessage(33, devIdData.values[0].length-2, devNodeIdSelected);
                drawDeviceData(devIdData, devNodeIdSelected);
            }
        } else if (devIdSelected === 'DR') {
            ch_utils.buttonVisible("toLeftRight", true);
            buildDataRates(devNodeIdSelected);
            if (!devIdData) {
                ch_utils.displayMessage(21, devNodeIdSelected);
            } else {
                ch_utils.displayMessage(22, devIdData.values[0].length-2, devNodeIdSelected);
                drawDeviceData(devIdData, devNodeIdSelected);
            }
        } else if (devIdSelected === 'RS') {
            ch_utils.buttonVisible("toLeftRight", true);
            buildRSSI(devNodeIdSelected);
            if (!devIdData) {
                ch_utils.displayMessage(23, devNodeIdSelected);
            } else {
                ch_utils.displayMessage(24, devIdData.values[0].length-2, devNodeIdSelected);
                drawDeviceData(devIdData, devNodeIdSelected);
            }
        } else {
            ch_utils.buttonVisible("toLeftRight", false);
            var devIdDataLength = buildDeviceData(devIdSelected);
            if (!devIdData) {
                ch_utils.displayMessage(18, devIdSelected);
            } else {
                ch_utils.displayMessage(19, 
                                   devIdDataLength,
                                   devIdSelected);
                drawDeviceData(devIdData, devIdSelected);
            }
        }
    });

    document.getElementById('toLeft').addEventListener('click', function() {
        $("#selNodeId > option:selected")
            .prop("selected", false)
            .prev()
            .prop("selected", true);
        devNodeIdSelected = $('#selNodeId').val();

        if (devNodeIdSelected === '') {
            $("#selNodeId > option:selected")
                .prop("selected", false)
                .next()
                .prop("selected", true);
            devNodeIdSelected = $('#selNodeId').val();
        }
        var devIdSelectedOld = devIdSelected;
        buildSelectBoxDevId(devNodeIdSelected);
        document.getElementById('selDevice').value = devIdSelectedOld;
        $("#graphDevice").click();
    });

    document.getElementById('toRight').addEventListener('click', function() {
        if (devNodeIdSelected*1 !== 255) {
            $("#selNodeId > option:selected")
                .prop("selected", false)
                .next()
                .prop("selected", true);
            devNodeIdSelected = $('#selNodeId').val();
        }
        var devIdSelectedOld = devIdSelected;
        buildSelectBoxDevId(devNodeIdSelected);
        document.getElementById('selDevice').value = devIdSelectedOld;
       $("#graphDevice").click();
    });

    function buildRouteData(devId, devIdSelected) {
        //console.log('buildRouteData: '+devId);
        devIdData = undefined;
        var devIdDataLength = 0;
        var explorerFrameCount = 0;

        var usedRoutes, usedRoutesCountDev;
        if (devIdSelected === 'outgoing') {
            if (!usedRoutesOutgoing[devId]) {
                return 0;
            }
            usedRoutes = usedRoutesOutgoing[devId].sort();
            usedRoutesCountDev = usedRoutesOutgoingCount[devId];
        } else {
            if (!usedRoutesIncoming[devId]) {
                return 0;
            }
            usedRoutes = usedRoutesIncoming[devId].sort();
            usedRoutesCountDev = usedRoutesIncomingCount[devId];
        }

        var chartHeaderTemplate = {
            ylabels:    [""],
            devId:      devId,
            type:       ch_utils.buildMessage(ix_selectTexts+2),
            scaleTitle: '',
            steppedLine: true,
            spanGaps: true,    //missing values cause no gaps in line
            yticks: {},
        };

        function addHeader(route) {
            var i = devIdData.chartHeader.length;
            devIdData.chartHeader.push(JSON.parse(JSON.stringify(chartHeaderTemplate)));

            //set start point of x axis
            devIdData.values.push([]);
            devIdData.values[i].push({time: fileArr[0].updateTime_start, value: null});
        }

        devIdData = {chartHeader: [],
                     values:      []
        };
        var ylabels = [''];
        for (var i = 0; i < usedRoutes.length; i++) {
            if (usedRoutes[i] === priorityArrayIn[devId] ||
                usedRoutes[i] === priorityArrayOut[devId]) {
                ylabels.push('* '+usedRoutes[i]);
            } else {
                ylabels.push(usedRoutes[i]);
            }
        }
        ylabels.push('');

        //normal packets
        addHeader();
        devIdData.chartHeader[0].borderColor = '#00bfff';
        devIdData.chartHeader[0].ylabels = ylabels;
        if (devIdSelected === 'outgoing') {
            devIdData.chartHeader[0].type = ch_utils.buildMessage(ix_selectTexts+2);
            devIdData.chartHeader[0].devTitle = ch_utils.buildMessage(34,devId);
        } else {
            devIdData.chartHeader[0].type = ch_utils.buildMessage(ix_selectTexts+3);
            devIdData.chartHeader[0].devTitle = ch_utils.buildMessage(35,devId);
        }

        //explorer frames
        addHeader();
        devIdData.chartHeader[1].borderColor = '#FF0000';
        devIdData.chartHeader[1].devTitle = ch_utils.buildMessage(36);
           
        var buffer_exam = eval(fileArr[0].bufferexam);  //buffer_exam = zway_originPacketsexam
        for (var ix = 0; ix < buffer_exam.length; ix++) {
            var buffer_exam_ix = buffer_exam[ix];
            if (buffer_exam_ix.hasOwnProperty('identicalEntry')) {
                var num = buffer_exam_ix.identicalEntry.replace(/ .*/, '')*1;
                if (num > 0) {
                    continue;
                }
            }
            if (buffer_exam_ix.updateTime.indexOf('delivered=false') >= 0) {
                continue;
            }
            if (!buffer_exam_ix.route) {
                continue;
            }
            var route = buffer_exam_ix.route;
            if (devIdSelected === 'outgoing') {
                if (route.indexOf(','+devId+']') < 0) {
                    continue;
                }
            } else {
                if (route.indexOf('['+devId+',') < 0) {
                    continue;
                }
            }

            var index = buffer_exam_ix.index;
            var classCommand = buffer_exam_ix.classCommand || '';
            var updateTime = buffer_exam_ix.updateTime.replace(/=.*$/, '')*1;

            var val = route;
            if (route === priorityArrayIn[devId] ||
                route === priorityArrayOut[devId]) {
                val = '* '+route;
            }
            
            if (buffer_exam_ix.updateTime.indexOf('Explore Frame') >= 0) {
                devIdData.values[0].push({time: updateTime, value: null}); 
                devIdData.values[1].push({time: updateTime, value: val, 
                                          tooltip: index+': route '+route+'\n'+classCommand});
                devIdDataLength++;
                explorerFrameCount++;
            } else {
                devIdData.values[0].push({time: updateTime, value: val, 
                                          tooltip: index+': route '+route+'\n'+classCommand});
                devIdData.values[1].push({time: updateTime, value: null}); 
                devIdDataLength++;
            }
        } //for ix

        //set end point of x axis
        if (devIdData) {
            devIdData.values[0].push({time: fileArr[0].updateTime_end, value: null});
            devIdData.values[1].push({time: fileArr[0].updateTime_end, value: null});

            if (explorerFrameCount === 0) {
                devIdData.chartHeader.pop();
                devIdData.values.pop();
            }
        }
        return devIdDataLength;
    } //buildRouteData

    function buildDataRates(devId) {
        //console.log('buildDataRates: '+devId);
        devIdData = undefined;
        var devIdDataLength = 0;
        //console.log(usedRoutesOutgoing[devId]);
        if (!usedRoutesOutgoing[devId]) {
            return 0;
        }

        //compute route counts
        var routeCountAll = 0, routeCountMax = 0, routeCountMedium = 0;
        var usedRoutesOutgoingCountDev = usedRoutesOutgoingCount[devId];
        //console.log(usedRoutesOutgoingCountDev);
        Object.entries(usedRoutesOutgoingCountDev).forEach (function (key) {
            var c = key[1];
            routeCountAll = routeCountAll + c;
            if (c > routeCountMax) {
                routeCountMax = c;
            }
        });
        routeCountMedium = Math.ceil(routeCountMax/2);

        var scaleTitle = ch_utils.buildMessage(ix_headerTexts + 29);
        var chartHeaderTemplate = {
            ylabels:    ["","100 "+scaleTitle,
                         "" , "40 "+scaleTitle,
                         "" , "9.6 "+scaleTitle, ""],
            devId:      devId,
            type:       ch_utils.buildMessage(ix_selectTexts),
            scaleTitle: scaleTitle,
            steppedLine: true,
            spanGaps: true,    //missing values cause no gaps in line
            yticks: {},
        };

        //attention: Due to a bug in chartjs library, only hex colors are working 
        //           correctly in custom tooltips
        function generateColor(route) {
            var crossSum1 = 0;
            var crossSum2 = 0;
            var crossSum3 = 0;
            var nodeArr = route.substring(1, route.length-1).split(',');
            nodeArr.forEach ( function (node, ix) {
                crossSum1 = crossSum1 + node * 17 * ix + ix * 11;
                crossSum2 = crossSum2 + node * 54 * ix + ix * 13;
                crossSum3 = crossSum3 + node * 77 * ix + ix * 15;
            });         
            return '#' + (crossSum1 % 256).toString(16).padStart(2, '0') +
                         (crossSum2 % 256).toString(16).padStart(2, '0') +
                         (crossSum3 % 256).toString(16).padStart(2, '0');
        }

        function addHeader(route) {
            var i = devIdData.chartHeader.length;
            devIdData.chartHeader.push(JSON.parse(JSON.stringify(chartHeaderTemplate)));
            var col = generateColor(route);
            devIdData.chartHeader[i].borderColor = col;

            //set start point of x axis
            devIdData.values.push([]);
            devIdData.values[i].push({time: fileArr[0].updateTime_start, value: null});
            if (usedRoutesOutgoingCountDev[route] < routeCountMedium) {
                devIdData.chartHeader[i].borderDash = [3, 3];
            } else
            if (usedRoutesOutgoingCountDev[route] < routeCountMax) {
                devIdData.chartHeader[i].borderDash = [7, 7];
            }
            if (route === priorityArrayOut[devId]) {
                devIdData.chartHeader[i].backgroundColor = col;
                devIdData.chartHeader[i].devTitle = ch_utils.buildMessage(28, route);
            } else {
                devIdData.chartHeader[i].devTitle = ch_utils.buildMessage(27, route);
            }
        }

        devIdData = {chartHeader: [],
                     values:      []
        };
        var usedRoutes = usedRoutesOutgoing[devId].sort();
        for (var i = 0; i < usedRoutes.length; i++) {
            addHeader(usedRoutes[i]);
        }
           
        var buffer_exam = eval(fileArr[0].bufferexam);  //buffer_exam = zway_originPacketsexam
        for (var ix = 0; ix < buffer_exam.length; ix++) {
            var buffer_exam_ix = buffer_exam[ix];
            if (buffer_exam_ix.hasOwnProperty('identicalEntry')) {
                var num = buffer_exam_ix.identicalEntry.replace(/ .*/, '')*1;
                if (num > 0) {
                    continue;
                }
            }
            if (buffer_exam_ix.updateTime.indexOf('delivered=false') >= 0) {
                continue;
            }
            if (!buffer_exam_ix.speed) {
                continue;
            }
            if (!buffer_exam_ix.route) {
                continue;
            }
            var route = buffer_exam_ix.route;
            if (route.indexOf(','+devId+']') < 0) {
                continue;
            }

            var index = buffer_exam_ix.index;
            var classCommand = buffer_exam_ix.classCommand || '';
            var val = buffer_exam_ix.speed.replace(/ .*$/, '');
            var updateTime = buffer_exam_ix.updateTime.replace(/=.*$/, '')*1;

            for (var j = 0; j < usedRoutes.length; j++) {
                if (route === usedRoutes[j]) {
                    devIdData.values[j].push({time: updateTime, value: val+' '+scaleTitle, 
                                            tooltip: index+': route '+route+'\n'+classCommand});
                    devIdDataLength++;
                } else {
                    devIdData.values[j].push({time: updateTime, value: null, tooltip: null});
                }
            }
        } //for ix

        //set end point of x axis
        if (devIdData) {
            for (var k = 0; k < usedRoutes.length; k++) {
                devIdData.values[k].push({time: fileArr[0].updateTime_end, value: null});
            }
        }
        return devIdDataLength;
    } //buildDataRates

    function buildRSSI(devId) {
        devIdData = undefined;
        var arr, arr_ix;
        eval('arr = '+fileArr[1].buffer);

        var buffer_exam = eval(fileArr[0].bufferexam);

        //run through all parsed packets
        for (var ix = 0; ix < arr.length; ix++) {
            arr_ix = arr[ix];
            if (!arr_ix.rssi) {
                continue;
            }
            try {
                var r = buffer_exam[ix].route;
            }catch(err) {
                console.log(err.message);
                console.log('reading route from index=<'+ix+'>');
                continue;
            }
            var route = buffer_exam[ix].route;
            var index = buffer_exam[ix].index;
            var classCommand = buffer_exam[ix].classCommand;
            if (route.indexOf(devId) < 0) {
                continue;
            }
            if (route.indexOf('['+devId+',1]') >= 0 ||    //incoming
                route.indexOf(','+devId+',1]') >= 0 ||    //incoming
                route.indexOf('[1,'+devId+']') >= 0 ||  //outgoing
                route.indexOf('[1,'+devId+',') >= 0) {  //outgoing
                if (buffer_exam[ix].updateTime.indexOf('delivered=false') >= 0) {
                    continue;
                }
                if (buffer_exam[ix].hasOwnProperty('identicalEntry')) {
                    var num = buffer_exam[ix].identicalEntry.replace(/ .*/, '')*1;
                    if (num > 0) {
                        continue;
                    }
                }

                //get rssi value
                var val = arr_ix.rssi;
                if (typeof val !== 'string') {
                    val = arr_ix.rssi[0];
                }
                if (val === '' || val.indexOf('not') >= 0) {
                    val = null;
                } else {
                    val = val.replace(/ .*$/, '')*1;
                }
                if (isNaN(val)) {
                    console.log('devId='+devId+' <'+ix+'> val='+val+' (NaN) route='+route);
                }

                if (!devIdData) {
                    if (!devIdData) {
                        devIdData = {chartHeader: [null, null, null],
                                     values:      [[], [], []]
                        };
                    }
                    //incoming
                    devIdData.chartHeader[0] = {
                        devId:      devId,
                        devTitle:   ch_utils.buildMessage(25),
                        type:       ch_utils.buildMessage(ix_selectTexts + 1),
                        scaleTitle: 'dBm',
                        cubicInterpolationMode: 'default',
                        tension: 0,
                        spanGaps: true,            //missing values cause gaps in line
                        borderColor: '#0000FF80',   //blue
                        borderWidth: 2,
                        yticks: {suggestedMin: -80,
                                 suggestedMax: -30},
                    };
                    //outgoing
                    devIdData.chartHeader[1] = {
                        devId:      devId,
                        devTitle:   ch_utils.buildMessage(26),
                        type:       ch_utils.buildMessage(ix_selectTexts + 1),
                        scaleTitle: 'dBm',
                        cubicInterpolationMode: 'default',
                        tension: 0,
                        spanGaps: true,            //missing values cause gaps in line
                        borderColor: '#00fe00',   //green
                        borderWidth: 2,
                        yticks: {suggestedMin: -80,
                                 suggestedMax: -30},
                    };
                    //lower dbm limit
                    devIdData.chartHeader[2] = {
                        devTitle:   ch_utils.buildMessage(ix_headerTexts + 28),
                        cubicInterpolationMode: 'default',
                        tension: 0,
                        spanGaps: true,             //missing values cause no gaps in line
                        borderColor: '#FF000080',   //red
                        backgroundColor: '#FF000080',
                        borderDash: [7, 5],         //dashed
                        borderWidth: 0.5,
                    };
                    //set start point of x axis
                    devIdData.values[0].push({time: fileArr[0].updateTime_start, value: null});
                    devIdData.values[1].push({time: fileArr[0].updateTime_start, value: null});
                    devIdData.values[2].push({time: fileArr[0].updateTime_start, value: -80});
                }
                if (arr_ix.type === 'incoming') {
                    devIdData.values[0].push({time: arr_ix.updateTime, value: val, 
                                              tooltip: index+': route '+route+'\n'+classCommand});
                    devIdData.values[1].push({time: arr_ix.updateTime, value: null});
                } else
                if (arr_ix.type === 'outgoing') {
                    devIdData.values[0].push({time: arr_ix.updateTime, value: null});
                    devIdData.values[1].push({time: arr_ix.updateTime, value: val, 
                                              tooltip: index+': route '+route+'\n'+classCommand});
                }
                devIdData.values[2].push({time: arr_ix.updateTime, value: null});   //dummy
            }
        } //for arr

        //set end point of x axis
        if (devIdData) {
            devIdData.values[0].push({time: fileArr[0].updateTime_end, value: null});
            devIdData.values[1].push({time: fileArr[0].updateTime_end, value: null});
            devIdData.values[2].push({time: fileArr[0].updateTime_end, value: -80});
        }

        return;
    } //buildRSSI

    function buildDeviceData(devId) {
        function capitalize(s) {
            if (s) {
                return s.charAt(0).toUpperCase() + s.slice(1);
            } else {
                return s;
            }
        }
        devIdData = undefined;
        var devIdDataLength = 0;
        if (!devIdSelected) {
            return;
        }
        var arr, arr_ix, ylabels;
        eval('arr = '+fileArr[0].bufferexam);

        var buffer_exam = eval(fileArr[0].bufferexam);
        for (var ix = 0; ix < arr.length; ix++) {
            arr_ix = arr[ix];
            if (arr_ix[devId]) {
                if (!arr_ix.value) {
                    continue;
                }
                try {
                    var r = buffer_exam[ix].route;
                }catch(err) {
                    console.log(err.message);
                    console.log('reading route from index=<'+ix+'>');
                    continue;
                }
                if (arr_ix.classCommand.indexOf('Notification Report') >= 0) {
                    if (arr_ix.value.indexOf('open') < 0 &&
                        arr_ix.value.indexOf('closed') < 0 &&
                        arr_ix.value.indexOf('Open') < 0 &&
                        arr_ix.value.indexOf('Closed') < 0
                    )  {
                        continue;
                    }
                }

                if (buffer_exam[ix].updateTime.indexOf('delivered=false') >= 0) {
                    //console.log('devId='+devId+' <'+ix+'> delivered=false route='+route);
                    continue;
                }
                if (buffer_exam[ix].hasOwnProperty('identicalEntry')) {
                    var num = buffer_exam[ix].identicalEntry.replace(/ .*/, '')*1;
                    if (num > 0) {
                        //console.log('devId='+devId+' <'+ix+'> identicalEntry='+num+' route='+route);
                        continue;
                    }
                }
                //console.log(buffer_exam[ix].index+' route='+route+' '+arr_ix.type);

                var route = buffer_exam[ix].route;
                var index = buffer_exam[ix].index;

                if (arr_ix.classCommand.indexOf('Report') >= 0 ||
                    arr_ix.classCommand.indexOf('Set') >= 0) {
                    var type, scale, steppedLine = false;
                    var val = arr_ix.value;
                    if (typeof val === 'string') {
                        val = val.replace(/, data:.*$/, '');
                    }
                    if (typeof val === 'number') {
                        val = val;
                    } else
                     if (val === 'on') {
                         if (arr_ix.classCommand.indexOf('Multilevel') >= 0) {
                             val = 99;
                         }
                        steppedLine = true;
                    } else
                    if (val === 'off') {
                         if (arr_ix.classCommand.indexOf('Multilevel') >= 0) {
                             val = 0;
                         }
                        steppedLine = true;
                    } else
                    if (val.indexOf('open') > 0 || val.indexOf('Open') > 0) {
                        val = 'on';
                        //val = 99;
                        steppedLine = true;
                    } else
                    if (val.indexOf('closed') > 0 || val.indexOf('Closed') > 0) {
                        val = 'off';
                        //val = 0;
                        steppedLine = true;
                    } else {
                        //"electric meter 28.44kWh, data: [50,2,33,68,0,0,11,28,0,0]"
                        if (val.indexOf(' ') > 0) {
                            val = val.replace(/, data:.*$/, '');
                            val = val.replace(/% = .*$/, '%');  //255% = low warning
                            type = val.replace(/ [^ ]*$/, '');
                            val = val.replace(/^.* /, '');
                        }
                        scale = val.replace(/^.*[0-9]/, '');
                        val = val.replace(/[^0-9]*$/, '');
                        if (arr_ix.classCommand.indexOf('Binary') >= 0 && val === '255') {
                            val = 0.5;  //low, but > 0%
                        }
                        if (! val || isNaN(val)) {
                            continue;
                        }
                    }
                    if (arr_ix.classCommand.indexOf('Switch') >= 0 ||
                        arr_ix.classCommand.indexOf('Binary') >= 0 ||
                        arr_ix.classCommand.indexOf('Battery') >= 0) {
                        steppedLine = true;
                    }

                    if (!devIdData) {
                        devIdData = {chartHeader: [null, null],
                                     values:      [[], []]
                        };
                    }
                    if (devIdData.chartHeader[0] === null &&
                        arr_ix.classCommand.indexOf('Report') >= 0) {
                        devIdData.chartHeader[0] = {
                            devId:      devId,
                            devTitle:   arr_ix[devId]+' (Report)',
                            type:       capitalize(type),
                            scaleTitle: scale,
                            cubicInterpolationMode: 'monotone',
                            steppedLine: steppedLine,
                            spanGaps: true,    //missing values cause gaps in line
                            borderColor: '#0000FF60',   //'rgb(54, 162, 235)';
                            yticks: {},
                        };
                    } else
                    if (devIdData.chartHeader[1] === null &&
                        arr_ix.classCommand.indexOf('Set') >= 0) {
                        devIdData.chartHeader[1] = {
                            devId:      devId,
                            devTitle:   arr_ix[devId]+' (Set)',
                            type:       capitalize(type),
                            scaleTitle: scale,
                            cubicInterpolationMode: 'monotone',
                            steppedLine: steppedLine,
                            spanGaps: true,    //missing values cause gaps in line
                            borderColor: '#FF000060',   //'rgb(255, 0, 0)';
                        };
                    }
                    //set start point of x axis
                    if (!devIdData) {
                        devIdData.values[0].push({time: fileArr[0].updateTime_start, value: null});
                        devIdData.values[1].push({time: fileArr[0].updateTime_start, value: null});
                    }

                    if (arr_ix.classCommand.indexOf('Report') >= 0) {
                        devIdData.values[0].push({time:  arr_ix.updateTime.replace(/=.*$/, ''),
                                            value: val, tooltip: index+': route '+route});
                        devIdData.values[1].push({time:  arr_ix.updateTime.replace(/=.*$/, ''),
                                            value: null});  //dummy
                        devIdDataLength++;
                    } else
                    if (arr_ix.classCommand.indexOf('Set') >= 0) {
                        devIdData.values[0].push({time:  arr_ix.updateTime.replace(/=.*$/, ''),
                                            value: null});  //dummy
                        devIdData.values[1].push({time:  arr_ix.updateTime.replace(/=.*$/, ''),
                                            value: val, tooltip: index+': route '+route});
                        devIdDataLength++;
                    }

                    if (!ylabels) {
                        var on_off_labels =  ['','on','' , 'off',''];
                        //var open_closed_labels =  ['','open','' , 'closed',''];
                        ylabels = on_off_labels.indexOf(val) > 0 ? on_off_labels : ylabels;
                        //ylabels = open_closed_labels.indexOf(val) > 0 ? open_closed_labels : ylabels;
                    }
                    if (devIdData.chartHeader[0] && !devIdData.chartHeader[0].ylabels) {
                        devIdData.chartHeader[0].ylabels = ylabels;
                    }
                    if (devIdData.chartHeader[1] && !devIdData.chartHeader[1].ylabels) {
                        devIdData.chartHeader[1].ylabels = ylabels;
                    }
                }
            }
        } //for ix

        //set end point of x axis
        if (devIdData) {
            devIdData.values[0].push({time: fileArr[0].updateTime_end, value: null});
            devIdData.values[1].push({time: fileArr[0].updateTime_end, value: null});
        }

        //remove buffer of second line, it not used
        if (devIdData && devIdData.chartHeader[1] === null) {
            devIdData.chartHeader.pop();
            devIdData.values.pop();
        }

        return devIdDataLength;
    } //buildDeviceData

    function drawDeviceData(devIdData, devId) {
        //alert(JSON.stringify(devIdData));

        var chartData = {
            labels: [],
            datasets: []
        };
        var l;  //label string
        moment.locale(lang);
        Chart.defaults.global.defaultFontSize = 16;

        //prepare header data:
        devIdData.chartHeader.forEach( function (line, ix) {
            if (line) {
                var item = {
                        label: line.devTitle,
                        fill: false,
                        borderWidth: 4,
                        pointStyle: 'rectRot', //'dash', //'cross',
                        pointBorderWidth: 0,
                        pointRadius: line.pointRadius || 3,
                        pointHoverRadius: 10,
                        pointHitRadius: 10,
                        spanGaps: line.spanGaps,
                        data: [],
                        tooltips: [],
                        steppedLine: line.steppedLine,
                        tension: line.tension,
                        borderDash: line.borderDash,
                        borderColor: line.borderColor,
                        backgroundColor: line.backgroundColor,
                        pointBackgroundColor: line.pointBackgroundColor,
                    };
                chartData.datasets.push(item);
    
                //set y axes label in chart config:
                if (ix === 0) {
                    var t = line.type;
                    l = t ? t : undefined;
                    var s = line.scaleTitle;
                    l = s ? (l ? l+' ('+s+')' : s) : l;
                    if (l) {
                        config.options.scales.yAxes[0].scaleLabel = {display: true,
                                                                     labelString: l};
                    } else {
                        config.options.scales.yAxes[0].scaleLabel = {display: false};
                    }
                    if (line.ylabels) {
                        config.options.scales.yAxes[0].type = 'category';
                        config.options.scales.yAxes[0].labels = line.ylabels;
                    } else {
                        config.options.scales.yAxes[0].type = undefined;
                        config.options.scales.yAxes[0].labels = undefined;
                    }
                }
            }
        });
        //alert(JSON.stringify(chartData));

        //prepare chart values:
        devIdData.values.forEach( function (line, ix) {
            line.forEach(function(item) {
                chartData.labels.push(item.time*1000);
                chartData.datasets[ix].data.push(item.value);
                chartData.datasets[ix].tooltips.push(item.tooltip);
            });
        });

        config.data = chartData;
        //alert(JSON.stringify(config.data));

        //config y axis
        config.options.scales.yAxes[0].ticks = devIdData.chartHeader[0].yticks;
        if (devIdSelected === 'RS') {
            config.options.scales.yAxes[0].scaleLabel.labelString =
                 messageFormats[ix_headerTexts + 26][lang]+
                ' <---------              '+l+'              ----------> '+
                 messageFormats[ix_headerTexts + 27][lang];
        } else if (devIdSelected === 'DR') {
            config.options.scales.yAxes[0].scaleLabel.labelString =
                 messageFormats[ix_headerTexts + 26][lang]+
                ' <---------              '+l+'              ----------> '+
                 messageFormats[ix_headerTexts + 27][lang];
        }

        //draw chart
        ch_utils.buttonVisible('json-renderer', false);
        ch_utils.buttonVisible('canvas', true);
        var ctx = $("#canvas")[0].getContext('2d');
        if (window.myLine) {
            window.myLine.destroy();
        }
        window.myLine = new Chart(ctx, config);
    } //drawDeviceData

    function printHTML(dataBuffer, messNo, messAdd) {
        boxVisible('canvas', false);
        ch_utils.buttonVisible("toLeftRight", false);
        boxVisible('json-renderer', true);
        ch_utils.displayMessage(messNo, messAdd);
        document.getElementById('json-renderer').innerHTML = dataBuffer;
        el = document.getElementById('indextable');
        sorttable.makeSortable(el);
        scrollUp(true);
    } //printHTML

    el = document.getElementById("checkboxRegex");
    if (el) {
        $('#checkboxRegex').change(toggleUseRegex);
    }
    function toggleUseRegex() {
        var el = document.getElementById("checkboxRegex");
        if (!el) {
            useRegex = false;
        } else {
            useRegex = el.checked;
        }
    } //toggleUseRegex

    el = document.getElementById("checkboxInvert");
    if (el) {
        $('#checkboxInvert').change(toggleInvertFilter);
    }
    function toggleInvertFilter() {
        var el = document.getElementById("checkboxInvert");
        if (!el) {
            invertFilter = false;
        } else {
            invertFilter = el.checked;
        }
    } //toggleInvertFilter

    function setRefreshInterval(set) {
        if (set) {
            //set interval
            if (!IntervalId) {
                IntervalId = setInterval(updateChart, 1 * 20 *1000); //3 times a minute
            }
            updateChart(true);
        } else {
            //remove interval
            if (IntervalId) {
                clearInterval(IntervalId);
                IntervalId = undefined;
            }
        }
    } //setRefreshInterval

    function updateChart() {
        if (!isPageHidden()) {
            getData(0);
        } else {
            //reset refreshing
            doRefresh = false;
            setRefreshInterval(doRefresh);
            var el = document.getElementById("refreshCheckbox");
            if (el) {
                el.checked = doRefresh;
            }
        }
    } //updateChart

    function isPageHidden(){
        return document.hidden || document.msHidden || document.webkitHidden || document.mozHidden;
    } //isPageHidden

    document.getElementById('selDevice').addEventListener('click', function() {
        var devIdSelectedOld = devIdSelected;
        devIdSelected = this.value;
        if (devIdSelected === '') {
            devIdSelected = undefined;
        } else {
            if (devIdSelected !== devIdSelectedOld) {
                document.getElementById('graphDevice').click();
            }
        }
    }, true);

    document.getElementById('selNodeId').addEventListener('click', function() {
        ch_utils.buttonVisible("toLeftRight", false);
        devNodeIdSelected = this.value;
        if (devNodeIdSelected === '') {
            devNodeIdSelected = undefined;
            devIdSelected = undefined;
        }
        buildSelectBoxDevId(devNodeIdSelected);
        if (['zway_originPacketsjson',
             'zway_parsedPacketsjson',
             'showRange',
             'statisticsPerHourNode',
             'statisticsPerCommandNode'].indexOf(currentPage) >= 0) {
            document.getElementById(currentPage).click();
        }
    }, true);
}); //$(document).ready

function buildSelectBoxNodeId () {
    ch_utils.buttonVisible("toLeftRight", false);
    var elId;
    var i;
    var option;

    elId = document.getElementById('selNodeId');
    i = 0;
    option = new Option(ch_utils.buildMessage(8), '');
    elId.options[i++] = option;
    Object.keys(nodeArray).forEach(function(node, ix) {
        //if (node !== '1') {
            option = new Option(node+': '+nodeArray[node], node);
            elId.options[i++] = option;
        //}
    });
} //buildSelectBoxNodeId

function buildSelectBoxDevId (devNodeIdSelected) {
    var elId;
    var i;
    var option, devShort, devNode;

    elId = document.getElementById('selDevice');
    i = 0;
    option = new Option(ch_utils.buildMessage(8), '');
    elId.options.length = 0;
    elId.options[i++] = option;
    Object.keys(deviceIDArray).forEach(function(device, ix) {
        if (device) {
            devShort = device.replace(vDevIdPre,'');
            devNode  = devShort.replace(/-.*$/, '');
            if (!devNodeIdSelected || devNodeIdSelected === devNode) {
                option = new Option(devShort+': '+deviceIDArray[device], device);
                elId.options[i++] = option;
            }
        }
    });
    if (devNodeIdSelected) {
        //data rates:
        option = new Option(ch_utils.buildMessage(ix_selectTexts), 'DR');
        elId.options[i++] = option;
        //rssi:
        option = new Option(ch_utils.buildMessage(ix_selectTexts+1), 'RS');
        elId.options[i++] = option;
        //outgoing:
        option = new Option(ch_utils.buildMessage(ix_selectTexts+2), 'outgoing');
        elId.options[i++] = option;
        //incoming:
        option = new Option(ch_utils.buildMessage(ix_selectTexts+3), 'incoming');
        elId.options[i++] = option;
    }
} //buildSelectBoxDevId

//------------- common functions ----------------------------------------

//converts time string into unix time
function toTimestamp (timestring) {     //timestring = yyyy-mm-hh hh:mm:ss
    return new Date(timestring).getTime()/1000;
}

function printJSON (objectJSON, text_id, par1, par2, par3, par4, par5, par6) {
    boxVisible('canvas', false);
    ch_utils.buttonVisible("toLeftRight", false);
    boxVisible('json-renderer', true);
    par1 = String(par1);
    par2 = String(par2);
    par3 = String(par3);
    par4 = String(par4);
    par5 = String(par5);
    par6 = String(par6);

    ch_utils.displayMessage(text_id, par1, par2, par3, par4, par5, par6);
    var objectPrint = objectJSON;

    $('#json-renderer').jsonViewer(objectPrint, {
        collapsed: false,
        withQuotes: true,
        withLinks: true,
        clickable: clickMark,
        styleTag: styleMark
    });
} //printJSON

function boxVisible(button_id, isVisible) {
    if (isVisible) {
        $("#"+button_id).show();
    } else {
        $("#"+button_id).hide();
    }
} //buttonVisible

function drawChart(node, device, route, packetType) {
    //change current node according to route:
    if (device === 'rssi' && route) {
        var routeArr = route.replace('[', '').replace(']', '').split(',');
        if (packetType.indexOf('delivered') >=0) {
            node = routeArr[1];
        } else {
            node = routeArr[routeArr.length-2];
        }
    }
    $('#selNodeId').val(node+'');
    $("#selNodeId").click();
    buildSelectBoxDevId (node+'');

    var selDevice = device;
    if (selDevice === 'rssi') {
        selDevice = 'RS';
    } else
    if (selDevice === 'speed') {
        selDevice = 'DR';
    } else
    if (selDevice === 'route') {
        if (route.indexOf('['+node) === 0) {
            selDevice = 'incoming';
        } else {
            selDevice = 'outgoing';
        }
    }
    $('#selDevice').val(selDevice);
    $("#selDevice").click();
    $("#graphDevice").click();
} //drawChart
