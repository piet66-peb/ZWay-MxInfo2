//h-------------------------------------------------------------------------------
//h
//h Name:         Devices.html.js
//h Type:         Javascript module
//h Purpose:      Display devices list.
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.0 2024-05-22/peb
//v History:      V1.0 2022-04-16/peb first version
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals sorttable, ch_utils, myFunction */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Devices.html.js';
var VERSION='V1.0';
var WRITTEN='2024-05-22/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 7;
var ix_selectTexts = 7;
var messageFormats = [
    //message texts (0+...):
    {//0
        de: 'Geräte',
        en: 'Devices'
    },
    {//1
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {//2
        de: 'Leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Sorry, you have no administrator rights to read the data!'
    },
    {//3
        de: 'Gerätedaten werden angefordert...',
        en: 'Requesting device data...'
    },
    {//4
        de: 'Gerätedaten werden verarbeitet...',
        en: 'Processing of device data...'
    },
    {//5
        de: '<b>Geräte:</b>',
        en: '<b>Devices:</b>'
    },
    {//6
        de: 'Filter...',
        en: 'Filter...',
    },

    //button texts (7+...):
    //select texts (7+...):
    {
        de: 'Gerät',
        en: 'Device'
    },
    {
        de: 'Titel',
        en: 'Title'
    },
    {
        de: 'Inst',
        en: 'Inst'
    },
    {
        de: 'Änderungszeit',
        en: 'Update Time'
    },
    {//4
        de: 'level',
        en: 'level'
    },
    {
        de: 'hidden',
        en: 'hidden'
    },
    {
        de: 'visible',
        en: 'visible'
    },
    {
        de: 'Anzahl Geräte: {0}',
        en: 'Number of devices: {0}'
    },
    {
        de: 'Anzahl (1): {0}',
        en: 'Number (1): {0}'
    },
    {//9
        de: 'physisch ',
        en: 'physical '
    },
    {//10
        de: 'nicht physisch ',
        en: 'non physical '
    },
    {//11
        de: 'hidden ',
        en: 'hidden '
    },
    {//12
        de: 'not hidden ',
        en: 'not hidden '
    },
    {//13
        de: 'visible ',
        en: 'visible '
    },
    {//14
        de: 'invisible ',
        en: 'invisible '
    },
    {//15
        de: 'Gerätetyp',
        en: 'Device type'
    },
    {//16
        de: 'Ort',
        en: 'Location'
    },
    {//17
        de: 'failed ',
        en: 'failed '
    },
    {//18
        de: 'not failed ',
        en: 'not failed '
    },
];

var filterInput;
var elPhysical;
var elNonPhysical;
var elHidden;
var elNonHidden;
var elVisible;
var elInvisible;
var elFailed;
var elNotFailed;
var devicesArray = [];

//get html language
var lang = ch_utils.getLanguage();
ch_utils.convertMessagesToUTF8();

var BasicAuth = ch_utils.getParameter('BasicAuth');
console.log('BasicAuth='+BasicAuth);

ch_utils.buttonVisible('json-renderer', false);

//set texts
document.title = ch_utils.buildMessage(0);
ch_utils.buttonText('physicalT', 9);
ch_utils.buttonText('nonPhsicylT', 10);
ch_utils.buttonText('hiddenT', 11);
ch_utils.buttonText('nonHiddenT', 12);
ch_utils.buttonText('visibleT', 13);
ch_utils.buttonText('invisibleT', 14);
ch_utils.buttonText('failed', 17);
ch_utils.buttonText('notFailed', 18);

//------
//b Main
//------
document.addEventListener("DOMContentLoaded", function(event) {
    //webpage elements
    filterInput = document.getElementById("myInput");
    filterInput.placeholder = ch_utils.buildMessage(6);
    filterInput.focus();

    elPhysical = document.getElementById("physical");
    elNonPhysical = document.getElementById("nonPhsicyl");
    elHidden = document.getElementById("hidden");
    elNonHidden= document.getElementById("nonHidden");
    elVisible = document.getElementById("visible");
    elInvisible = document.getElementById("invisible");
    elFailed = document.getElementById("failed");
    elNotFailed = document.getElementById("notFailed");

    //check for administrator, start readDevices
    ch_utils.requireAdmin(readDevices, BasicAuth);
}); //(document).addEventListener

//-----------
//b Functions
//-----------
function readDevices() {
    ch_utils.displayMessage(3);
    var url = '/ZAutomation/api/v1/devices';
    ch_utils.ajax_get(url, success);
    function success (data) {
        devicesArray = processDevices(data.data.devices);
        display();
    }
} //readDevices

function processDevices(devices) {
    ch_utils.displayMessage(4);

    var devicesArray = [];
    devices.forEach(function(d, ix) {
        //store devices info
        var item = {id: d.id,
                    creatorId: d.creatorId,
                    title: d.metrics.title,
                    updateTime: d.updateTime,
                    instance: null,
                    deviceType: d.deviceType,
                    locationName: d.locationName,
                    level: d.metrics.level,
                    visibility: d.visibility,
                    permanently_hidden: d.permanently_hidden,
                    isFailed: d.metrics.isFailed || false
                   };
        devicesArray.push(item);
    });
    return devicesArray.sort(function(a, b){return (a.id > b.id) ? 1 : -1;});
} //processDevices

function display() {
    var html = buildHTML(devicesArray);
    printHTML(html, 5);

    if (filterInput.value.length > 0) {
        myFunction();
    }
    scrollUp(true);
} //display

function buildHTML(devicesArray) {
    var countDevices = 0;
    var countPhysical = 0;

    //build table line
    function nextLine(col0, col1, deviceType, locationName, col2, col3, col4, col5, col6, col7) {
        var html = '';
        html += '<tr>';
        html += '<td headers="device" align=left>'+col0+'</td>';
        html += '<td headers="title" align=left>'+col1+'</td>';
        html += '<td headers="deviceType" align=left>'+deviceType+'</td>';
        html += '<td headers="locationName" align=left>'+locationName+'</td>';
        html += '<td headers="creatorId" align=center>'+col2+'</td>';
        var color;
        switch (typeof col4) {
            case 'string':
                color = 'black';
                col4 = "'"+col4+"'";
                break;
            case 'number':
                color = 'BlueViolet';
                break;
            case 'boolean':
                color = 'brown';
                break;
            default:
                color = 'red';
                break;
        }

        switch (col5) {
            case true:
                color = 'red';
                break;
            default:
                color = 'black';
                break;
        }

        var devId = col0.split('>')[1].split('<')[0];
        if (elFailed.checked === elNotFailed.checked) {
            html += '<td headers="isFailed" align=center>';
            html += buildCheckbox('isFailed', devId, col7, false);
            html += '</td>';
        }
        if (elVisible.checked === elInvisible.checked) {
            html += '<td headers="visibility" align=center>';
            html += buildCheckbox('visibility', devId, col6, false);
            html += '</td>';
        }
        if (elHidden.checked === elNonHidden.checked) {
            html += '<td headers="permanently_hidden" align=center>';
            html += buildCheckbox('permanently_hidden', devId, col5, false);
            html += '</td>';
        }

        html += '<td headers="level" align=center>';
        html += "<font color='"+color+"'>"+col4+"</font></td>";
        html += '<td headers="updateTime">'+ch_utils.userTime(col3)+'</td>';
        html += '</tr>\n';
        return html;
    } //nextLine

    //table header
    var html = '';
    html +=  '<table id="indextable" class="sortable">';
    html += '<thead><tr>';
    html += '<th id="device"> '+ch_utils.buildMessage(ix_selectTexts+0)+' </th>';
    html += '<th id="title"> '+ch_utils.buildMessage(ix_selectTexts+1)+' </th>';
    html += '<th id="deviceType"> '+ch_utils.buildMessage(ix_selectTexts+15)+' </th>';
    html += '<th id="locationName"> '+ch_utils.buildMessage(ix_selectTexts+16)+' </th>';
    html += '<th id="creatorId"> '+ch_utils.buildMessage(ix_selectTexts+2)+' </th>';

    if (elFailed.checked === elNotFailed.checked) {
        html += '<th id="isFailed" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+17)+' </th>';
    }
    if (elInvisible.checked === elVisible.checked) {
        html += '<th id="visibility" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+6)+' </th>';
    }
    if (elHidden.checked === elNonHidden.checked) {
        html += '<th id="permanently_hidden" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+5)+' </th>';
    }

    html += '<th id="level"> '+ch_utils.buildMessage(ix_selectTexts+4)+' </th>';
    html += '<th id="updateTime"> '+ch_utils.buildMessage(ix_selectTexts+3)+' </th>';
    html += '</tr></thead>';
    html += '<tbody>\n';

    //for all devices
    for (var ix = 0; ix < devicesArray.length; ix++) {
        var dev = devicesArray[ix];
        //filter device
        if (elPhysical.checked === false && dev.id.indexOf("ZWayVDev_zway_") === 0) {
            continue;
        }
        if (elNonPhysical.checked === false && dev.id.indexOf("ZWayVDev_zway_") !== 0) {
            continue;
        }
        if (elHidden.checked === false && dev.permanently_hidden === true) {
            continue;
        }
        if (elNonHidden.checked === false && dev.permanently_hidden === false) {
            continue;
        }
        if (elVisible.checked === false && dev.visibility === true) {
            continue;
        }
        if (elInvisible.checked === false && dev.visibility === false) {
            continue;
        }
        if (elFailed.checked === false && dev.isFailed === true) {
            continue;
        }
        if (elNotFailed.checked === false && dev.isFailed === false) {
            continue;
        }

        //store table line
        var i = dev.id;
        var c = dev.creatorId;
        html += nextLine('<a href="/ZAutomation/api/v1/devices/'+i+'">'+i+'</a>',
                        dev.title,
                        dev.deviceType,
                        dev.locationName,
                        '<a href="/ZAutomation/api/v1/instances/'+c+'">'+c+'</a>',
                        dev.updateTime ,
                        dev.level,
                        dev.permanently_hidden,
                        dev.visibility,
                        dev.isFailed
                        );
        countDevices += 1;
        if (c*1 === 1) {countPhysical += 1;}
    } // for devicesArray

    //table footer
    html += '</tbody>';
    html += '<tfoot>';
    html += '<tr>';
    html += '<th>'+ch_utils.buildMessage(ix_selectTexts+7,countDevices)+'</th>';
    html += '<th></th>';
    html += '<th>'+ch_utils.buildMessage(ix_selectTexts+8,countPhysical)+' </th>';
    html += '<th></th>';
    html += '<th></th>';
    if (elFailed.checked === elNotFailed.checked) {
        html += '<th></th>';
    }
    if (elVisible.checked === elInvisible.checked) {
        html += '<th></th>';
    }
    if (elHidden.checked === elNonHidden.checked) {
        html += '<th></th>';
    }
    html += '<th></th>';
    html += '<th></th>';
    html += '</tr>';
    html += '</tfoot>';
    html += '</table>';

    return html;
} //buildHTML

function buildCheckbox(col, devId, val, changeable) {
    var str  = '<input type="checkbox" id="'+col+'+'+devId+'"';
        str += val ? ' checked' : '';
        str += changeable ? '' : ' disabled';
        str += '>';
    return str;
} //buildCheckbox

function printHTML(dataBuffer, messNo) {
    ch_utils.buttonVisible('json-renderer', true);
    ch_utils.displayMessage(messNo);
    document.getElementById('json-renderer').innerHTML = dataBuffer;
    var el = document.getElementById('indextable');
    sorttable.makeSortable(el);

    //define checkbox event:
    var checkboxList = document.querySelectorAll('[type="checkbox"]');
    //console.log(checkboxList);
    /*jshint loopfunc:true */
    for (var i = 0; i < checkboxList.length; i++) {
        checkboxList[i].addEventListener('change', function(event) {
            if (event.target.id.indexOf('+') <= 0) {
                return;
            }
            var metric = event.target.id.split('+')[0];
            var devId = event.target.id.replace(metric+'+', '');

            var checked = event.target.checked;
            //only works for values within metrics:
            var url = '/ZAutomation/api/v1/devices/'+devId+'/command/set?'+metric+'='+checked;
            ch_utils.ajax_get(url, success, fail);
            function success (data) {
                alert('success');
            }
            function fail (status, text) {
                alert(text);
            }
        });
    }
    /*jshint loopfunc:false */
} //printHTML

function scrollUp(flag) {
    if (flag) { document.getElementById('json-renderer').scrollTop = 0; }
} //scrollUp

