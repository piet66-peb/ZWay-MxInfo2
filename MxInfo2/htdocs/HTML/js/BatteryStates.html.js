//h-------------------------------------------------------------------------------
//h
//h Name:         BatteryStates.html.js
//h Type:         Javascript module
//h Purpose:      Display battery level including history per device
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.9 2025-03-12/peb
//v History:      V1.0 2020-06-06/peb first version
//v               V1.7 2021-02-21/peb [+]nextWakeup
//v               V1.8 2021-03-13/peb [x]lost per month
//v               V1.9 2021-07-06/peb [+]check data of no longer existing devices
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='BatteryStates.html.js';
var VERSION='V1.9';
var WRITTEN='2025-03-12/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 8;
var ix_selectTexts = 8;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Batterie Ladezustände',
        en: 'Battery Charge States'
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
        de: '<b>Batterie Ladezustände:</b>',
        en: '<b>Battery Charge States:</b>'
    },
    {
        de: '<b>niedrig</b>',
        en: '<b>low</b>'
    },
    {//6
        de: 'Filter...',
        en: 'Filter...',
    },

    //button texts (8+...):
    //select texts (8+...):
    {//6
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
    {
        de: 'Uhrzeit<br>Batterie<br>*=Erstmeldung',
        en: 'Timestamp<br>Battery<br>*=first report'
    },
    {
        de: 'Ladung',
        en: 'Charge'
    },
    {
        de: 'Timestamp',
        en: 'Timestamp'
    },
    {
        de: 'Verlust/<br>Monat',
        en: 'Lost/<br>Month'
    },
    {
        de: 'Wakeup<br>Stunden => um',
        en: 'Wakeup<br>hours => at'
    },
    {
        de: 'Letzter<br>Empfang',
        en: 'Last<br>Received'
    },
    {
        de: 'Verlust',
        en: 'Lost'
    },
];

var devicesConfig;
var devicesArray;
var manufacturerArray;
var modificationTimes = {};

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
        function success(data) {
            processConfig(data.devices);
        }
    } //getDeviceList

    function getModificationTime(node, doHTML) {
        var url = '/ZAutomation/api/v1/devices/ZWayVDev_zway_'+node+'-0-128/metrics/modificationTime';
        ch_utils.ajax_get(url, success, fail, no_data);
        function success(data) {
            modificationTimes[node] = data.data;
            buildHTML(doHTML);
        }
        function fail() {
            buildHTML(doHTML);
        }
        function no_data() {
            buildHTML(doHTML);
        }
    } //getModificationTime

    function processConfig(devices) {
        ch_utils.displayMessage(4);

        devicesConfig = {};
        devicesArray = {};
        manufacturerArray = {};

        //all nodes
        var nodeNumbers = Object.keys(devices);

        //filter batteries
        function checkRealBattery(device) {
            if (device > 1) {
                if (devices[device].instances["0"].commandClasses["128"]) {
                    if (!devices[device].data.isListening.value) {
                        return device;
                    }
                }
            }
        }
        nodeNumbers = nodeNumbers.filter(checkRealBattery);

        //request last modification times for all batteries
        nodeNumbers.forEach(function(device, ix) {
            getModificationTime(device, ix === nodeNumbers.length-1);
        });

        //store device infos for all batteries
        nodeNumbers.forEach(function(device, ix) {
            devicesConfig[device] = devices[device].instances["0"].commandClasses["128"]
                                    .data.history;

            var lastChange = devices[device].instances["0"].commandClasses["128"].
                                    data.lastChange.value;

            var givenName = devices[device].data.givenName.value;
            var manufacturerId = devices[device].data.manufacturerId.value || 0;
            var vendorString = devices[device].data.vendorString.value;
            var lastReceived = devices[device].data.lastReceived.updateTime;
            var wakeupInterval, nextWakeup;
            if (devices[device].instances["0"].commandClasses["132"]) {
                var interval = devices[device].instances["0"].commandClasses["132"]
                                    .data.interval.value;
                wakeupInterval = Math.round(interval/3600*10)/10;
                if (interval > 0) {
                    var lastSleep = devices[device].instances["0"].commandClasses["132"]
                                    .data.lastSleep.value;
                    var lastWakeup = devices[device].instances["0"].commandClasses["132"]
                                    .data.lastWakeup.value;
                    nextWakeup = Math.max(lastWakeup, lastSleep) + interval;
                    nextWakeup = nextTime(nextWakeup);
                }
            }

            var item = {givenName: givenName,
                        manufacturerId: manufacturerId,
                        vendorString: vendorString,
                        wakeupInterval: wakeupInterval,
                        lastReceived: lastReceived,
                        lastChange: lastChange
                       };
            if (nextWakeup) {
                item.wakeupInterval = item.wakeupInterval+nextWakeup;
            }
            devicesArray[device] = item;

            if (!manufacturerArray[manufacturerId] || vendorString) {
                manufacturerArray[manufacturerId] = vendorString;
            }
        });
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

    function buildHTML(doHTML) {
        if (!doHTML) {return;}

        ch_utils.buttonVisible('json-renderer', true);
        ch_utils.displayMessage(5);

        function nextLine(color, col1, col2, col3, col4, col5, col6, col7, col8, col9, col10, col11) {
            var c1 = "<font color='"+color+"'>";
            var c2 = "<\/font>";
            var cx1 = c1, cx2 = c2;
            var html = '';
            html += '<tr>';
            html += '<td headers="node" align=center>'+c1+col1+c2+'</td>';
            html += '<td headers="name" align=left>'+c1+view(col2)+c2+'</td>';
            html += '<td headers="manufacturer" align=center>'+c1+view(col3)+c2+'</td>';
            html += '<td headers="name" align=left>'+c1+view(col4)+c2+'</td>';
            html += '<td headers="wakeup" align=center>'+c1+view(col5)+c2+'</td>';
            html += '<td headers="lastReceived" align=center>'+c1+view(col6)+c2+'</td>';
            html += '<td headers="date" align=right>'+c1+view(col8)+c2+'</td>';
            if (col9 <= 35) {
                cx1 = "<b><font color='red'>";
                cx2 = "<\/font><\/b>";
            } else
            if (col9 <= 50) {
                cx1 = "<b><font color='blue'>";
                cx2 = "<\/font><\/b>";
            } else
            if (col9 === '100' && color === 'black') {
                cx1 = "<b><font color='green'>";
                cx2 = "<\/font><\/b>";
            }
            if (col9 === '0') {
                html += '<td headers="level" align=center>'+cx1+ch_utils.buildMessage(6)+cx2+'</td>';
            } else {
                html += '<td headers="level" align=center>'+cx1+view(col9)+(view(col9) === '' ? '' : '%')+cx2+'</td>';
            }

            var c3 = setCol(col11);
            html += '<td headers="lost" align=center>'+c1+view(col11)+(col11 === '' ? '' : '%')+c2+'</td>';
            c3 = setCol(col10);
            html += '<td headers="lostM" align=center>'+c1+view(col10)+(col10 === '' ? '' : '%')+c2+'</td>';
            html += '<td headers="color" align=center bgcolor='+c3+'>&nbsp;</td>';
            html += '</tr>\n';
            return html;
        } //nextLine

        var html = '';
        html +=  '<table id="indextable">';
        html += '<thead><tr>';
        html += '<th id="node">'+ch_utils.buildMessage(ix_selectTexts+0)+'</th>';
        html += '<th id="name">'+ch_utils.buildMessage(ix_selectTexts+1)+'</th>';
        html += '<th id="manufacturer">'+ch_utils.buildMessage(ix_selectTexts+2)+'</th>';
        html += '<th id="name">'+ch_utils.buildMessage(ix_selectTexts+3)+'</th>';
        html += '<th id="wakeup">'+ch_utils.buildMessage(ix_selectTexts+8)+'</th>';
        html += '<th id="lastReceived">'+ch_utils.buildMessage(ix_selectTexts+9)+'</th>';
        html += '<th id="date">'+ch_utils.buildMessage(ix_selectTexts+4)+'</th>';
        html += '<th id="level">'+ch_utils.buildMessage(ix_selectTexts+5)+'</th>';
        html += '<th id="lost">'+ch_utils.buildMessage(ix_selectTexts+10)+'</th>';
        html += '<th id="lostM">'+ch_utils.buildMessage(ix_selectTexts+7)+'</th>';
        html += '<th id="color" align=center>&nbsp;</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        var a;
        Object.keys(devicesConfig).forEach(function(device, i1) {
            if (device && ! isNaN(device)) {
                a = [];
                Object.keys(devicesConfig[device]).forEach(function(level, i2) {
                    if (level && ! isNaN(level)) {
                        a.push(['black',
                                //1 device num:
                                device,
                                //2 device name
                                devicesArray[device].givenName,
                                //3 manufacture num:
                                devicesArray[device].manufacturerId,
                                //4 manufacturer name
                                manufacturerArray[devicesArray[device].manufacturerId],
                                //5 wakeup interval:
                                devicesArray[device].wakeupInterval,
                                //6 time last received:
                                ch_utils.userTime(devicesArray[device].lastReceived, true),
                                //7 battery update time:
                                devicesConfig[device][level].updateTime,
                                //8 battery update user time:
                                ch_utils.userTime(devicesConfig[device][level].updateTime, true),
                                //9 battery level:
                                level,
                                //10 lost per month
                                ''
                               ]);
                    }
                }); //battery level
                //alert(JSON.stringify(a));
                if (a.length === 0) {
                    console.log('no battery history for device #'+device);
                    //alert('no battery history for device #'+device);
                    a.push(['black',
                                //1 device num:
                                device,
                                //2 device name
                                devicesArray[device].givenName,
                                //3 manufacture num:
                                devicesArray[device].manufacturerId,
                                //4 manufacturer name
                                manufacturerArray[devicesArray[device].manufacturerId],
                                //5 wakeup interval:
                                '',
                                //6 time last received:
                                '',
                    ]);
                    html += nextLine('red', a[0][1], a[0][2], a[0][3], a[0][4], a[0][5], a[0][6], 
                                     '', '', '', '', '');
                } //a.length === 0
                else {
                    //sort by timestamp descendent
                    a.sort(function(a, b){return b[7]-a[7];});
    
                    //compute level difference for device
                    var len = a.length;
                    var i, lost, lostM;
                    var secsPerMonth = 30*24*60*60;
                    for (i = len - 1; i >= 0; i--) {
                        if (i === 0) {
                            //exchange timestamp by last modificationTime:
                            var modTimeLast = modificationTimes[device];
                            if (modTimeLast && modTimeLast !== a[0][7]) {
                                var modTimeLastUser = ch_utils.userTime(modTimeLast);
                                //console.log('#### '+device+': '+a[0][8]+' >> '+modTimeLastUser);
                                a[0][7] = modTimeLast;
                                a[0][8] += '<br>*'+ch_utils.userTime(modTimeLast);
                                //a[0][8] += '<br>!'+ch_utils.userTime(devicesArray[device].lastChange);
                            }
                        }
                        if (i === len - 1) {
                            a[i].push('');
                        } else {
                            lost = a[i+1][9] - a[i][9];
                            lostM = lost * secsPerMonth / (a[i][7]  - a[i+1][7]);
                            a[i][10] = (Math.round(lostM*10)/10);
                            console.log('#'+device+': '+
                                        'lostM='+lostM+'=('+a[i+1][9]+'-'+a[i][9]+')*'+secsPerMonth+
                                        '/('+a[i][7]+'-'+a[i+1][7]+')');
                            if (lostM <= 0) {
                                a[i][10] = '';
                            }
                            a[i][11] = (Math.round(lost*10)/10);
                        }
                    }
    
                    //build lines for device
                    html += nextLine('black', a[0][1], a[0][2], a[0][3], a[0][4], a[0][5], a[0][6], '',
                                      a[0][8], a[0][9], a[0][10], a[0][11]);
                    for (i = 1; i < len; i++) {
                        html += nextLine('grey', '', '', '', '', '', '', '',
                                      a[i][8], a[i][9], a[i][10], a[i][11]);
                    }
                } //else a.length > 0
            }
        }); //device

        html += '</tbody>';
        html += '</table>';

        document.getElementById('json-renderer').innerHTML = html;
    } //buildHTML
}); //(document).ready

//computes user readable time (=> hh24:mi)
function nextTime (updateTime) {
    try {
        var s = ' => ';
        var now = Math.floor(new Date().getTime() / 1000);
        if (now <= updateTime) {
            var tzo = new Date().getTimezoneOffset() * 60 * 1000;
            var d = new Date(updateTime*1000-tzo);
            s += d.toISOString().replace(/^.*T/, '').replace(/:[^:]*$/, '');
        } else {
            s = "<font color='red'><b>"+s+"</b></font>";
        }
        return s;
    } catch (err) {
        alert(err);
        return updateTime;
    }
} //nextTime
