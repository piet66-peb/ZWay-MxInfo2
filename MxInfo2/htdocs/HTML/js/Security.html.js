//h-------------------------------------------------------------------------------
//h
//h Name:         Security.html.js
//h Type:         Javascript module
//h Purpose:      Display security information per device
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.0.0 2023-10-13/peb
//v History:      V1.0.0 2023-07-29/peb first version
//h Copyright:    (C) piet66 2023
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Security.html.js';
var VERSION='V1.0.0';
var WRITTEN='2023-10-13/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 8;
var ix_headerTexts = 8;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Geräte Sicherheit',
        en: 'Device Security'
    },
    {
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {
        de: 'Leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: "Sorry, you don't have the bnecessary administrator rights!"
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
        de: '<b>Geräte Sicherheit:</b>',
        en: '<b>Device Security:</b>'
    },
    {
        de: 'not used',
        en: 'not used'
    },
    { //7
        de: 'Filter...',
        en: 'Filter...',
    },

    //button texts (8+...):
    //select texts (8+...):
    { //0
        de: 'Gerät',
        en: 'Device'
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
    { //4
        de: 'Node Info Frame',
        en: 'Node Info Frame'
    },
    { //5
        de: 'S0<br>supported',
        en: 'S0<br>supported'
    },
    { //5
        de: '<br>security',
        en: '<br>security'
    },
    { //6
        de: '<br>NIF',
        en: '<br>NIF'
    },
    { //7
        de: 'S2<br>supported',
        en: 'S2<br>supported'
    },
    { //7
        de: '<br>security',
        en: '<br>security'
    },
    { //8
        de: '<br>NIF',
        en: '<br>NIF'
    },
];

var devicesArray;
var manufacturerArray;

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
    filterInput.placeholder = ch_utils.buildMessage(7);
    filterInput.focus();

    getDeviceList();

    function getDeviceList() {
        ch_utils.displayMessage(3);
        var url = '/ZWaveAPI/Data/0';
        ch_utils.ajax_get(url, success);
        function success (data) {
            processConfig(data.devices);
        }
    } //getDeviceList

    function processConfig(devices) {
        ch_utils.displayMessage(4);

        devicesArray = {};
        manufacturerArray = {};
        Object.keys(devices).forEach(function(device, ix) {
            if (device > 1) {
                //security in nodeInfoFrame?
                var SECURITY = 152;
                var SECURITY2 = 159;

                //device data:
                var nif_security;
                var nif = devices[device].data.nodeInfoFrame.value;
                if (nif.includes(SECURITY) && nif.includes(SECURITY2)) {
                    nif_security = 'S0 + S2';
                }else
                if (nif.includes(SECURITY)) {
                    nif_security = 'S0';
                }else
                if (nif.includes(SECURITY2)) {
                    nif_security = 'S2';
                }

                var givenName = devices[device].data.givenName.value;
                var manufacturerId = devices[device].data.manufacturerId.value || 0;
                var vendorString = devices[device].data.vendorString.value;
                var item = {givenName: givenName,
                            manufacturerId: manufacturerId,
                            vendorString: vendorString,
                            nif_security: nif_security
                           };

                //security classes:
                if (devices[device].instances["0"].commandClasses[SECURITY]) {
                    item.configS0 = devices[device].instances["0"].commandClasses[SECURITY].data;
                }
                if (devices[device].instances["0"].commandClasses[SECURITY2]) {
                    item.configS2 = devices[device].instances["0"].commandClasses[SECURITY2].data;
                }
                if (item.nif_security || item.configS0 || item.configS2) {
                    devicesArray[device] = item;
                    if (!manufacturerArray[manufacturerId] || vendorString) {
                        manufacturerArray[manufacturerId] = vendorString;
                    }
                }
            }
        });

        ch_utils.buttonVisible('json-renderer', true);
        ch_utils.displayMessage(5);
        buildHTML();
    } //processConfig

    function view(str) {
        if (str === null || str === undefined ||
            str === 'undefined' || str === 'empty') {return '';}
        return str;
    } //view

    function setCol(col) {
        var color = 'Red';
        var steps = [3, 10, 20];
        var colors  = ['GreenYellow', 'Yellow', 'Orangered'];
        for (var i = 0; i < 11; i++) {
            if (col*1 <= steps[i]) {
                color = colors[i];
                break;
            }
        }
        return color;
    } //setCol

    function buildCheckbox(val) {
        var str;
        switch(val) {
            case true:
                str = '<input type="checkbox" checked disabled>';
                break;
            case false:
                str = '<input type="checkbox" disabled>';
                break;
            default:
                str = val;
                break;
        }
        return str;
    } //buildCheckbox

    function buildHTML() {
        function nextLine(a) {
            var c1 = "<font color='"+a[0]+"'>";
            var c2 = "<\/font>";
            var cx1 = c1, cx2 = c2;
            var html = '';
            html += '<tr>';
            html += '<td headers="node" align=center>'+c1+a[1]+c2+'</td>';
            html += '<td headers="name" align=left>'+c1+view(a[2])+c2+'</td>';
            html += '<td headers="manufacturer" align=center>'+c1+view(a[3])+c2+'</td>';
            html += '<td headers="name" align=left>'+c1+view(a[4])+c2+'</td>';
            html += '<td headers="nif" align=center>'+c1+view(a[5])+c2+'</td>';
            html += '<td headers="securityS0_supported" align=center>'+c1+buildCheckbox(a[6])+c2+'</td>';
            html += '<td headers="securityS0_security" align=center>'+c1+buildCheckbox(a[7])+c2+'</td>';
            html += '<td headers="securityS0_nif" align=center>'+c1+view(a[8])+c2+'</td>';
            html += '<td headers="securityS2_supported" align=center>'+c1+buildCheckbox(a[9])+c2+'</td>';
            html += '<td headers="securityS2_security" align=center>'+c1+buildCheckbox(a[10])+c2+'</td>';
            html += '<td headers="securityS2_nif" align=center>'+c1+view(a[11])+c2+'</td>';
            html += '</tr>\n';
            return html;
        } //nextLine

        var html = '';
        html +=  '<table id="indextable">';
        html += '<thead><tr>';
        html += '<th id="node">'+ch_utils.buildMessage(ix_headerTexts+0)+'</th>';
        html += '<th id="name">'+ch_utils.buildMessage(ix_headerTexts+1)+'</th>';
        html += '<th id="manufacturer">'+ch_utils.buildMessage(ix_headerTexts+2)+'</th>';
        html += '<th id="name">'+ch_utils.buildMessage(ix_headerTexts+3)+'</th>';
        html += '<th id="nif">'+ch_utils.buildMessage(ix_headerTexts+4)+'</th>';
        html += '<th id="securityS0_supported">'+ch_utils.buildMessage(ix_headerTexts+5)+'</th>';
        html += '<th id="securityS0_security">'+ch_utils.buildMessage(ix_headerTexts+6)+'</th>';
        html += '<th id="securityS0_nif">'+ch_utils.buildMessage(ix_headerTexts+7)+'</th>';
        html += '<th id="securityS2_supported">'+ch_utils.buildMessage(ix_headerTexts+8)+'</th>';
        html += '<th id="securityS2_security">'+ch_utils.buildMessage(ix_headerTexts+9)+'</th>';
        html += '<th id="securityS2_nif">'+ch_utils.buildMessage(ix_headerTexts+10)+'</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';
        var len;
        Object.keys(devicesArray).forEach(function(device, i1) {
            if (device > 1) {
                var configS0 = devicesArray[device].configS0;
                var configS2 = devicesArray[device].configS2;
                var a = [//0 color:
                         'black',
                         //1 device num:
                         device,
                         //2 device name
                         devicesArray[device].givenName,
                         //3 manufacture number:
                         devicesArray[device].manufacturerId,
                         //4 manufacturer name
                         manufacturerArray[devicesArray[device].manufacturerId],
                         //6 nif:
                         devicesArray[device].nif_security
                ];

                if (configS0) {
                    //8 securityS0:
                    a.push(configS0.supported.value);
                    a.push(configS0.security.value);
                    len = configS0.secureNodeInfoFrame.value.length;
                    if (len > 0) {
                        a.push(len+' entries');
                    } else {
                        a.push('none');
                    }
                } else
                if (devicesArray[device].nif_security &&
                    devicesArray[device].nif_security.indexOf('S0') >= 0) {
                    a.push('--');
                    a.push('--');
                    a.push('--');
                } else {
                    a.push('');
                    a.push('');
                    a.push('');
                }

                if (configS2) {
                    //9 securityS2:
                    a.push(configS2.supported.value);
                    a.push(configS2.security.value);
                    len = configS2.secureNodeInfoFrame.value.length;
                    if (len > 0) {
                        a.push(len+' entries');
                    } else {
                        a.push('none');
                    }
                } else
                if (devicesArray[device].nif_security &&
                    devicesArray[device].nif_security.indexOf('S2') >= 0) {
                    a.push('--');
                    a.push('--');
                    a.push('--');
                } else {
                    a.push('');
                    a.push('');
                    a.push('');
                }
                console.log(JSON.stringify(a));
                html += nextLine(a);
            }
        }); //device

        html += '</tbody>';
        html += '</table>';

        document.getElementById('json-renderer').innerHTML = html;
    } //buildHTML
}); //(document).ready
