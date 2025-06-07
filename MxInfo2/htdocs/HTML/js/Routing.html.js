//h-------------------------------------------------------------------------------
//h
//h Name:         Routing.html.js
//h Type:         Javascript module
//h Purpose:      Display routing statistics.
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.0 2025-05-14/peb
//v History:      V1.0 2022-04-16/peb first version
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------
/*jshint esversion: 6 */
/*globals sorttable, ch_utils, myFunction */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Routing.html.js';
var VERSION='V1.0';
var WRITTEN='2025-05-14/peb';

//for priority routes:
var HOPS = 4;
var SPEEDS = [9.6,40,100];

var arrow = ch_utils.convertToUTF8(' ⟶ ');
var battery = ch_utils.convertToUTF8('🪫');
var plus = ch_utils.convertToUTF8(' ➕ ');
var minus = ch_utils.convertToUTF8(' ➖ ');
var quest = ch_utils.convertToUTF8(' 🟢 ');

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 22;
var ix_selectTexts = 22;
var messageFormats = [
    //message texts (0+...):
    {//0
        de: 'Routing',
        en: 'Routing'
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
        de: 'Filter...',
        en: 'Filter...',
    },
    {//4
        de: 'Paketdaten werden angefordert...',
        en: 'Requesting packet data...'
    },
    {//5
        de: 'Gerätedaten werden angefordert...',
        en: 'Requesting node data...'
    },
    {//6
        de: 'Paketdaten werden verarbeitet...</b>',
        en: 'Processing packet data...</b>'
    },
    {//7
        de: 'Gerätedaten werden verarbeitet...</b>',
        en: 'Processing node data...</b>'
    },
    {//8
        de: 'Gerätedaten werden verarbeitet...</b>',
        en: 'Processing node data...</b>'
    },
    {//9
        de: 'Ausgabe wird vorbereitet...</b>',
        en: 'Preparing output...</b>'
    },
    {//10
        de: 'Routing Tabelle wird vorbereitet...</b>',
        en: 'Preparing routing table...</b>'
    },
    {//11
        de: 'Routing Statistik</b>',
        en: 'Routing Statistics</b>'
    },
    {//12
        de: "Priority Route setzen:",
        en: "Set priority route:"
    },
    {//13
        de: 'Eingabefehler {0}, Abbruch!',
        en: 'Wrong input {0}, break!'
    },
    {//14
        de: 'Priority Route {0} erfolgreich gesetzt.',
        en: 'Priority route {0} set successfully.'
    },
    {//15
        de: 'Priority Route {0} erfolgreich gelöscht.',
        en: 'Priority route {0} removed successfully.'
    },
    {//16
        de: '<b>Routing Ratio: {0} %</b>, von {1} bis {2}',
        en: '<b>Routing Ratio: {0} %</b>: from {1} to {2}'
    },
    {//17
        de: 'die Priority Route löschen',
        en: 'delete the priority route'
    },
    {//18
        de: 'eine Priority Route setzen',
        en: 'set a priority route'
    },
    {//19
        de: "die Priority Route '{0}' löschen?",
        en: "delete the priority route '{0}' löschen?"
    },
    {//20
        de: 'Nachbarn für {0} angefordert.',
        en: 'Update neighbours for {0} requestet.'
    },
    {//21
        de: 'Nachbarn aktualisieren',
        en: 'Request update neighbours'
    },

    //button texts (22+...):
    //select texts (22+...):
    {
        de: 'Gerät',
        en: 'Node'
    },
    {
        de: 'Gerätename',
        en: 'Node Name'
    },
    {
        de: 'Richtung',
        en: 'Direction'
    },
    {
        de: 'Nach<br> barn',
        en: 'Neigh<br> bours'
    },
    {
        de: 'Pakete',
        en: 'Packets'
    },
    {//4
        de: 'Routen',
        en: 'Routes'
    },
    {//6
        de: 'Erfolg',
        en: 'Success'
    },
    {
        de: battery,
        en: battery
    },
    {
        de: 'Fehler',
        en: 'Failed'
    },
    {
        de: 'Haupt-<br>route',
        en: 'Main<br>Route'
    },
    {
        de: 'Ratio<br> Haupt-<br> route',
        en: 'Ratio<br> Main<br> Route'
    },
    {
        de: 'Priority<br>Route',
        en: 'Priority<br>Route'
    },
    {
        de: 'Setzen/<br> Löschen',
        en: 'Set<br>Delete '
    },
    {
        de: 'Speed<br> kbps',
        en: 'Speed<br> kbps'
    },
    {
        de: 'Batteriegerät',
        en: 'Battery device'
    },
    {   //15
        de: 'Letztes<br>Paket',
        en: 'Last<br>Packet'
    },
    {   //16
        de: 'Explore<br>Frames',
        en: 'Explore<br> Frames'
    },
];

var filterInput;

var routingRatio, mainRouteRatioSum, mainRouteRatioCount;

//get html language
var lang = ch_utils.getLanguage();
ch_utils.convertMessagesToUTF8();

var BasicAuth = ch_utils.getParameter('BasicAuth');
console.log('BasicAuth='+BasicAuth);

ch_utils.buttonVisible('json-renderer', false);

//set texts
document.title = ch_utils.buildMessage(0);

var priorityRoutes, prioritySpeeds;
var routesTree;
var nodeList;
var first, last;

//------
//b Main
//------
document.addEventListener("DOMContentLoaded", function(event) {
    //webpage elements
    filterInput = document.getElementById("myInput");
    filterInput.placeholder = ch_utils.buildMessage(3);
    filterInput.focus();

    //check for administrator, start getPackets
    ch_utils.requireAdmin(go_on, BasicAuth);
}); //(document).addEventListener

//-----------
//b Functions
//-----------
var executed;
function go_on(ex) {
    //console.log('go_on('+ex+')');
    if (ex === undefined) {
        executed = 0;
    }
    switch (executed) {
        case 0:
            getNodeData();
            break;
        case 1:
            prepareRoutesList();
            break;
        case 2:
            getPackets();
            break;
        case 3:
            display();
            break;
    }
} //go_on

function getNodeData() {
    //console.log('getNodeData');
    ch_utils.displayMessage(5);
    var url = '/ZWaveAPI/Data/0';
    ch_utils.ajax_get(url, success);
    function success (buffer) {
        //build routes lists
        buildNodeList(buffer.devices);
    }
} //getNodeData

function buildNodeList(devices) {
    //console.log('buildNodeList');
    ch_utils.displayMessage(7);

    nodeList = {};
    priorityRoutes = {};
    prioritySpeeds = {};

    var givenName, isRouting, isListening, isFlirs, countNeighbours, neighbours;
    Object.keys(devices).forEach(function(device, ix) {
        var devData = devices[device].data;
        givenName = devData.givenName.value || '';
        isListening = devData.isListening.value;
        isFlirs = devData.sensor250.value || devData.sensor1000.value;

        neighbours = devData.neighbours.value;
        if (typeof neighbours !== 'object') {
            neighbours = [];
        }
        countNeighbours = neighbours.length;
        if (!countNeighbours &&
            devData.deviceTypeString.value.indexOf('Portable') >= 0) {
            countNeighbours = '';
        }

        if (!givenName && device === '1') {
            givenName = 'ZWay Controller';
        }
        nodeList[device] = {givenName: givenName,
                            isBattery: !isListening && !isFlirs,
                            countNeighbours: countNeighbours,
                            neighbours: neighbours,
                            neighboursString: '',
                            lastReceived: devData.lastReceived.updateTime,
                            lastSend: devData.lastSend.updateTime,
        };
        var priRoutes = devData.priorityRoutes;
        Object.keys(priRoutes).forEach(function(target, ix) {
            if (priRoutes[target] && typeof priRoutes[target] === 'object') {
                if (priRoutes[target].value !== null) {
                    var route = device;
                    if (! priorityRoutes.hasOwnProperty(device)) {
                        priorityRoutes[device] = {};
                    }
                    for (var i = 0; i < 4; i++ ) {
                        var j = priRoutes[target].value[i];
                        if (j === 0) {break;}
                        route += ','+j;
                    }
                    route += ','+target;
                    priorityRoutes[device][target] = route;

                    if (! prioritySpeeds.hasOwnProperty(device)) {
                        prioritySpeeds[device] = {};
                    }
                    var speed = priRoutes[target].value[4];
                    prioritySpeeds[device][target] = SPEEDS[speed-1] || speed;
                }
            }
        });
    });
    //console.log(nodeList);

    go_on(++executed);
} //buildNodeList

function prepareRoutesList(devices) {
    //console.log('prepareRoutesList');
    ch_utils.displayMessage(10);

    var nodeNum, nodeName;
    routesTree = {};
    Object.keys(nodeList).forEach(function(node, ix) {
        if (node > 1) {
            //add givenName to neighbours
            var countNeighbours = nodeList[node].countNeighbours;
            if (countNeighbours !== 0)  {
                var neighboursString = '';
                for (var i = 0; i < countNeighbours; i++) {
                    nodeNum = nodeList[node].neighbours[i];
                    if (nodeList[nodeNum]) {
                        nodeName = nodeList[nodeNum].givenName;
                        neighboursString += nodeNum+': '+nodeName+'\n';
                    } else {
                        neighboursString += nodeNum+': undefined\n';
                    }
                }
                nodeList[node].neighboursString = neighboursString;
            }

            //create empty routesTree
            routesTree[node+'_'+1] = {
                countPackets: 0,
                countPackets_singlecasts: 0,
                countPackets_exploreframes: 0,
                countPackets_others: 0,
                countUsedRoutes: 0,
                usedRoutes: {},
                delivered: 0,
                failed: 0,
                mainRoute: '',
                mainRouteUsed: 0,
                routeArray: [],
                usedRoutesString: '',
                usedFailedString: ''
            };
            routesTree[1+'_'+node] = {
                countPackets: 0,
                countUsedRoutes: 0,
                usedRoutes: {},
                delivered: 0,
                failed: 0,
                mainRoute: '',
                mainRouteUsed: 0,
                routeArray: [],
                usedRoutesString: '',
                usedFailedString: ''
            };
        }
    });
    //console.log(routesTree);

    go_on(++executed);
} //prepareRoutesList

function getPackets() {
    //console.log('getPackets');
    ch_utils.displayMessage(4);
    var url = '/ZWave.zway/PacketLog';
    ch_utils.ajax_get(url, success);
    function success (buffer) {
        //build routes lists
        buildRoutesList(buffer.data);
    }
} //getPackets

function buildRoutesList(packets) {
    //console.log('buildRoutesList');
    ch_utils.displayMessage(6);

    function routeString(source, target, hops, failed) {
        if (failed && hops[0] === 0) {
            return '';
        }
        var hopsString = source;
        for (var i = 0; i < hops.length; i++) {
            if (hops[i] !== target && hops[i] !== 0) {
                hopsString += ','+hops[i];
            }
        }
        hopsString += ','+target;
        return hopsString;
    }

    const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

    var source, target, s_t, hopsDelivered, countHopsDelivered;
    first = undefined; last = undefined;
    //Object.keys(packets).forEach(function(packet, ix) {
    var object_keys = Object.keys(packets);
    var packet;
    for (var ix = 0; ix < object_keys.length; ix++) {
        packet = object_keys[ix];
        if (packet) {
            if (!first) {first = packets[packet].updateTime;}
            last = packets[packet].updateTime;
            //outgoing packet
            if (packets[packet].hasOwnProperty('delivered')) {
                //console.log('outgoing');
                source = 1;
                target = packets[packet].nodeId;
                if (nodeList[target] === undefined) {
                    console.log('packet sent to unknown node='+target);
                    continue;
                }
                s_t = source+'_'+target;
                routesTree[s_t].countPackets++;
                hopsDelivered = routeString(source, target, packets[packet].hops, false);

                //success delivery
                if (packets[packet].delivered === true) {
                    //console.log('success');
                    if (typeof routesTree[s_t].usedRoutes[hopsDelivered] === 'undefined') {
                        routesTree[s_t].usedRoutes[hopsDelivered] = 1;
                    } else {
                        routesTree[s_t].usedRoutes[hopsDelivered] = 
                            routesTree[s_t].usedRoutes[hopsDelivered] + 1;
                    }

                    routesTree[s_t].delivered++;
                    if (routesTree[s_t].routeArray.indexOf(hopsDelivered) < 0) {
                        routesTree[s_t].countUsedRoutes++;
                    }
                    routesTree[s_t].routeArray.push(hopsDelivered);
                    if (routesTree[s_t].mainRouteUsed === 0) {
                        routesTree[s_t].mainRoute = hopsDelivered;
                        routesTree[s_t].mainRouteUsed++;
                    } else
                    if (routesTree[s_t].mainRoute === hopsDelivered) {
                        routesTree[s_t].mainRouteUsed++;
                    } else {
                        countHopsDelivered = countOccurrences(routesTree[s_t].routeArray, hopsDelivered);
                        if (countHopsDelivered > routesTree[s_t].mainRouteUsed) {
                            routesTree[s_t].mainRoute = hopsDelivered;
                            routesTree[s_t].mainRouteUsed = countHopsDelivered;
                        } else
                        if (countHopsDelivered === routesTree[s_t].mainRouteUsed) {
                            if (hopsDelivered.split(',').length < 
                                routesTree[s_t].mainRoute.split(',').length) {
                            routesTree[s_t].mainRoute = hopsDelivered;
                            routesTree[s_t].mainRouteUsed = countHopsDelivered;
                            }
                        }

                    }
                //failed delivery
                } else {
                    //console.log('failed');
                    routesTree[s_t].failed++;
                    if (routesTree[s_t].usedFailedString.indexOf(hopsDelivered) < 0) {
                        routesTree[s_t].usedFailedString += hopsDelivered+'\n';
                    }
                } //failed delivery
            //incoming packet
            } else {
                //console.log('incoming');
                target = 1;
                source = packets[packet].nodeId;
                if (nodeList[source] === undefined) {
                    console.log('packet received from unknown node='+source);
                } else {
                    s_t = source+'_'+target;
                    routesTree[s_t].countPackets++;

                    //singlecasts
                    if (packets[packet].frameType === 'singlecast') {
                        routesTree[s_t].countPackets_singlecasts++;
                    } else
                    //explore frames
                    if (packets[packet].frameType === 'Explore Frame') {
                        routesTree[s_t].countPackets_exploreframes++;
                    } else {
                        routesTree[s_t].countPackets_others++;
                    }

                    routesTree[s_t].delivered++;
                    hopsDelivered = routeString(source, target, packets[packet].hops, false);
                    if (typeof routesTree[s_t].usedRoutes[hopsDelivered] === 'undefined') {
                        routesTree[s_t].usedRoutes[hopsDelivered] = 1;
                    } else {
                        routesTree[s_t].usedRoutes[hopsDelivered] = 
                            routesTree[s_t].usedRoutes[hopsDelivered] + 1;
                    }

                    if (routesTree[s_t].routeArray.indexOf(hopsDelivered) < 0) {
                        routesTree[s_t].countUsedRoutes++;
                    }
                    routesTree[s_t].routeArray.push(hopsDelivered);
                    if (routesTree[s_t].mainRouteUsed === 0) {
                        routesTree[s_t].mainRoute = hopsDelivered;
                        routesTree[s_t].mainRouteUsed++;
                    } else
                    if (routesTree[s_t].mainRoute === hopsDelivered) {
                        routesTree[s_t].mainRouteUsed++;
                    } else {
                        countHopsDelivered = countOccurrences(routesTree[s_t].routeArray, hopsDelivered);
                        if (countHopsDelivered > routesTree[s_t].mainRouteUsed) {
                            routesTree[s_t].mainRoute = hopsDelivered;
                            routesTree[s_t].mainRouteUsed = countHopsDelivered;
                        } else
                        if (countHopsDelivered === routesTree[s_t].mainRouteUsed) {
                            if (hopsDelivered.split(',').length < 
                                routesTree[s_t].mainRoute.split(',').length) {
                            routesTree[s_t].mainRoute = hopsDelivered;
                            routesTree[s_t].mainRouteUsed = countHopsDelivered;
                            }
                        }
                    }
                }
            } //incoming packet
        }
    }
    //console.log(routesTree);

    //console.log('go_on');
    go_on(++executed);
} //buildRoutesList

function display() {
    //console.log('display');
    var html = buildHTML();
    printHTML(html, 11);

    if (filterInput.value.length > 0) {
        myFunction();
    }
    scrollUp(true);
} //display

function buildHTML() {
    //console.log('buildHTML');
    ch_utils.displayMessage(9);

    function backcolor(value, color) {
        if (value === '') {return value;}
        return '<span style="background-color: '+color+'"><b>'+value+'</b></span>';
    }

    //build table line
    function nextLine(node, nodeName, isBattery, countNeighbours, 
                      source, target, direction,
                      countPackets,
                      countUsedRoutes, usedRoutes, delivered, failed,
                      mainRoute, mainRouteRatio, 
                      priorityRoute, prioritySpeed,
                      usedRoutesString, usedFailedString, neighboursString,
                      lastReceived_Send,
                      explframes) {
        html = '';
        html += '<tr>';
        html += '<td headers="node" align=center>'+node+'</td>';
        var col = 'yellow';
        if (nodeName && !isBattery && mainRouteRatio > 0 && mainRouteRatio < 100) {
            col = mainRouteRatio <= 50 ? '#ff9933' : 
                            (mainRouteRatio <= 70 ? 'yellow' : 'lightgrey');
            html += '<td headers="nodeName" align=left>'+
                backcolor(nodeName, col)+'</td>';
        } else {
            html += '<td headers="nodeName" align=left>'+nodeName+'</td>';
        }
        html += '<td headers="isBattery" align=center>'+isBattery+'</td>';
        jscript = '';
        if (typeof countNeighbours === 'number') {
            jscript = '&nbsp;<a title="'+ch_utils.buildMessage(21)+
                '" style="text-decoration:none" href="javascript:reqNeighbours('+
                node+');">'+quest+'</a> ';
        }

        col = undefined;
        if (countNeighbours === 0) {
            col = '#ff9933';
        } else
        if (neighboursString.indexOf('undefined') >= 0) {
            col = '#ff9933';
        }
        html += '<td title="'+neighboursString+'"headers="countNeighbours" align=center>'+
                        (!col ? countNeighbours : 
                                backcolor(countNeighbours, col))+
                         jscript+
                        '</td>';
        html += '<td headers="direction" align=center>'+direction+'</td>';
        html += '<td headers="countPackets" align=center>'+countPackets+'</td>';
        html += '<td title="'+usedRoutesString+'"headers="countUsedRoutes" align=center>'+
                        (countUsedRoutes !== 1 ? countUsedRoutes : 
                        backcolor(countUsedRoutes, 'lightgreen'))+
                        '</td>';
        html += '<td headers="delivered" align=center>'+
                        (delivered !== countPackets ? delivered : 
                        backcolor(delivered, 'lightgreen'))+
                        '</td>';
        html += '<td headers="explframes" align=center>'+
                        (explframes ? explframes : '')+
                        '</td>';
        html += '<td title="'+usedFailedString+'"headers="failed" align=center>'+
                        (failed === 0 ? '' : 
                            (isBattery ? backcolor(failed, 'yellow') : backcolor(failed, '#ff9933'))
                        )+
                        '</td>';
        html += '<td headers="mainRoute" align=center>'+mainRoute+'</td>';
        var x;
        if (countUsedRoutes > 1 && mainRouteRatio) {
            html += '<td headers="mainRouteRatio" align=center>'+
                        (mainRouteRatio <= 50 ? backcolor(mainRouteRatio+' %', '#ff9933') : 
                            (mainRouteRatio <= 70 ? backcolor(mainRouteRatio+' %', 'yellow') :
                                mainRouteRatio+' %'))+
                        '</td>';
        } else {
            html += '<td headers="mainRouteRatio" align=center></td>';
         }
        html += '<td headers="priorityRoute" align=center>'+
                        //(mainRoute !== priorityRoute ? priorityRoute : 
                        //    backcolor(priorityRoute, 'lightgreen'))+
                        (mainRoute === priorityRoute ? backcolor(priorityRoute, 'lightgreen') : 
                                                       (mainRoute ? backcolor(priorityRoute, '#ff9933') :
                                                                    priorityRoute
                                                       )
                        )+
                        '</td>';
        html += '<td headers="prioritySpeed" align=center>'+prioritySpeed+'</td>';

        //call javascript to set priority route
        var jscript = '';
        if (priorityRoute) {
            jscript = '<a title="'+ch_utils.buildMessage(17)+
                '" style="text-decoration:none" href="javascript:deleteRoute(\''+
                priorityRoute+'\');">'+minus+'</a> ';
        } else 
        if (countUsedRoutes > 1 || failed > 1) {
            var param = mainRoute || source+'\,'+target;
            jscript = '<a title="'+ch_utils.buildMessage(18)+
                '" style="text-decoration:none" href="javascript:setRoute(\''+
                param+'\');">'+plus+'</a> ';
        }
        html += '<td headers="SetPriorityRoute" align=center>'+jscript+'</td>';

        html += '<td headers="lastReceived_Send" align=center>'+
            ch_utils.userTime(lastReceived_Send)+
            '</td>';

        html += '</tr>\n';
        return html;
    } //nextLine

    //table header
    var html = '';
    html +=  '<table id="indextable" class="sortable">';
    html += '<thead><tr>';
    html += '<th id="node"> '+ch_utils.buildMessage(ix_selectTexts+0)+' </th>';
    html += '<th id="nodeName"> '+ch_utils.buildMessage(ix_selectTexts+1)+' </th>';
    html += '<th title="'+ch_utils.buildMessage(ix_selectTexts+14)+'" id="isBattery"> '+ch_utils.buildMessage(ix_selectTexts+7)+' </th>';
    html += '<th id="countNeighbours"> '+ch_utils.buildMessage(ix_selectTexts+3)+' </th>';
    html += '<th id="direction"> '+ch_utils.buildMessage(ix_selectTexts+2)+' </th>';
    html += '<th id="countPackets"> '+ch_utils.buildMessage(ix_selectTexts+4)+' </th>';
    html += '<th id="countUsedRoutes"> '+ch_utils.buildMessage(ix_selectTexts+5)+' </th>';
    html += '<th id="delivered"> '+ch_utils.buildMessage(ix_selectTexts+6)+' </th>';
    html += '<th id="explframes"> '+ch_utils.buildMessage(ix_selectTexts+16)+' </th>';
    html += '<th id="failed"> '+ch_utils.buildMessage(ix_selectTexts+8)+' </th>';
    html += '<th id="mainRoute"> '+ch_utils.buildMessage(ix_selectTexts+9)+' </th>';
    html += '<th id="mainRouteRatio"> '+ch_utils.buildMessage(ix_selectTexts+10)+' </th>';
    html += '<th id="priorityRoute"> '+ch_utils.buildMessage(ix_selectTexts+11)+' </th>';
    html += '<th id="prioritySpeed"> '+ch_utils.buildMessage(ix_selectTexts+13)+' </th>';
    html += '<th id="SetPriorityRoute"> '+ch_utils.buildMessage(ix_selectTexts+12)+' </th>';
    html += '<th id="lastReceived_Send"> '+ch_utils.buildMessage(ix_selectTexts+15)+' </th>';
    html += '</tr></thead>';
    html += '<tbody>\n';

    var source, target, priRoute, priSpeed, countPackets,
        mainRouteRatio, mainRouteUsed, delivered, explframes;
    mainRouteRatioSum = 0;
    mainRouteRatioCount = 0;
    Object.keys(nodeList).forEach(function(node, ix) {
        if (node > 1) {
            //incoming packets
            source = node;
            target = 1;
            priRoute = '';
            if (priorityRoutes[source] && priorityRoutes[source][target]) {
                priRoute = priorityRoutes[source][target];
            }
            priSpeed = '';
            if (prioritySpeeds[source] && prioritySpeeds[source][target]) {
                priSpeed = prioritySpeeds[source][target];
            }
            countPackets = routesTree[source+'_'+target].countPackets;
            mainRouteUsed = routesTree[source+'_'+target].mainRouteUsed;
            var usedRoutes, usedRoutesString; 
            delivered = routesTree[source+'_'+target].delivered;
            if (delivered) {
                mainRouteRatio = Math.round(mainRouteUsed/delivered*100);
                mainRouteRatioSum = mainRouteRatioSum + mainRouteRatio;
                mainRouteRatioCount++;

                usedRoutes = routesTree[source+'_'+target].usedRoutes;
                usedRoutesString = '';
                Object.keys(usedRoutes).forEach(function(route, ix) {
                    usedRoutesString += route+': '+Math.round(usedRoutes[route]/delivered*100)+' %\n';
                });
                routesTree[source+'_'+target].usedRoutesString = usedRoutesString;
            }
            explframes = routesTree[source+'_'+target].countPackets_exploreframes;

            html += nextLine(
                  node,
                  nodeList[source].givenName, 
                  nodeList[source].isBattery ? battery : '', 
                  nodeList[source].countNeighbours, 
                  source,
                  target,
                  source+arrow+target,
                  countPackets ? countPackets : '',
                  countPackets ? routesTree[source+'_'+target].countUsedRoutes : '',
                  countPackets ? routesTree[source+'_'+target].usedRoutes : '',
                  countPackets ? delivered : '',
                  countPackets ? routesTree[source+'_'+target].failed : '',
                  countPackets ? routesTree[source+'_'+target].mainRoute : '',
                  countPackets ? mainRouteRatio : '',
                  priRoute,
                  priSpeed,
                  countPackets ? routesTree[source+'_'+target].usedRoutesString : '',
                  countPackets ? routesTree[source+'_'+target].usedFailedString : '',
                  nodeList[source].neighboursString,
                  nodeList[source].lastReceived,
                  explframes ? explframes : ''
            );

            //outgoing packets
            source = 1;
            target = node;
            priRoute = '';
            if (priorityRoutes[source] && priorityRoutes[source][target]) {
                priRoute = priorityRoutes[source][target];
            }
            priSpeed = '';
            if (prioritySpeeds[source] && prioritySpeeds[source][target]) {
                priSpeed = prioritySpeeds[source][target];
            }
            countPackets = routesTree[source+'_'+target].countPackets;
            mainRouteUsed = routesTree[source+'_'+target].mainRouteUsed;
            delivered = routesTree[source+'_'+target].delivered;
            if (delivered) {
                mainRouteRatio = Math.round(mainRouteUsed/delivered*100);
                mainRouteRatioSum = mainRouteRatioSum + mainRouteRatio;
                mainRouteRatioCount++;

                usedRoutes = routesTree[source+'_'+target].usedRoutes;
                usedRoutesString = '';
                Object.keys(usedRoutes).forEach(function(route, ix) {
                    usedRoutesString += route+': '+Math.round(usedRoutes[route]/delivered*100)+' %\n';
                });
                routesTree[source+'_'+target].usedRoutesString = usedRoutesString;
            }

            html += nextLine(
                  node,
                  '', 
                  nodeList[target].isBattery ? battery : '', 
                  '', 
                  source,
                  target,
                  source+arrow+target,
                  countPackets ? countPackets : '',
                  countPackets ? routesTree[source+'_'+target].countUsedRoutes : '',
                  countPackets ? routesTree[source+'_'+target].usedRoutes : '',
                  countPackets ? delivered : '',
                  countPackets ? routesTree[source+'_'+target].failed : '',
                  countPackets ? routesTree[source+'_'+target].mainRoute : '',
                  countPackets ? mainRouteRatio : '',
                  priRoute,
                  priSpeed,
                  countPackets ? routesTree[source+'_'+target].usedRoutesString : '',
                  countPackets ? routesTree[source+'_'+target].usedFailedString : '',
                  nodeList[source].neighboursString,
                  nodeList[target].lastSend
            );
        }
    });

    html += '</tbody>';
    html += '</table>';

    routingRatio = Math.round(mainRouteRatioSum/ mainRouteRatioCount*10)/10;
    return html;
} //buildHTML

function printHTML(dataBuffer, messNo) {
    ch_utils.buttonVisible('json-renderer', true);
    ch_utils.displayMessage(messNo);
    document.getElementById('json-renderer').innerHTML = dataBuffer;
    var el = document.getElementById('indextable');
    sorttable.makeSortable(el);

    var from = ch_utils.userTime(first).replace(/:\d*$/, '');
    var to = ch_utils.userTime(last).replace(/:\d*$/, '');
   document.getElementById('ratio').innerHTML = 
        ch_utils.buildMessage(16, routingRatio, from, to);
} //printHTML

function reqNeighbours(node) {
    var url = '/ZWave.zway/Run/devices['+node+'].RequestNodeNeighbourUpdate()';
    var textSuccess = ch_utils.buildMessage(20, node);

    console.log(url);
    alert(url);
    ch_utils.ajax_put(url, null, success, fail);

    function success(data) {
        console.log(data);
        console.log(textSuccess);
        alert(textSuccess);
    } //success
   
    function fail(status, text) {
        console.log(status+': '+text);
        alert(status+': '+text);
    } //fail
} //reqNeighbours

function deleteRoute(oldRoute) {
    if (!confirm(ch_utils.buildMessage(19, oldRoute))) {return;}
    var oldRouteArr = oldRoute.split(',');
    var oldLength = oldRouteArr.length;
    var oldSource = oldRouteArr[0];
    var oldTarget = oldRouteArr[oldLength-1];

    //var url = '/ZWave.zway/Run/devices[1].AssignPriorityReturnRoute(63,%20255,255,255,255)';
    var routeString = oldTarget+',255,255,255,255';
    var textSuccess = ch_utils.buildMessage(15, oldRoute);

    execRoute(oldSource, routeString, textSuccess);
} //deleteRoute

function setRoute(newRoute) {
    var newRouteArr = newRoute.split(',');
    var newLength = newRouteArr.length;
    var newSource = newRouteArr[0];
    var newTarget = newRouteArr[newLength-1];

    var enteredRoute = prompt(ch_utils.buildMessage(12), newRoute);
    if (!enteredRoute) {return;}

    var enteredRouteArr = enteredRoute.split(',');
    var enteredLength = enteredRouteArr.length;

    if (enteredLength < 2) {ch_utils.alertMessage(13, 1); return;}
    if (enteredLength > 6) {ch_utils.alertMessage(13, 2); return;}
    var enteredSource = enteredRouteArr[0];
    var enteredTarget = enteredRouteArr[enteredLength-1];

    if (enteredSource !== newSource) {ch_utils.alertMessage(13, 3); return;}
    if (enteredTarget !== newTarget) {ch_utils.alertMessage(13, 4); return;}

    //var url = '/ZWave.zway/Run/devices[1].AssignPriorityReturnRoute(63,%2025,0,0,0)';
    var routeString = enteredTarget;
    for (var i = 1; i <= HOPS; i++) {
        if ( i < enteredLength-1) {
            if (enteredRouteArr[i] === enteredSource) {ch_utils.alertMessage(13, 5); return;}
            if (enteredRouteArr[i] === enteredTarget) {ch_utils.alertMessage(13, 6); return;}
            if (typeof nodeList[i] === undefined) {ch_utils.alertMessage(13, 7); return;}
            routeString += ','+enteredRouteArr[i];
        } else {
            routeString += ',0';
        }
    }
    var textSuccess = ch_utils.buildMessage(14, enteredRoute);

    execRoute(enteredSource, routeString, textSuccess);
} //setRoute

function execRoute(enteredSource, routeString, textSuccess) {
    var url = '/ZWave.zway/Run/devices['+enteredSource+'].AssignPriorityReturnRoute('+routeString+')';
    console.log(url);
    //alert(url);
    ch_utils.ajax_put(url, null, success, fail);

    function success(data) {
        console.log(data);
        console.log(textSuccess);
        alert(textSuccess);
    } //success
   
    function fail(status, text) {
        console.log(status+': '+text);
        alert(status+': '+text);
    } //fail
} //execRoute

function scrollUp(flag) {
    if (flag) { document.getElementById('json-renderer').scrollTop = 0; }
} //scrollUp
