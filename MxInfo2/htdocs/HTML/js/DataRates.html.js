//h-------------------------------------------------------------------------------
//h
//h Name:         DataRates.html.js
//h Type:         Javascript module
//h Purpose:      Display used data rates per device.
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.1 2022-11-10/peb
//v History:      V1.0 2020-11-04/peb first version
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals cytoscape, sorttable, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='DataRates.html.js';
var VERSION='V1.1';
var WRITTEN='2022-11-10/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 10;
var ix_selectTexts = 10;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Z-Wave Datenraten',
        en: 'Z-Wave Data Rates'
    },
    {
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {
        de: 'Hallo {0}, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo {0}, sorry, you have no administrator rights to read the data!'
    },
    {
        de: 'Konfiguration wird gelesen...',
        en: 'Reading configuration...'
    },
    {
        de: 'Konfiguration wird verarbeitet...',
        en: 'Treating configuration...'
    },
    {
        de: '<b>Z-Wave Datenraten von erfolgreich ausgelieferten Paketen:</b>'+
            '<br>9.6 kbit/s, 40 kbit/s ab 300er Serie, 100 kbit/s ab 500er Serie<br>',
        en: '<b>Z-Wave Data Rates for successfully delivered packets:</b>'+
            '<br>9.6 kbps, 40 kbps since 300 series, 100 kbps since 500 series<br>',
    },
    {
        de: 'Z-Wave Pakete werden gelesen...',
        en: 'Reading Z-Wave packets...'
    },
    {
        de: 'Z-Wave Pakete werden verarbeitet...',
        en: 'Treating Z-Wave packets...'
    },
    {
        de: 'Bitte warten...',
        en: 'Please wait...'
    },

    {//6
        de: 'Filter...',
        en: 'Filter...',
    },

    //button texts (10+...):
    //select texts (10+...):
    {
        de: 'Ziel<br>gerät',
        en: 'Target<br>Device'
    },
    {
        de: 'Name',
        en: 'Name'
    },
    {
        de: 'Hersteller',
        en: 'Manufacturer'
    },
    {
        de: 'Name',
        en: 'Name'
    },
    {
        de: 'Letzter <br> Empfang',
        en: 'Last <br> Received'
    },
    {
        de: 'Z-Wave <br> Protokoll',
        en: 'Z-Wave <br> Protocol'
    },
    {
        de: '9.6<br>kbit/s',
        en: '9.6<br>kbps'
    },
    {
        de: '40<br>kbit/s',
        en: '40<br>kbps'
    },
    {
        de: '100<br>kbit/s',
        en: '100<br>kbps'
    },
    {
        de: 'SDK',
        en: 'SDK'
    },
];

var devicesArray;
var manufacturerArray;
var speedArray;

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    ch_utils.buttonVisible('json-renderer', false);
    document.title = ch_utils.buildMessage(0);

    var filterInput = document.getElementById("myInput");
    filterInput.value = '';
    filterInput.placeholder = ch_utils.buildMessage(9);
    filterInput.focus();

    var dataReceived = 0;
    startDatacollection();
    function startDatacollection() {
        getDataRates();
        getDeviceList();
    } //startDatacollection

    function displayResult() {
        buildHTML();
    } //displayResult

    function getDeviceList() {
        ch_utils.displayMessage(3);
        var url = '/ZWaveAPI/Data/0';
        ch_utils.ajax_get(url, success);
        function success (data) {
            processConfig(data.devices);
            ++dataReceived;
            if (dataReceived >= 2) {
                displayResult();
            }
        }
    } //getDeviceList

    function getDataRates() {
        ch_utils.displayMessage(6);
        var url = '/ZWave.zway/PacketLog';
        ch_utils.ajax_get(url, success);
        function success (data) {
            processPackets(data.data);
            ++dataReceived;
            if (dataReceived >= 2) {
                displayResult();
            }
        }
    } //getDataRates

    function processPackets(data) {
        ch_utils.displayMessage(7);

        speedArray = {};
        data.forEach(function (packet, ix) {
            if (packet.hasOwnProperty('speed')) {
                if (!speedArray.hasOwnProperty(packet.nodeId)) {
                    speedArray[packet.nodeId] = [0, 0, 0];
                }
                var rateIx = ["9.6", "40", "100"].indexOf(packet.speed.replace(/ .*$/, ''));

                if(packet.hasOwnProperty('delivered')) {
                    if(packet.delivered) {
                       ++speedArray[packet.nodeId][rateIx];
                    }
                } else {
                   ++speedArray[packet.nodeId][rateIx];
                }
            }
        });
    } //processPackets

    function processConfig(devices) {
        ch_utils.displayMessage(4);

        devicesArray = {};
        manufacturerArray = {};
        Object.keys(devices).forEach(function(device, ix) {
            if (device > 1) {
                    //store device info
                    var givenName = devices[device].data.givenName.value;
                    var manufacturerId = devices[device].data.manufacturerId.value || 0;
                    var vendorString = devices[device].data.vendorString.value;
                    var lastReceived = devices[device].data.lastReceived.updateTime;
                    var ZWProtocolMajor = devices[device].data.ZWProtocolMajor.value;
                    var ZWProtocolMinor = devices[device].data.ZWProtocolMinor.value;
                    var SDK = devices[device].data.SDK.value.replace(/\.[^\.]*$/, '');

                    var item = {givenName: givenName,
                                manufacturerId: manufacturerId,
                                vendorString: vendorString,
                                lastReceived: lastReceived,
                                ZWProtocol: ZWProtocolMajor+'.'+ZWProtocolMinor,
                                SDK: SDK, //.replace(/\.[^\.]*$/, ''),
                               };
                    devicesArray[device] = item;

                    if (!manufacturerArray[manufacturerId] || vendorString) {
                        manufacturerArray[manufacturerId] = vendorString;
                    }
            }
        });
    } //processConfig

    function view(str) {
        if (str === null || str === undefined ||
            str === 'undefined' || str === 'empty') {return '';}
        if (str === 0) {return '';}
        return str;
    } //view

    function buildHTML() {
        function nextLine(col0, col1, col2, col3, col4, col5, col6, col7, col8, col9, col10) {
            var html = '';
            html += '<tr>';
            html += '<td headers="node" align=center>'+col0+'</td>';
            html += '<td headers="name" align=left>'+view(col1)+'</td>';
            html += '<td headers="manufacturer" align=center>'+view(col2)+'</td>';
            html += '<td headers="name" align=left>'+view(col3)+'</td>';
            html += '<td headers="lastReceived" align=center>'+view(col4)+'</td>';
            //html += '<td headers="ZWProtocol" align=center>'+view(col5)+'</td>';
            html += '<td headers="SDK" align=center>'+view(col5)+'</td>';
            html += '<td headers="R1" align=center>'+view(col6)+'</td>';
            html += '<td headers="R2" align=center>'+view(col7)+'</td>';
            html += '<td headers="R3" align=center>'+view(col8)+'</td>';
            html += '</tr>\n';
            return html;
        } //nextLine

        var html = '';
        html +=  '<table id="indextable" class="sortable">';
        html += '<thead><tr>';
        html += '<th id="node"> '+ch_utils.buildMessage(ix_selectTexts+0)+' </th>';
        html += '<th id="name"> '+ch_utils.buildMessage(ix_selectTexts+1)+' </th>';
        html += '<th id="manufacturer"> '+ch_utils.buildMessage(ix_selectTexts+2)+' </th>';
        html += '<th id="name"> '+ch_utils.buildMessage(ix_selectTexts+3)+' </th>';
        //html += '<th id="ZWProtocol"> '+ch_utils.buildMessage(ix_selectTexts+5)+' </th>';
        html += '<th id="SDK"> '+ch_utils.buildMessage(ix_selectTexts+9)+' </th>';
        html += '<th id="lastReceived"> '+ch_utils.buildMessage(ix_selectTexts+4)+' </th>';
        html += '<th id="R1"> '+ch_utils.buildMessage(ix_selectTexts+6)+' </th>';
        html += '<th id="R2"> '+ch_utils.buildMessage(ix_selectTexts+7)+' </th>';
        html += '<th id="R3"> '+ch_utils.buildMessage(ix_selectTexts+8)+' </th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        Object.keys(devicesArray).forEach(function(device, i1) {
            if (device && ! isNaN(device)) {
                var R1, R2, R3;
                if (speedArray[device]) {
                    R1 = speedArray[device][0] || '';
                    R2 = speedArray[device][1] || '';
                    R3 = speedArray[device][2] || '';
                }
                html += nextLine(
                                //0 device num:
                                device,
                                //1 device name
                                devicesArray[device].givenName,
                                //2 manufacture num:
                                devicesArray[device].manufacturerId,
                                //3 manufacturer name
                                manufacturerArray[devicesArray[device].manufacturerId],
                                ////4 protocol:
                                //devicesArray[device].ZWProtocol,
                                //4 SDK:
                                devicesArray[device].SDK,
                                //5 time last received:
                                ch_utils.userTime(devicesArray[device].lastReceived),
                                //6 R1:
                                R1,
                                //7 R2:
                                R2,
                                //8 R3:
                                R3
                               );
            }
        }); //device

        html += '</tbody>';
        html += '</table>';

        printHTML(html, 5);

    } //buildHTML
}); //(document).ready

function printHTML(dataBuffer, messNo) {
    ch_utils.buttonVisible('json-renderer', true);
    ch_utils.displayMessage(messNo);
    document.getElementById('json-renderer').innerHTML = dataBuffer;
    var el = document.getElementById('indextable');
    sorttable.makeSortable(el);
    scrollUp(true);
} //printHTML

function scrollUp(flag) {
    if (flag) { document.getElementById('json-renderer').scrollTop = 0; }
} //scrollUp
