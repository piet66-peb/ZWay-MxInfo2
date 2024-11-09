
//h-------------------------------------------------------------------------------
//h
//h Name:         Routes.html.js
//h Type:         Javascript module
//h Purpose:      Display theoretical possible routes for module MxInfo2
//h               Source: 'http://<ip>:8083/ZWaveAPI/Data/0'
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.8 2024-11-09/peb
//v History:      V1.0 2019-02-19/peb first version
//v               V1.3 2020-05-15/peb [+] priority routes
//v               V1.4 2020-05-16/peb [+] last used/failed routes
//h Copyright:    (C) piet66 2018
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals $, sorttable, ch_utils */
/*jshint elision: true */
/*jshint scripturl: true */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Routes.html.js';
var VERSION='V1.8';
var WRITTEN='2024-11-09/peb';

//------
//b Data
//------
var ixButtonTextBase = 0;
var ix_selectTexts = 0;
var messageFormats = [
    {
        de: '{0}',
        en: '{0}'
    },
    {
        de: '{0} hat keine Nachbarknoten',
        en: '{0} has no neighbouring nodes'
    },
    {
        de: 'Konfigurationsdaten werden gelesen...',
        en: 'Reading configuration data...'
    },
    {
        de: 'Knoten',
        en: 'Nodes'
    },
    {
        de: 'Routen',
        en: 'Route List'
    },
    {
        de: 'Bitte einen Sender und einen Empfänger auswählen!',
        en: 'Please select a sender and a receiver!'
    },
    {
        de: 'Bitte unterschiedliche Sender und Empfänger auswählen!',
        en: 'Please select different sender receiver!'
    },
    {
        de: 'Sender:',
        en: 'Sender:'
    },
    {
        de: 'Empfänger:',
        en: 'Receiver:'
    },
    {
        de: 'Keine Auswahl',
        en: 'Nothing selected'
    },
    {
        de: 'Max. Knotenzahl per Route:',
        en: 'Max. nodes per route:'
    },
    {
        de: 'Alle Geräte ({0}) und ihre direkten Nachbarn',
        en: 'All devices ({0}) and their direct neighbours'
    },
    {
        de: 'Wegliste wird erstellt...',
        en: 'Building Route list...'
    },
    {
        de: 'Liste der theoretisch mögliche Wege, hin: {0}, zurück: {1}',
        en: 'List of theoretically possible routes, there: {0}, back: {1}'
    },
    {
        de: 'Liste der theoretisch mögliche Wege (nach Abbruch), hin: {0}, zurück: {1}',
        en: 'List of theoretically possible routes (after break), there: {0}, back: {1}'
    },
    {//15
        de: 'Auswahl Geräte:',
        en: 'Select Devices:'
    },
    {
        de: ' -- *)',
        en: ' -- *)'
    },
    {
        de: 'Kommunikationswege',
        en: 'Routes'
    },
    {
        de: 'Auch für Routing nicht geeignete Wege -- *):',
        en: 'Also ways not proper for routing -- *):'
    },
    {
        de: 'Aktuelle Routen werden gelesen...',
        en: 'Reading last used routes...'
    },
    {
        de: 'Statistik',
        en: "Statistics"
    },
    {
        de: 'Source',
        en: 'Source'
    },
    {
        de: 'Target',
        en: 'Target'
    },
    {
        de: 'Benutzte Routen',
        en: 'Used Routes'
    },
    {
        de: 'Pakete',
        en: 'Packets'
    },
    {
        de: 'Fehler Routen',
        en: 'Failed Routes'
    },
    {
        de: 'Pakete',
        en: 'Packets'
    },
    {
        de: 'Weitere Routen',
        en: 'Further Routes'
    },
    {
        de: 'Pakete',
        en: 'Packets'
    },
    {
        de: 'Nicht Angekommen',
        en: 'Not Delivered'
    },
    {
        de: 'Pakete',
        en: 'Packets'
    },
    {
        de: 'Statistik über alle Routen',
        en: 'Statistics over all routes'
    },
    {
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
];

    var vData = {};
    var devSenderSelected;
    //var devSenderSelectedOld = -1;
    var devReceiverSelected;
    //var devReceiverSelectedOld = -1;
    var nodeTree;
    var nodeList;
    var nodeNeighbors;
    var nodeTreeReverse;
    var routeArray = [];
    var routeArray2 = [];
    var routeArrayDisp = [];
    var routeArray2Disp = [];
    var nodesArray = [];
    var maxNodes = 3;
    var breakBuild;
    var countNodes;
    var rendererWidth = 32;

    var priorityRoutes;
    var lastUsedRoutes;
    var lastFailedRoutes;
    var furtherUsedRoutes;
    var notDeliveredRoutes;

    var lastUsedRoutesCount;
    var lastFailedRoutesCount;
    var furtherUsedRoutesCount;
    var notDeliveredRoutesCount;

    var usedRouteArray = [];

    var statistics = {};
    var statisticsHTML = '';

    var collapsed = true;
    var rootCollapsable = false;
    var clickMark = '_click_';
    var styleMark = '_style_';

    var classArray = {};
//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    boxVisible('json-renderer6', false);
    boxVisible('json-renderer1', false);
    boxVisible('json-renderer2', false);
    boxVisible('json-renderer3', false);
    boxVisible('json-renderer4', false);
    boxVisible('json-renderer0', true);
    boxVisible('json-renderer5', true);

    //------- data definitions -------------------------

    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    var packetsURL = '/ZWave.zway/PacketLog';
    var sourceURL  = '/ZWaveAPI/Data/0';
    ch_utils.displayMessage(0, sourceURL);

    //------- program code -------------------------

    langTexts();
    readZWaveClasses();
    usedRoutes(packetsURL);
    readAndPrint(sourceURL);

    document.getElementById('selSender').addEventListener('click', function() {
        devSenderSelected = this.value;
        if (devSenderSelected === '') {
            devSenderSelected = undefined;
        }
    }, true);

    document.getElementById('selReceiver').addEventListener('click', function() {
        devReceiverSelected = this.value;
        if (devReceiverSelected === '') {
            devReceiverSelected = undefined;
        }
    }, true);

    $('#neigbours').click(function() {
        //sleep to update screen:
        setTimeout(function () {printNodeListT();}, 10);
    });

    $('#routelist').click(function() {
        if (devSenderSelected === undefined || devReceiverSelected === undefined) {
            ch_utils.displayMessage(5);
            return;
        }
        if (devSenderSelected === devReceiverSelected) {
            ch_utils.displayMessage(6);
            return;
        }
        ch_utils.displayMessage(12);
        //sleep to update screen:
        setTimeout(function () {buildPrintRoutes();}, 10);
    });

    document.getElementById('statistics').addEventListener('click', function() {
        //build statistics html
        buildHtmlStatistics();

        printHTML(statisticsHTML, 31);
    });

}); //document).ready

    //------- function definitions -------------------------

    function readZWaveClasses() {
        var fil = 'data/zwave_classes.csv';
        ch_utils.displayMessage(18, fil, '');

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //build class array
            buildClassArray(data);
        }
     } //readZWaveClasses

    function buildClassArray(classDataCSV) {
        var allRows = classDataCSV.split(/\r?\n|\r/);
        classArray = {};
        for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
            var rowCells = allRows[singleRow].split(',');
            var classIdHex = rowCells[0];
            var classId    = parseInt(classIdHex, 16);
            var className  = rowCells[2];
            if (! classArray.hasOwnProperty(classId)) {
                classArray[classId] = className;
            }
        }
    } //buildClassArray

    function langTexts() {
        document.title = ch_utils.buildMessage(17);
        ch_utils.buttonText('neigbours', 3);
        ch_utils.buttonText('routelist', 4);
        ch_utils.buttonText('label1', 7);
        ch_utils.buttonText('label2', 8);
        ch_utils.buttonText('label3', 10);
        ch_utils.displayText('title1', 15);
        ch_utils.buttonText('label4', 18);
        ch_utils.buttonText('statistics', 20);
    }

    function usedRoutes(fil) {
        ch_utils.displayMessage(19);

        //read file
        ch_utils.ajax_get(fil, success);
        function success (buffer) {
            //build routes lists
            buildRoutesLists(buffer.data);
        }
    } //usedRoutes

    function buildRoutesLists(packets) {
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

        function furtherRouteArray(routeString) {
            if (routeString.replace(/[^,]/g,"").length <= 1) {return false;}
            //alert(routeString);

            var nodeArr = routeString.split(",");
            for (var i = 0; i < nodeArr.length - 1; i++) {
                for (var j = i+1; j < nodeArr.length; j++) {
                    if (i !== 0 || j !== nodeArr.length - 1) {
                        var str = nodeArr[i];
                        var source = nodeArr[i];
                        var target = nodeArr[j];
                //if (nodesArray.hasOwnProperty(source) &&  nodesArray.hasOwnProperty(target)) {
                        for (var k = i+1; k <= j; k++) {
                            str += ','+nodeArr[k];
                        }
                        if (furtherUsedRoutesCount.hasOwnProperty(str)) {
                            furtherUsedRoutesCount[str] += 1;
                        } else {
                            if (! furtherUsedRoutes.hasOwnProperty(source)) {
                                furtherUsedRoutes[source] = {};
                            }
                            if (! furtherUsedRoutes[source].hasOwnProperty(target)) {
                                furtherUsedRoutes[source][target] = [];
                            }
                            furtherUsedRoutes[source][target].push(str);
                            furtherUsedRoutesCount[str] = 1;
                        }
                    }
                    //}
                }
            }
            return true;
        }

        var count1 = 0;
        var count2 = 0;
        var count3 = 0;
        var source, target, lastFailPath, hopsDelivered, hopsNotDelivered;
        lastUsedRoutes = {1 : {}};
        lastFailedRoutes = {1 : {}};
        furtherUsedRoutes = {};
        notDeliveredRoutes = {1 : {}};
        lastUsedRoutesCount = {};
        lastFailedRoutesCount = {};
        furtherUsedRoutesCount = {};
        notDeliveredRoutesCount = {};
        Object.keys(packets).forEach(function(packet, ix) {
            if (packet) {
                if (packets[packet].hasOwnProperty('delivered')) {
                    source = 1;
                    target = packets[packet].nodeId;
                    lastFailPath = routeString(source, target, packets[packet].lastFailPath, true);
                    if (lastFailPath !== '') {
                       if (lastFailedRoutesCount.hasOwnProperty(lastFailPath)) {
                            lastFailedRoutesCount[lastFailPath] += 1;
                        } else {
                            if (! lastFailedRoutes[source].hasOwnProperty(target)) {
                                lastFailedRoutes[source][target] = [];
                            }
                            lastFailedRoutes[source][target].push(lastFailPath);
                            lastFailedRoutesCount[lastFailPath] = 1;
                        }

                    }
                    if (packets[packet].delivered === true) {
                        count1 += 1;
                        hopsDelivered = routeString(source, target, packets[packet].hops, false);
                        if (lastUsedRoutesCount.hasOwnProperty(hopsDelivered)) {
                            lastUsedRoutesCount[hopsDelivered] += 1;
                        } else {
                            if (! lastUsedRoutes[source].hasOwnProperty(target)) {
                                lastUsedRoutes[source][target] = [];
                            }
                            lastUsedRoutes[source][target].push(hopsDelivered);
                            lastUsedRoutesCount[hopsDelivered] = 1;
                        }

                        furtherRouteArray(hopsDelivered);

                    } else {
                        count2 += 1;
                        hopsNotDelivered = routeString(source, target, packets[packet].hops, false);
                        if (notDeliveredRoutesCount.hasOwnProperty(hopsNotDelivered)) {
                            notDeliveredRoutesCount[hopsNotDelivered] += 1;
                        } else {
                            if (! notDeliveredRoutes[source].hasOwnProperty(target)) {
                                notDeliveredRoutes[source][target] = [];
                            }
                            notDeliveredRoutes[source][target].push(hopsNotDelivered);
                            notDeliveredRoutesCount[hopsNotDelivered] = 1;
                        }
                    }
                } else {
                    count3 += 1;
                    target = 1;
                    source = packets[packet].nodeId;

                    hopsDelivered = routeString(source, target, packets[packet].hops, false);
                    if (lastUsedRoutesCount.hasOwnProperty(hopsDelivered)) {
                        lastUsedRoutesCount[hopsDelivered] += 1;
                    } else {
                        if (! lastUsedRoutes[source]) {
                            lastUsedRoutes[source] = {};
                        }
                        if (! lastUsedRoutes[source].hasOwnProperty(target)) {
                            lastUsedRoutes[source][target] = [];
                        }
                        lastUsedRoutes[source][target].push(hopsDelivered);
                        lastUsedRoutesCount[hopsDelivered] = 1;
                    }

                    furtherRouteArray(hopsDelivered);

                }
            }
        });
        //alert(count1+' '+count2+' '+count3);
        //alert(JSON.stringify(lastUsedRoutes));
        //alert(JSON.stringify(lastUsedRoutesCount));
        //alert(JSON.stringify(notDeliveredRoutes));
        //alert(JSON.stringify(furtherUsedRoutes));
        //alert(JSON.stringify(furtherUsedRoutesCount));

    } //buildRoutesLists

    function buildStatistics(nodeTree) {
        //build empty statistics object
        statistics = {};
        Object.keys(nodeTree).forEach(function(source, ix) {
            statistics[source] = {};
            Object.keys(nodeTree).forEach(function(target, ix) {
                if (target !== source) {
                    statistics[source][target] = {};
                }
            });
        });

        //enter used routes
        Object.keys(lastUsedRoutes).forEach(function(source, ix) {
            Object.keys(lastUsedRoutes[source]).forEach(function(target, ix) {
                var arr = lastUsedRoutes[source][target];
                var i;
                var sum_routecount = 0;
                var sum_packetcount = 0;
                for (i = 0; i < arr.length; i++) {
                    sum_routecount += 1;
                    sum_packetcount += lastUsedRoutesCount[arr[i]];
                }
                try {
                statistics[source][target].used_routecount = sum_routecount;
                statistics[source][target].used_packetcount = sum_packetcount;
                } catch (err) {
                    var y = 1; //alert(source+' '+target);
                }
            });
        });

        //enter failed routes
        Object.keys(lastFailedRoutes).forEach(function(source, ix) {
            Object.keys(lastFailedRoutes[source]).forEach(function(target, ix) {
                var arr = lastFailedRoutes[source][target];
                var i;
                var sum_routecount = 0;
                var sum_packetcount = 0;
                for (i = 0; i < arr.length; i++) {
                    sum_routecount += 1;
                    sum_packetcount += lastFailedRoutesCount[arr[i]];
                }
                try {
                statistics[source][target].failed_routecount = sum_routecount;
                statistics[source][target].failed_packetcount = sum_packetcount;
                } catch (err) {
                    var y = 1; //alert(source+' '+target);
                }
            });
        });

        //enter further routes
        Object.keys(furtherUsedRoutes).forEach(function(source, ix) {
            Object.keys(furtherUsedRoutes[source]).forEach(function(target, ix) {
                var arr = furtherUsedRoutes[source][target];
                var i;
                var sum_routecount = 0;
                var sum_packetcount = 0;
                for (i = 0; i < arr.length; i++) {
                    sum_routecount += 1;
                    sum_packetcount += furtherUsedRoutesCount[arr[i]];
                }
                try {
                statistics[source][target].further_routecount = sum_routecount;
                statistics[source][target].further_packetcount = sum_packetcount;
                } catch (err) {
                    var y = 1; //alert(source+' '+target);
                }
            });
        });

        //enter not delivered routes
        Object.keys(notDeliveredRoutes).forEach(function(source, ix) {
            Object.keys(notDeliveredRoutes[source]).forEach(function(target, ix) {
                var arr = notDeliveredRoutes[source][target];
                var i;
                var sum_routecount = 0;
                var sum_packetcount = 0;
                for (i = 0; i < arr.length; i++) {
                    sum_routecount += 1;
                    sum_packetcount += notDeliveredRoutesCount[arr[i]];
                }
                try {
                statistics[source][target].notdelivered_routecount = sum_routecount;
                statistics[source][target].notdelivered_packetcount = sum_packetcount;
                } catch (err) {
                    var y = 1; //alert(source+' '+target);
                }
            });
        });

        //alert(JSON.stringify(statistics));

        //build statistics html
        //buildHtmlStatistics();

    } //buildStatistics

    function view(number) {
        if (number > 0) {return number;}
        return '';
    }

    function buildHtmlStatistics(){
        var sourceT = ch_utils.buildMessage(21);
        var targetT = ch_utils.buildMessage(22);
        var used_routecountT = ch_utils.buildMessage(23);
        var used_packetcountT = ch_utils.buildMessage(24);
        var failed_routecountT = ch_utils.buildMessage(25);
        var failed_packetcountT = ch_utils.buildMessage(26);
        var further_routecountT = ch_utils.buildMessage(27);
        var further_packetcountT = ch_utils.buildMessage(28);
        var notdelivered_routecountT = ch_utils.buildMessage(29);
        var notdelivered_packetcountT = ch_utils.buildMessage(30);

        statisticsHTML =  '<table id="indextable" class="sortable">';
        statisticsHTML += '<thead><tr>';
        statisticsHTML += '<th id="sourceT">'+sourceT+'</th>';
        statisticsHTML += '<th id="targetT">'+targetT+'</th>';
        statisticsHTML += '<th id="used_routecountT">'+used_routecountT+'</th>';
        statisticsHTML += '<th id="used_packetcountT">'+used_packetcountT+'</th>';
        statisticsHTML += '<th id="failed_routecountT">'+failed_routecountT+'</th>';
        statisticsHTML += '<th id="failed_packetcountT">'+failed_packetcountT+'</th>';
        statisticsHTML += '<th id="further_routecountT">'+further_routecountT+'</th>';
        statisticsHTML += '<th id="further_packetcountT">'+further_packetcountT+'</th>';
        statisticsHTML += '<th id="notdelivered_routecountT">'+notdelivered_routecountT+'</th>';
        statisticsHTML += '<th id="notdelivered_packetcountT">'+notdelivered_packetcountT+'</th>';
        statisticsHTML += '</tr></thead>';

        statisticsHTML += '<tbody>';
        Object.keys(statistics).forEach(function(source, ix) {
            if (!devSenderSelected || source === devSenderSelected) {
            Object.keys(statistics[source]).forEach(function(target, ix) {
                if (!devReceiverSelected || target === devReceiverSelected) {
                var obj = statistics[source][target];
                if (obj.used_routecount > 0 ||
                    obj.failed_routecount > 0 ||
                    obj.further_routecount > 0 ||
                    obj.notdelivered_routecount > 0) {
                    statisticsHTML += '<tr>';
                    statisticsHTML += '<td headers="sourceT" align=center>'+source+'</td>';
                    statisticsHTML += '<td headers="targetT" align=center>'+target+'</td>';
                    statisticsHTML += '<td headers="used_routecountT" align=center>'+view(obj.used_routecount)+'</td>';
                    statisticsHTML += '<td headers="used_packetcountT" align=center>'+view(obj.used_packetcount)+'</td>';
                    statisticsHTML += '<td headers="failed_routecountT" align=center>'+view(obj.failed_routecount)+'</td>';
                    statisticsHTML += '<td headers="failed_packetcountT" align=center>'+view(obj.failed_packetcount)+'</td>';
                    statisticsHTML += '<td headers="further_routecountT" align=center>'+view(obj.further_routecount)+'</td>';
                    statisticsHTML += '<td headers="further_packetcountT" align=center>'+view(obj.further_packetcount)+'</td>';
                    statisticsHTML += '<td headers="notdelivered_routecountT" align=center>'+view(obj.notdelivered_routecount)+'</td>';
                    statisticsHTML += '<td headers="notdelivered_packetcountT" align=center>'+view(obj.notdelivered_packetcount)+'</td>';
                    statisticsHTML += '</tr>';
                }
                }
            });
            }
        });
        statisticsHTML += '</tbody>';
        statisticsHTML += '<tfoot>';
        statisticsHTML += '</tfoot></table>';
    } //buildHtmlStatistics

    function readAndPrint(fil) {
        ch_utils.displayMessage(2);

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //get data
            vData = data;

            //build node list
            buildNodeTree(vData.devices);

            //build statistics
            buildStatistics(nodeTree);

            //print
            printNodeList();

            //build select arrays
            buildSelectBoxSender(nodeTree);
            buildSelectBoxReceiver(nodeTree);
        }
     } //readAndPrint

    function buildNodeTree(devices) {
        nodeTree = {};
        nodeList = {};
        nodeNeighbors = {};
        nodeTreeReverse = {};
        priorityRoutes = {};

        var givenName, isListening, isRouting, neighbours, updateTime, nodeInfoFrame;
        Object.keys(devices).forEach(function(device, ix) {
            var devData = devices[device].data;
            givenName = devData.givenName.value || '';
            isListening = devData.isListening.value;
            isRouting = devData.isRouting.value;
            neighbours = devData.neighbours.value;
            updateTime = devData.neighbours.updateTime;
            nodeInfoFrame = devData.nodeInfoFrame.value.sort(function(a, b){return a-b;});

            if (device === '1') {
                givenName = 'ZWay Controller';
            }
            nodeTree[device] = {givenName: givenName,
                                updateTime: updateTime,
                                isListening: isListening,
                                isRouting: isRouting,
                                neighbours: neighbours};

            if (nodeTreeReverse[device] === undefined) {
                nodeTreeReverse[device] = {givenName: givenName,
                                           isListening: isListening,
                                           isRouting: isRouting};
            } else {
                nodeTreeReverse[device].givenName = givenName;
                nodeTreeReverse[device].isListening = devData.isListening.value;
                nodeTreeReverse[device].isRouting = devData.isRouting.value;
            }

console.log(device);            
            neighbours.forEach(function(node, ix) {
console.log('node='+node);            
                if (nodeTreeReverse[node] === undefined) {
                    nodeTreeReverse[node] = {neighbours: [device*1]};
                } else {
                    if (nodeTreeReverse[node].neighbours === undefined) {
                        nodeTreeReverse[node].neighbours = [device*1];
                    } else {
                        nodeTreeReverse[node].neighbours.push(device*1);
                    }
                }
            });

            nodeList[device] = givenName;
            nodeList[device+clickMark] = "javascript:dispNeighbours("+device+");";

            nodeNeighbors[device] = {node: device+': '+givenName,
                                     updateTime: updateTime +' = '+ch_utils.userTime(updateTime),
                                     neighbours: neighbours,
                                     nodeInfoFrame: nodeInfoFrame};

            nodeNeighbors[device].neighbours.forEach( function(neighbor, ix) {
                if (neighbor === 1) {
                    nodeNeighbors[device].neighbours[ix] = '1: ZWay Controller';
                } else
                //if (devices[neighbor].data.givenName.value) {
                if (devices[neighbor]) {
                    nodeNeighbors[device].neighbours[ix] =
                        neighbor +': '+ devices[neighbor].data.givenName.value;
                } else {
                    nodeNeighbors[device].neighbours[ix] =
                        neighbor +': undefined';
                }
            });

            nodeNeighbors[device].nodeInfoFrame.forEach( function(classId, ix) {
                nodeNeighbors[device].nodeInfoFrame[ix] =
                    classId +': '+ classArray[classId];
            });

            var priRoutes = devData.priorityRoutes;
            //if (devData.hasOwnProperty(priorityRoutes)) {
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
                        }
                    }
                });
            //}
        });
        //alert(JSON.stringify(priorityRoutes));
        //alert(JSON.stringify(nodeTree));
        countNodes = Object.keys(nodeTree).length;
    } //buildNodeTree

    function printNodeList() {
        boxVisible('json-renderer6', false);
        boxVisible('json-renderer1', false);
        boxVisible('json-renderer2', false);
        boxVisible('json-renderer3', false);
        boxVisible('json-renderer4', false);
        boxVisible('json-renderer0', true);
        boxVisible('json-renderer5', true);
        ch_utils.displayMessage(11, countNodes);
        printJSON0(nodeList, collapsed);
    } //printNodeList

    //node list (left)
    function printJSON0(routeData, collapsed) {
        $('#json-renderer0').jsonViewer(routeData, {
            collapsed: collapsed,
            rootCollapsable: rootCollapsable,
            withQuotes: false,
            withLinks: true,
            clickable: clickMark,
            styleTag: styleMark
        });
    } //printJSON0

    //neighbour list (right)
    function printJSON5(routeData, collapsed) {
        $('#json-renderer5').jsonViewer(routeData, {
            collapsed: collapsed,
            rootCollapsable: false,
            withQuotes: false,
        });
    } //printJSON6

    function printJSON1(routeData, collapsed) {
        $('#json-renderer1').jsonViewer(routeData, {
            collapsed: collapsed,
            rootCollapsable: rootCollapsable,
            withQuotes: false
        });
    } //printJSON1

    function printJSON2(routeData, collapsed) {
        $('#json-renderer2').jsonViewer(routeData, {
            collapsed: collapsed,
            rootCollapsable: rootCollapsable,
            withQuotes: false
        });
    } //printJSON2

    function printJSON3(routeData, collapsed) {
        $('#json-renderer3').jsonViewer(routeData, {
            collapsed: collapsed,
            rootCollapsable: rootCollapsable,
            withQuotes: false
        });
    } //printJSON3

    function printJSON4(routeData, collapsed) {
        $('#json-renderer4').jsonViewer(routeData, {
            collapsed: collapsed,
            rootCollapsable: rootCollapsable,
            withQuotes: false,
            styleTag: styleMark
        });
    } //printJSON3

    function buildSelectBoxSender (nodeTree) {
        var elId;
        var i;
        var option;

        elId = document.getElementById('selSender');
        i = 0;
        option = new Option(ch_utils.buildMessage(9), '');
        elId.options[i++] = option;
        Object.keys(nodeTree).forEach(function(device, ix) {
            option = new Option(device+': '+nodeTree[device].givenName, device);
            elId.options[i++] = option;
            nodesArray.push(device+': '+nodeTree[device].givenName);
        });
    } //buildSelectBoxSender

    function buildSelectBoxReceiver (nodeTree) {
        var elId;
        var i;
        var option;

        elId = document.getElementById('selReceiver');
        i = 0;
        option = new Option(ch_utils.buildMessage(9), '');
        elId.options[i++] = option;
        Object.keys(nodeTree).forEach(function(device, ix) {
            option = new Option(device+': '+nodeTree[device].givenName, device);
            elId.options[i++] = option;
        });
    } //buildSelectBoxReceiver

    function buildUsedRoutes(routeArray, routeArrayCount, devSenderSelected, devReceiverSelected) {
        var routeArr = [];

        if (routeArray.hasOwnProperty(devSenderSelected)) {
            if (routeArray[devSenderSelected].hasOwnProperty(devReceiverSelected)) {
                var arr = routeArray[devSenderSelected][devReceiverSelected];
                for (var i = 0; i < arr.length; i++) {
                    routeArr.push(routeArrayCount[arr[i]] + ': ' + arr[i]);
                }
                //routeArr.sort().reverse();
                routeArr.sort(function(x,y){
                    var xp = x.replace(/:.*$/, '')*1;
                    var yp = y.replace(/:.*$/, '')*1;
                    return xp < yp;
                });
            }
        }
        return routeArr;
    } //buildUsedRoutes

    function buildRoutes(deviceList, devSenderSelected, devReceiverSelected) {
        var routeArr = [];
        breakBuild = true;
        var routeString;
        var currNode;
        var nextNode;
        var lastNode;
        var res;
        maxNodes = document.getElementById("maxNodes").value;

        function getNextNode(currNode, lastNode) {
            var neigh = deviceList[currNode].neighbours;
            var ret;
            var node;
            var start = 0;
            var i;
            if (lastNode !== undefined)  {
                for (i = 0; i < neigh.length; i++) {
                    node = neigh[i];
                    if (node === lastNode*1) {
                        start = i + 1;
                        break;
                    }
                }
            }
            for (i = start; i < neigh.length; i++) {
                node = neigh[i];
                if (node !== currNode && (','+routeString+',').indexOf(','+node+',') === -1 &&
                    (node === devReceiverSelected ||
                    (deviceList[node].isListening && deviceList[node].isRouting))) {
                    routeString += ','+node;
                    ret = node;
                    break;
                }
            }
            return ret;
        } //getNextNode

        //get first route
        currNode = devSenderSelected;
        routeString = devSenderSelected+'';
        while (currNode !== undefined && currNode !== devReceiverSelected) {
            nextNode = getNextNode(currNode, lastNode, routeString);
            currNode = nextNode;
            res = routeString.split(",");
            if (res.length >= maxNodes) {
                break;
            }
        }
        res = routeString.split(",");
        if (res[res.length-1]*1 === devReceiverSelected*1) {
            routeArr.push(routeString);
        }

        //loop
        var len;
        var pos;
        do {
            var routeStringOld = routeString;
            pos = routeString.lastIndexOf(',');
            res = routeString.split(",");
            len = res.length;
            if (len === 1) {break;}
            lastNode = res[len-1];
            currNode = res[len-2];
            routeString = routeString.substr(0,pos);

            while (currNode !== undefined && currNode !== devReceiverSelected) {
                nextNode = getNextNode(currNode, lastNode, routeString);
                currNode = nextNode;
                lastNode = undefined;
                res = routeString.split(",");
                if (res.length >= maxNodes) {
                    break;
                }
            }
            res = routeString.split(",");
            if (res[res.length-1]*1 === devReceiverSelected*1) {
                routeArr.push(routeString);
            }
            if (routeString === routeStringOld) {break;}
        } while(true);
        breakBuild = false;
        return routeArr;
    } //buildRoutes

    function printRoutes() {
        boxVisible('json-renderer1', true);
        boxVisible('json-renderer2', true);
        boxVisible('json-renderer3', true);
        boxVisible('json-renderer4', true);
        boxVisible('json-renderer0', false);
        boxVisible('json-renderer5', false);
        boxVisible('json-renderer6', false);
        document.getElementById("json-renderer1").style.width  = (rendererWidth-13)+"%";
        document.getElementById("json-renderer4").style.width  = (rendererWidth-13)+"%";
        document.getElementById("json-renderer2").style.width = (rendererWidth-13)+"%";
        document.getElementById("json-renderer3").style.width = (rendererWidth+8)+"%";
        if (breakBuild) {
            ch_utils.displayMessage(14, routeArray.length, routeArray2.length);
        } else {
            ch_utils.displayMessage(13, routeArray.length, routeArray2.length);
        }

        var emptyArray = [,];
        routeArrayDisp = ['priority route:'];
        var route;
        if (priorityRoutes[devSenderSelected]) {
            route = priorityRoutes[devSenderSelected][devReceiverSelected];
            if (route) {
                routeArrayDisp.push((route));
            }
        }
        routeArrayDisp = routeArrayDisp.concat((emptyArray));
        routeArrayDisp.push('theoretical routes:');
        routeArrayDisp = routeArrayDisp.concat((routeArray));

        routeArray2Disp = ['priority route:'];
        if (priorityRoutes[devReceiverSelected]) {
            route = priorityRoutes[devReceiverSelected][devSenderSelected];
            if (route) {
                routeArray2Disp.push((route));
            }
        }
        routeArray2Disp = routeArray2Disp.concat((emptyArray));
        routeArray2Disp.push('theoretical routes:');
        routeArray2Disp = routeArray2Disp.concat((routeArray2));

        printJSON1(routeArrayDisp);
        printJSON4(usedRouteArray);
        printJSON2(routeArray2Disp);
        printJSON3(nodesArray);
    } //printRoutes

    function printEmptyRoutes(nodeNumber) {
        boxVisible('json-renderer1', true);
        boxVisible('json-renderer2', true);
        boxVisible('json-renderer3', true);
        boxVisible('json-renderer4', true);
        boxVisible('json-renderer0', false);
        boxVisible('json-renderer5', false);
        boxVisible('json-renderer6', false);
        document.getElementById("json-renderer1").style.width  = (rendererWidth-13)+"%";
        document.getElementById("json-renderer4").style.width  = (rendererWidth-13)+"%";
        document.getElementById("json-renderer2").style.width = (rendererWidth-13)+"%";
        document.getElementById("json-renderer3").style.width = (rendererWidth+8)+"%";
        ch_utils.displayMessage(1, nodeNumber);
        printJSON1(routeArray);
        printJSON4(usedRouteArray);
        printJSON2(routeArray2);
        printJSON3(nodesArray);
    } //printEmptyRoutes

    //statistics (completer page)
    function printHTML(dataBuffer, messNo, messAdd) {
        ch_utils.displayMessage(messNo, messAdd);
        boxVisible('json-renderer6', true);
        boxVisible('json-renderer1', false);
        boxVisible('json-renderer2', false);
        boxVisible('json-renderer3', false);
        boxVisible('json-renderer4', false);
        boxVisible('json-renderer0', false);
        boxVisible('json-renderer5', false);
        document.getElementById('json-renderer6').innerHTML = dataBuffer;
        //$('#json-renderer6').html(dataBuffer);
        var el = document.getElementById('indextable');
        sorttable.makeSortable(el);
        scrollUp(true);
    } //printHTML

    function scrollUp(flag) {
        if (flag) { document.getElementById('json-renderer').scrollTop = 0; }
    } //scrollUp

    //execute after timeout
    function printNodeListT() {
        printNodeList();
    } //printNodeListT

    function buildPrintRoutes() {
        var emptyArray = [,];

        usedRouteArray = ['last used routes:'];
        usedRouteArray = usedRouteArray.concat(buildUsedRoutes(lastUsedRoutes, lastUsedRoutesCount, devSenderSelected*1, devReceiverSelected*1));
        usedRouteArray = usedRouteArray.concat(emptyArray);

        usedRouteArray.push('further used routes:');
        usedRouteArray = usedRouteArray.concat(buildUsedRoutes(furtherUsedRoutes, furtherUsedRoutesCount, devSenderSelected*1, devReceiverSelected*1));
        usedRouteArray = usedRouteArray.concat(emptyArray);

        usedRouteArray.push('last failed routes:');
        usedRouteArray = usedRouteArray.concat(buildUsedRoutes(lastFailedRoutes, lastFailedRoutesCount, devSenderSelected*1, devReceiverSelected*1));
        usedRouteArray = usedRouteArray.concat(emptyArray);

        usedRouteArray.push('not delivered routes:');
        usedRouteArray = usedRouteArray.concat(buildUsedRoutes(notDeliveredRoutes, notDeliveredRoutesCount, devSenderSelected*1, devReceiverSelected*1));
        usedRouteArray = usedRouteArray.concat(emptyArray);

        if (nodeTree[devSenderSelected].neighbours.length === 0) {
            routeArray  = [];
            routeArray2 = [];
            printEmptyRoutes(devSenderSelected);
            return;
        }
        if (nodeTree[devReceiverSelected].neighbours.length === 0) {
            routeArray  = [];
            routeArray2 = [];
            printEmptyRoutes(devReceiverSelected);
            return;
        }

        routeArray = buildRoutes(nodeTreeReverse, devSenderSelected*1, devReceiverSelected*1);
        routeArray2 = buildRoutes(nodeTreeReverse, devReceiverSelected*1, devSenderSelected*1);
         compareRouteArrays(routeArray, routeArray2);

        printRoutes();
    } //buildPrintRoutes

    function compareRouteArrays() {
        var checkBox = document.getElementById("myCheck");
        var revString;
        routeArray.forEach(function(entry, ix) {
            revString = entry.split(',').reverse().join();
            if ($.inArray(revString, routeArray2) === -1) {
                if (checkBox.checked === true) {
                    routeArray[ix] += ch_utils.buildMessage(16);
                } else {
                    delete routeArray[ix];
                }
            }
        });
        routeArray = routeArray.filter(function (el) {
            return el !== '';
        });

        routeArray2.forEach(function(entry, ix) {
            revString = entry.split(',').reverse().join();
            if ($.inArray(revString, routeArray) === -1) {
                if (checkBox.checked === true) {
                    routeArray2[ix] += ch_utils.buildMessage(16);
                } else {
                    delete routeArray2[ix];
                }
            }
        });
        routeArray2 = routeArray2.filter(function (el) {
            return el !== '';
        });
    } //compareRouteArrays

    function boxVisible(button_id, isVisible) {
        if (isVisible) {
            $("#"+button_id).show();
        } else {
            $("#"+button_id).hide();
        }
    } //boxVisible

    function dispNeighbours(deviceNum) {
        printJSON5(nodeNeighbors[deviceNum], false);
    } //dispNeighbours
