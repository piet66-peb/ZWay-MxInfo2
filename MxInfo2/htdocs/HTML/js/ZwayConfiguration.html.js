
//h-------------------------------------------------------------------------------
//h
//h Name:         ZwayConfiguration.html.js
//h Type:         Javascript module
//h Purpose:      Display zway configuration and devices for module MxInfo2
//h               Source: 'http://<ip>:8083/ZWaveAPI/Data/0'
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V2.9.0 2024-10-01/peb
//v History:      V1.0   2018-12-15/peb first version
//v               V1.3   2019-09-01/peb [+]class names to node info frames
//v               V1.5   2019-10-11/peb [+]skip invalid devices
//v               V2.0   2020-03-13/peb [+]device reset
//v               V2.8   2021-07-06/peb [x]consider other order in namespaces
//v               V2.9.0 2023-07-01/peb [+]new syntax for class 113 (events)
//h Copyright:    (C) piet66 2018
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals $, ch_utils */
/*jshint evil: true */
/*jshint scripturl: true */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='ZwayConfiguration.html.js';
var VERSION='V2.9.0';
var WRITTEN='2024-10-01/peb';

//----
//Data
//----
var ixButtonTextBase = 0;
var ix_selectTexts = 0;
var messageFormats = [
    {
        de: '{0}',
        en: '{0}'
    },
    {
        de: 'Z-Wave Klassen + Kommandos',
        en: 'Z-Wave Classes + Commands'
    },
    {
        de: 'Konfigurationsdaten werden gelesen...',
        en: 'Reading configuration data...'
    },
    {
        de: 'Änderung von {0} für Gerät {1}',
        en: 'Change of {0} for Device {1}'
    },
    {
        de: '{0} Z-Wave Klassen',
        en: '{0} Z-Wave Classes'
    },
    {
        de: 'Z-Wave Klassen (csv)',
        en: 'Z-Wave Classes (csv)'
    },
    {
        de: 'Z-Wave Kommandos (csv)',
        en: 'Z-Wave Commands (csv)'
    },
    {
        de: 'aktueller Wert: {0}',
        en: 'current value: {0}'
    },
    {
        de: 'Auswahl Gerät: ',
        en: 'Select Device: '
    },
    {
        de: 'Geräteübersicht',
        en: 'Device Survey'
    },
    {
        de: '{0} ist nicht definiert',
        en: '{0} is not defined'
    },
    {
        de: 'Hersteller:',
        en: 'Vendor:'
    },
    {
        de: 'Nummer:',
        en: 'Number:'
    },
    {
        de: 'Name:',
        en: 'Name:'
    },
    {
        de: 'Gerät #{0}',
        en: 'Device #{0}'
    },
    {
        de: "&nbsp;&nbsp;&nbsp;auf eigenes Risiko",
        en: "&nbsp;&nbsp;&nbsp;at own risk"
    },
    {
        de: 'Auswahl Kommandoklasse:',
        en: 'Select Command Class:'
    },
    {
        de: 'Z-Way Konfiguration',
        en: 'Z-Way Configuration'
    },
    {
        de: '{0} wird gelesen...',
        en: 'reading {0}...'
    },
    {
        de: 'Zusammengeklappen',
        en: 'Collapse'
    },
    {
        de: 'Interview nicht komplett für {0}={1}',
        en: 'Interview incomplete for {0}={1}'
    },
    {
        de: 'Neues Interview für device={0} instance={1} class={2}\n{3} >> {4}',
        en: 'New interview for device={0} instance={1} class={2}\n{3} >> {5}'
    },
    {
        de: 'Gerät {0}={1} wurde zurückgesetzt',
        en: 'Device {0}={1} was reset'
    },
    {
        de: 'Absenden',
        en: 'Submit'
    },
    {
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {
        de: 'Hallo {0}, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo {0}, sorry, you have no administrator rights to read the data!'
    },
];

var vData = {};
var devNumKeySelected;
var devNumKeySelectedOld = -1;
var collapsed = true;
var rootCollapsable = false;
var surveyList;
var clickMark = '_click_';
var styleMark = '_style_';
var device_curr, instance_curr, classNo_curr, string_curr, value;
var deviceIDArray;
var vDevIdPre = 'ZWayVDev_zway_';

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {

    //------- data definitions -------------------------

    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    var sourceURL = '/ZWaveAPI/Data/0';
    ch_utils.displayMessage(0, sourceURL);

    var deviceArray = [];
    var classArray;

    //------- program code -------------------------
    langTexts();
    ch_utils.requireAdmin(readZWaveClasses, BasicAuth);

    //------- function definitions -------------------------

    function readZWaveClasses() {
        var fil = 'data/zwave_classes.csv';
        ch_utils.displayMessage(18, fil, '');

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //build class array
            buildClassArray(data);

            //continue reading device Ids
            readDeviceIDs();
        }
     } //readZWaveClasses

    function readDeviceIDs() {
        var fil = '/ZAutomation/api/v1/namespaces';
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
            //continue getting data
            readAndPrint(sourceURL);
        }
     } //readDeviceIDs

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
        ch_utils.buttonText('strippedFile', 1);
        ch_utils.buttonText('classesCSV', 5);
        ch_utils.buttonText('commandsCSV', 6);
        ch_utils.buttonText('classesCSVStore', 11);
        ch_utils.buttonText('commandsCSVStore', 11);
        ch_utils.buttonText('label2', 8);
        ch_utils.buttonText('textCollapse', 19);

        var el = document.getElementById("collapseCheckbox");
        if (el) {
            el.checked = collapsed;
        }
        ch_utils.buttonVisible('collapseCheckbox', false);
        ch_utils.buttonVisible('textCollapse', false);
    }

    function readAndPrint(fil) {
        ch_utils.displayMessage(2);

        //read file
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //get data
            vData = data;

            //build surveyList
            buildSurveyList(vData);
            printSurvey();

            //build select arrays
            buildSelectBoxDevTitle(surveyList);
            buildSelectArrays(vData);
        }
     } //readAndPrint

    function sortObj(obj) {
        return Object.keys(obj).sort().reduce(
            function (result, key) {
                result[key] = obj[key];
                return result;
            }, {});
    }

    function buildSurveyList(vData) {
        surveyList = {};
        var devices = vData.devices;
        var givenName;
        surveyList["0"] = 'Controller Info';
        surveyList["0"+clickMark] = "javascript:printDevice('0');";
        Object.keys(devices).forEach(function(device, ix) {
            if (device) {
                var devData = devices[device].data;

                //reorder data part
                vData.devices[device].data = sortObj(devData);

                if (device === '1') {
                    givenName = devData.givenName.value || 'Z-Way';
                } else {
                    givenName = devData.givenName.value || '';
                }
                surveyList[device] = givenName;
                surveyList[device+clickMark] = "javascript:printDevice('"+device+"');";

            }
        });
    } //buildSurveyList

    function buildSelectArrays(vData) {
        var devices = vData.devices;
        var givenName;
        Object.keys(devices).forEach(function(device, ix) {
          try  {
            var add = '';

            var devData = devices[device].data;
            var lastSendTime = devData.lastSend.updateTime;
            devData.lastSend.updateTime = lastSendTime+' '+ch_utils.userTime(lastSendTime);
            var lastReceivedTime = devData.lastReceived.updateTime;
            devData.lastReceived.updateTime = lastReceivedTime+' '+ch_utils.userTime(lastReceivedTime);

            //add class name to NIF
            var nif = devData.nodeInfoFrame.value.sort(function(a, b){return a-b;});
            var nif_old = '';
            var nif_style = {};
            var nif_double = false;
            nif.forEach(function(classId, ix)  {
                nif[ix] = classId+' '+classArray[classId];
                if (nif_old === nif[ix]) {
                    nif_style[ix] = 'color:red; font-weight:bold;';
                    nif_double = true;
                }
                nif_old = nif[ix];
            });
            if (nif_double) {
                devData.nodeInfoFrame['value'+styleMark] = nif_style;
            }

            var lastNifTime = devData.nodeInfoFrame.updateTime;
            devData.nodeInfoFrame.updateTime = lastNifTime+' '+ch_utils.userTime(lastNifTime);

            //add device name to neighbours
            var neighbours = devData.neighbours.value;
            neighbours.forEach(function(neighbourNo, ix)  {
                neighbours[ix] = neighbourNo+' '+surveyList[neighbourNo];
            });
            var lastNeighbourTime = devData.neighbours.updateTime;
            devData.neighbours.updateTime = lastNeighbourTime+' '+ch_utils.userTime(lastNeighbourTime);

            if (device === '1') {
                givenName = 'ZWay Controller';
            } else {
                givenName = devData.givenName.value || '';
                var isFailed = devData.isFailed.value;

                //change updateTime to user friendly format
                var isAwakeTime = devData.isAwake.updateTime;
                var isFailedTime = devData.isFailed.updateTime;
                var isFlirs = devData.sensor250.value || devData.sensor1000.value;
                devData.isAwake.updateTime = isAwakeTime+' '+ch_utils.userTime(isAwakeTime);
                devData.isFailed.updateTime = isFailedTime+' '+ch_utils.userTime(isFailedTime);
                devData.isFailed["value"+clickMark] = "javascript:changeValue('isFailed',"+isFailed+","+device+");";
                if (isFailed) {
                     devData.isFailed["value"+styleMark] = 'color:red; font-weight:bold;';
                }

                var isPortable = false;
                if (devices[device].instances[0].commandClasses.hasOwnProperty('94')) {
                    var cData94 = devices[device].instances[0].commandClasses[94];
                    var deviceTypeString = devices[device].data.deviceTypeString.value || 'undefined';
                    var roleTypeString = cData94.data.roleTypeString.value || deviceTypeString;
                    isPortable = roleTypeString.indexOf('Portable') >= 0 ? true : false;
                }

                var cc128;
                var cc132;
                var lastTime;
                var mode, state;
                if (isFlirs) {
                    cc128 = devices[device].instances[0].commandClasses[128];
                    if (cc128.data.supported.value) {
                        lastTime = cc128.data.last.updateTime;
                        cc128.data.last.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                    }
                    add = ' (Flirs)';
                } else
                if (devices[device].instances[0].commandClasses.hasOwnProperty('128') &&
                    devices[device].instances[0].commandClasses.hasOwnProperty('132')) {
                    cc128 = devices[device].instances[0].commandClasses[128];
                    cc132 = devices[device].instances[0].commandClasses[132];

                    if (cc128.data.supported.value && cc132.data.supported.value) {
                        var isAwake = devData.isAwake.value;
                        var isListening = devData.isListening.value;
                        var lastWakeup = cc132.data.lastWakeup.value;
                        //change updateTime to user friendly format
                        var lastWakeupTime = cc132.data.lastWakeup.updateTime;
                        var lastSleepTime = cc132.data.lastSleep.updateTime;
                        lastTime = cc128.data.last.updateTime;
                        cc132.data.lastWakeup.updateTime = lastWakeupTime+' '+ch_utils.userTime(lastWakeupTime);
                        cc132.data.lastSleep.updateTime = lastSleepTime+' '+ch_utils.userTime(lastSleepTime);
                        cc128.data.last.updateTime = lastTime+' '+ch_utils.userTime(lastTime);

                        var cc128_history = cc128.data.history;
                        Object.keys(cc128_history).forEach(function(level, ix) {
                            if (level >= 0) {
                                var updateTime = cc128_history[level].updateTime;
                                cc128_history[level].updateTime = updateTime+' '+ch_utils.userTime(updateTime);
                            }
                        });

                        if (!(isListening && !isAwake)) {
                            add = ' (Battery)';
                            if (lastWakeup === null) {
                                add = ' (Battery, lastWakeup = null)';
                            }
                        }
                    }
                }
                if (devices[device].instances[0].commandClasses.hasOwnProperty('152')) { //Security
                    var cc152 = devices[device].instances[0].commandClasses[152];
                    if (cc152.data.supported.value) {
                       //add class name to NIF
                        nif = cc152.data.secureNodeInfoFrame.value;
                        nif.forEach(function(classId, ix)  {
                            nif[ix] = classId+' '+classArray[classId];
                        });
                        lastNifTime = cc152.data.secureNodeInfoFrame.updateTime;
                        cc152.data.secureNodeInfoFrame.updateTime = lastNifTime+' '+ch_utils.userTime(lastNifTime);
                    }
                }
                if (devices[device].instances[0].commandClasses.hasOwnProperty('159')) { //Security 2
                    var cc159 = devices[device].instances[0].commandClasses[159];
                    if (cc159.data.supported.value) {
                       //add class name to NIF
                        if (typeof cc159.data.secureNodeInfoFrames.S2Unauthenticated !== 'undefined') {
                            nif = cc159.data.secureNodeInfoFrames.S2Unauthenticated.value;
                            nif.forEach(function(classId, ix)  {
                                nif[ix] = classId+' '+classArray[classId];
                            });
                        }
                        if (typeof cc159.data.secureNodeInfoFrames.S2Authenticated !== 'undefined') {
                            nif = cc159.data.secureNodeInfoFrames.S2Authenticated.value;
                            nif.forEach(function(classId, ix)  {
                                nif[ix] = classId+' '+classArray[classId];
                            });
                        }
                        lastNifTime = cc159.data.secureNodeInfoFrames.updateTime;
                        cc159.data.secureNodeInfoFrames.updateTime = lastNifTime+' '+ch_utils.userTime(lastNifTime);
                    }
                }
                if (devices[device].instances[0].commandClasses.hasOwnProperty('91')) { //CentralScene
                    var cc91data = devices[device].instances[0].commandClasses[91].data;
                    lastTime = cc91data.currentScene.updateTime;
                    cc91data.currentScene.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                }
                if (devices[device].instances[0].commandClasses.hasOwnProperty('98')) { //Doorlock
                    var cc98data = devices[device].instances[0].commandClasses[98].data;
                    lastTime = cc98data.mode.updateTime;
                    cc98data.mode.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                    mode = cc98data.mode.value;
                    switch (mode) {
                        case 0:
                            mode += ' Door Unsecured';
                            break;
                        case 1:
                            mode += ' Door Unsecured with timeout';
                            break;
                        case 2:
                            mode += ' Door Unsecured for inside Door Handles';
                            break;
                        case 3:
                            mode += ' Door Unsecured for inside Door Handles with timeout';
                            break;
                        case 4:
                            mode += ' Door Unsecured for outside Door Handles';
                            break;
                        case 5:
                            mode += ' Door Unsecured for outside Door Handles with timeout';
                            break;
                        case 255:
                            mode += ' Door Secured';
                            break;
                    }
                    cc98data.mode.value = mode;
                }
                if (devices[device].instances[0].commandClasses.hasOwnProperty('99')) { //UserCode
                    var cc99data = devices[device].instances[0].commandClasses[99].data;
                    Object.keys(cc99data).forEach(function(user, ix) {
                        if (user >= 0) {
                            lastTime = cc99data[user].status.updateTime;
                            cc99data[user].status.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                            lastTime = cc99data[user].hasCode.updateTime;
                            cc99data[user].hasCode.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                        }
                    });
                }
                if (devices[device].instances[0].commandClasses.hasOwnProperty('108')) { //Supervision
                    var ccdata = devices[device].instances[0].commandClasses[108].data;
                    var lastSession = ccdata.lastSession.value.toString();
                    if (ccdata[lastSession]) {
                        lastTime = ccdata.lastSession.updateTime;
                        ccdata.lastEvent = ccdata.lastSession.value;
                        ccdata['lastEvent'+styleMark] = "background-color:yellow;";
                        ccdata.lastEventtime = lastTime+' '+ch_utils.userTime(lastTime);
                        ccdata['lastEventtime'+styleMark] = "background-color:yellow;";
                    }
                    Object.keys(ccdata).forEach(function(key, ix) {
                        if (key >= 0) {
                            lastTime = ccdata[key].status.updateTime;
                            ccdata[key].status.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                            state = ccdata[key].status.value;
                            switch (state) {
                                case 0:
                                    state += ' No Support';
                                    break;
                                case 1:
                                    state += ' Working';
                                    break;
                                case 2:
                                    state += ' Failed';
                                    break;
                                case 255:
                                    state += ' Success';
                                    break;
                            }
                            ccdata[key].status.value = state;
                        }
                    });
                }

                if (devices[device].instances[0].commandClasses.hasOwnProperty('113')) { //Alarm
                    var cc113data = devices[device].instances[0].commandClasses[113].data;
                    Object.keys(cc113data).forEach(function(key, ix) {
                        if (key >= 0) {
                            if (cc113data[key].hasOwnProperty('event')) {   //old syntax
                                lastTime = cc113data[key].event.updateTime;
                                cc113data[key].event.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                            } else {
                                var lastEventtime = 0, lastEvent;
                                Object.keys(cc113data[key]).forEach(function(key2, ix2) {
                                    if (key2 >= 0) {    //new syntax
                                        lastTime = cc113data[key][key2].updateTime;
                                        cc113data[key][key2].updateTime = lastTime+' '+
                                                                    ch_utils.userTime(lastTime);
                                        if (cc113data[key][key2].status.value) {
                                            if (lastTime > lastEventtime) {
                                                lastEventtime = lastTime;
                                                lastEvent = key2;
                                            }
                                        }
                                        
                                     }
                                     if (lastEvent) {
                                         cc113data[key].lastEvent = lastEvent;
                                         cc113data[key]['lastEvent'+styleMark] = "background-color:yellow;";
                                         cc113data[key].lastEventtime = lastEventtime+' '+
                                                                ch_utils.userTime(lastEventtime);
                                         cc113data[key]['lastEventtime'+styleMark] = 
                                                         "background-color:yellow;";
                                     }
                                });
                            }
                        }
                    });
                }
                if (isPortable) {
                    add = add === '' ? '(Portable)' : add.replace(')', ' - Portable)');
                }
                if (isFailed) {
                    add = add === '' ? '(failed)' : add.replace(')', ' - failed)');
                }

                //check reset device by user (90)
                var deviceReset = false;
                if (devices[device].instances[0].commandClasses.hasOwnProperty('90')) { //DeviceResetLocally
                    var cc90data = devices[device].instances[0].commandClasses[90].data;
                    lastTime = cc90data.reset.updateTime;
                    cc90data.reset.updateTime = lastTime+' '+ch_utils.userTime(lastTime);
                    if (cc90data.reset.value) {
                        //cc90data.reset["value"+clickMark] = "javascript:changeValue('reset',"+
                        //    cc90data.reset.value+","+device+","+0+","+90+");";
                        cc90data.reset["value"+styleMark] = 'color:red; font-weight:bold;';
                        add = add === '' ? '(reset)' : add.replace(')', ' - reset)');
                        ch_utils.alertMessage(22, device, givenName);
                    }
                }

                ///check interviewDone
                var interviewDoneTimeG = devData.interviewDone.updateTime;
                if (deviceReset === false && devData.interviewDone.value === false) {
                    add = add === '' ? '(incomplete)' : add.replace(')', ' - incomplete)');
                    ch_utils.alertMessage(20, device, givenName);
                }
                devData.interviewDone.updateTime = interviewDoneTimeG+' '+ch_utils.userTime(interviewDoneTimeG);
                devData.interviewDone["value"+clickMark] = "javascript:changeValue('interviewDone',"+
                    devData.interviewDone.value+","+device+");";
                if (!devData.interviewDone.value) {
                     devData.interviewDone["value"+styleMark] = 'color:red; font-weight:bold;';
                }

                var devInstances = devices[device].instances;
                Object.keys(devInstances).forEach(function(instNo, ix1) {
                    if (instNo >= 0) {
                        var commClasses = devices[device].instances[instNo].commandClasses;
                        Object.keys(commClasses).forEach(function(classNo, ix2) {
                            var devId = vDevIdPre+device+"-"+instNo+"-"+classNo;
                            var devTitle = deviceIDArray[devId];
                            if (devTitle) {
                                commClasses[classNo][devId] = devTitle;
                                commClasses[classNo][devId+clickMark] = "javascript:apiDevice('"+devId+"');";
                            }

                            if (classNo >= 0) {
                                if (commClasses[classNo].hasOwnProperty('data')) {
                                    if (commClasses[classNo].data.hasOwnProperty('interviewDone')) {
                                        var interviewDoneTime = commClasses[classNo].data.interviewDone.updateTime;
                                        devInstances[instNo].commandClasses[classNo].data.interviewDone.updateTime =
                                                    interviewDoneTime+' '+ch_utils.userTime(interviewDoneTime);
                                        devInstances[instNo].commandClasses[classNo].data.
                                            interviewDone["value"+clickMark] =
                                            "javascript:changeValue('interviewDone',"+
                                            devInstances[instNo].commandClasses[classNo].data.interviewDone.value+","+
                                            device+","+instNo+","+classNo+");";
                                            if (!devInstances[instNo].commandClasses[classNo].data.
                                                    interviewDone.value) {
                                                 devInstances[instNo].commandClasses[classNo].data.
                                                    interviewDone["value"+styleMark] = 'color:red; font-weight:bold;';
                                            }

                                        if (interviewDoneTime > interviewDoneTimeG) {
                                            ch_utils.alertMessage(21, device, instNo, classNo,
                                                  ch_utils.userTime(interviewDoneTimeG), ch_utils.userTime(interviewDoneTime));
                                        }
                                    } //interviewDone

                                    if (commClasses[classNo].data.hasOwnProperty('supported')) {
                                        devInstances[instNo].commandClasses[classNo].data.
                                            supported["value"+clickMark] =
                                            "javascript:changeValue('supported',"+
                                            devInstances[instNo].commandClasses[classNo].data.supported.value+","+
                                            device+","+instNo+","+classNo+");";
                                            if (!devInstances[instNo].commandClasses[classNo].data.supported.value) {
                                                devInstances[instNo].commandClasses[classNo].
                                                       data.supported["value"+styleMark] = 'color:red; font-weight:bold;';
                                            }
                                    } //supported

                                    if (commClasses[classNo].data.hasOwnProperty('security')) {
                                        devInstances[instNo].commandClasses[classNo].data.
                                            security["value"+clickMark] =
                                            "javascript:changeValue('security',"+
                                            devInstances[instNo].commandClasses[classNo].data.security.value+","+
                                            device+","+instNo+","+classNo+");";
                                            if (!devInstances[instNo].commandClasses[classNo].data.security.value) {
                                                devInstances[instNo].commandClasses[classNo].
                                                       data.security["value"+styleMark] = 'color:red; font-weight:bold;';
                                            }
                                    } //security

                                    Object.keys(commClasses[classNo].data).forEach(function(inst2No, ix1) {
                                        //alert(inst2No);
                                        if (inst2No && !isNaN(inst2No)) {
                                            devId = vDevIdPre+device+"-"+instNo+"-"+classNo+'-'+inst2No;
                                            //alert(devId);
                                            devTitle = deviceIDArray[devId];
                                            if (devTitle) {
                                                commClasses[classNo].data[inst2No][devId] = devTitle;
                                                commClasses[classNo].data[inst2No][devId+clickMark] = "javascript:apiDevice('"+devId+"');";
                                            } else {
                                                var more = false;
                                                Object.keys(deviceIDArray).forEach(function(id, ix1) {
                                                    if (id.indexOf(devId) === 0) {
                                                        commClasses[classNo].data[inst2No][id] = deviceIDArray[id];
                                                        commClasses[classNo].data[inst2No][id+clickMark] = "javascript:apiDevice('"+id+"');";
                                                        if (more) {
                                                            commClasses[classNo].data[inst2No][id+styleMark] = 'color:red; font-weight:bold;';
                                                        }
                                                        more = true;
                                                    }
                                                });
                                            }
                                        }
                                    }); //inst2No
                                } //data
                            } //classNo >= 0
                        }); //commClasses
                    }
                }); //devInstances
            } //device != 1

            deviceArray.push([device, givenName, add]);
        } catch (err) {
            alert ('device='+device+': '+err);
        }
        } //devices

        );
        //alert('deviceArray='+JSON.stringify(deviceArray));
    } //buildSelectArrays

    function buildSelectBoxDevTitle (surveyList) {
        var elId;
        var i;
        var option;

        elId = document.getElementById('selDevTitle');
        i = 0;
        option = new Option(ch_utils.buildMessage(9), '');
        elId.options[i++] = option;
        Object.keys(surveyList).forEach(function(device, ix) {
            if (device && !isNaN(device)) {
                option = new Option(device+': '+surveyList[device], device);
                elId.options[i++] = option;
            }
        });
     } //buildSelectBoxDevTitle

    var el = document.getElementById("collapseCheckbox");
    if (el) {
        $('#collapseCheckbox').change(setCollapsed);
    }

    function setCollapsed() {
        var el = document.getElementById("collapseCheckbox");
        if (!el) {
            collapsed = false;
        } else {
            collapsed = el.checked;
        }
        printSource (true);
    } //setCollapsed

    document.getElementById('selDevTitle').addEventListener('click', function() {
        devNumKeySelected = this.value;
        if (devNumKeySelected === '') {
            devNumKeySelected = undefined;
        }
        if (devNumKeySelected !== devNumKeySelectedOld) {
            printDevice(devNumKeySelected);
        }
    }, true);
}); //document).ready

function printDevice(device) {
    if (devNumKeySelected !== device) {
        devNumKeySelected = device;
        $("#selDevTitle").val(devNumKeySelected);
    }
    if (devNumKeySelected === undefined) {
        printSurvey();
    } else {
        printSource (true);
    }
} //printDevice

function apiDevice(device) {
    var url = '/ZAutomation/api/v1/devices/'+device;
    ch_utils.ajax_get(url, success);
    function success (buffer) {
        buffer.data.updateTime = buffer.data.updateTime+' '+ch_utils.userTime(buffer.data.updateTime);

        //print
        $('#json-renderer2').jsonViewer(buffer, {
            collapsed: false,
            rootCollapsable: false,
            withQuotes: false,
            clickable: false,
            styleTag: false
        });
    }
} //apiDevice

function printSource (refresh) {
    ch_utils.buttonVisible('collapseCheckbox', true);
    ch_utils.buttonVisible('textCollapse', true);
    if (!refresh && devNumKeySelected === devNumKeySelectedOld) {
        return;
    }
    devNumKeySelectedOld = devNumKeySelected;
    try {
        if (devNumKeySelected === '0') {
            ch_utils.displayMessage(0, surveyList[devNumKeySelected]);
            printJSON( vData.controller, collapsed, clickMark, styleMark);
        } else {
            var dData = vData.devices[devNumKeySelected];
            var devData = dData.data;
            var cData128;   //Battery
            var cData132;   //Wakeup
            var cData94;    //ZWavePlusInfo

            //failed
            var failedText = '';
            if (dData.data.isFailed.value) {
                failedText = ', is failed ('+dData.data.isFailed.updateTime.substr(11)+')';
            }

            //roleType
            var roleType = '';
            var deviceTypeString = dData.data.deviceTypeString.value || '';
            var roleTypeString = deviceTypeString;
            if (dData.instances[0].commandClasses.hasOwnProperty('94')) {
                cData94 = dData.instances[0].commandClasses[94];
                roleType = cData94.data.roleType.value;
                roleTypeString = cData94.data.roleTypeString.value;
                roleTypeString = roleTypeString === null ? deviceTypeString : roleTypeString+' ('+deviceTypeString+')';
                roleTypeString = roleTypeString;
            }
            if (roleTypeString !== '') {roleTypeString = '<br>Role Type='+roleTypeString;}

            //battery
            var batteryText = '';
            var isAwake;
            var isListening;
            var lastWakeup;
            if (dData.instances[0].commandClasses.hasOwnProperty('128')) {
                cData128 = dData.instances[0].commandClasses[128];
                if (cData128.data.supported.value) {

                    devData = dData.data;
                    isAwake     = devData.isAwake.value;
                    isListening = devData.isListening.value;

                    if (!(isListening && !isAwake.value)) {
                        try {
                            batteryText = '<br>'+cData128.name+':'+cData128.data.last.value+'% ('+
                                                     cData128.data.last.updateTime.substr(11)+')';
                        } catch(err) {
                            batteryText = '<br>'+cData128.name+':'+cData128.data.last.value+'%';
                        }
                    }
                }
            }

            //wakeup
            var wakeupText = '';
            if (dData.instances[0].commandClasses.hasOwnProperty('132')) {
                cData132 = dData.instances[0].commandClasses[132];
                if (cData132.data.supported.value) {
                    lastWakeup  = cData132.data.lastWakeup.value;
                    if (!(isListening && !isAwake.value)) {
                        if (lastWakeup === null) {
                            wakeupText = ', lastWakeup = null';
                        } else {
                            wakeupText = ', sleeping till '+
                                     ch_utils.userTime(cData132.data.lastSleep.updateTime.substr(0,10)*1+
                                     cData132.data.interval.value*1);
                            if (cData132.data.interval.value === 0) {
                                wakeupText = ', no wakeup';
                            }
                        }
                    }
                }
            }

            //flirs
            var flirsText = '';
            if (dData.data.sensor250.value || dData.data.sensor1000.value) {
                flirsText = ',&nbsp;Flirs';
            }

            if (devNumKeySelected === "1") {
                ch_utils.displayMessage(14,devNumKeySelected+' '+
                                  'Z-Way'+' '+
                                  '('+'z-wave.me'+') '+roleTypeString
                );
             } else {
                var receivedText = ', lastReceived:'+dData.data.lastReceived.updateTime.substr(11);
                ch_utils.displayMessage(14,devNumKeySelected+' '+
                                  dData.data.givenName.value+' '+
                                  '('+dData.data.vendorString.value+')'+
                                  failedText+receivedText+
                                  batteryText+wakeupText+flirsText+roleTypeString
                );
             }
             printJSON(vData.devices[devNumKeySelected], collapsed, clickMark, styleMark);
        }
    } catch(err) {
        alert(err);
    }
} //printSource

function printSurvey() {
    ch_utils.buttonVisible('collapseCheckbox', false);
    ch_utils.buttonVisible('textCollapse', false);
    ch_utils.displayMessage(0);
    printJSON(surveyList, rootCollapsable, clickMark, styleMark);
} //printSurvey

function printJSON(classData, collapsed, clickMark, styleMark) {
    $('#json-renderer1').jsonViewer(classData, {
        collapsed: collapsed || false,
        rootCollapsable: rootCollapsable,
        withQuotes: false,
        clickable: clickMark,
        styleTag: styleMark
    });
} //printJSON

function changeValue(string, currentValue, device, instance, classNo) {
    //alert(string+'-'+currentValue+'-'+device+'-'+instance+'-'+classNo);
     device_curr    = device;
     instance_curr  = instance;
     classNo_curr   = classNo;
     string_curr    = string;

    var html = '';
    if (classNo) {
        html += '<h3>'+ch_utils.buildMessage(3, string, device+'-'+instance+'-'+classNo)+'</h3>';
    } else {
        html += '<h3>'+ch_utils.buildMessage(3, string, device)+'</h3>';
    }
    html += '<br><br><br>';
    html += ch_utils.buildMessage(7, currentValue);
    html += '<br><br><br>';
    var opt = currentValue ? 'checked' : 'unchecked';
    html += '<input type="radio" id="true" name="enumList" value="true" '+opt+'>';
    html += '<label for="true">true</label><br>';
    opt = currentValue ? 'unchecked' : 'checked';
    html += '<input type="radio" id="false" name="enumList" value="false" '+opt+'>';
    html += '<label for="false">false</label><br><br>';
    html += '<button type="button" id="submitStore">'+ch_utils.buildMessage(23)+'</button>';
    html += ch_utils.buildMessage(15);

    document.getElementById('json-renderer2').innerHTML = html;
    //$('#json-renderer2').html(html);
    eval("document.querySelector('#submitStore').addEventListener('click', submitStore);");
} //changeValue

String.prototype.format = function() {
    var a = this;
    for (var k in arguments) {
        if (k) {
            a = a.replace("{" + k + "}", arguments[k]);
        }
    }
    return a;
};

//send new value
function submitStore() {
    var value   = $('input[name=enumList]:checked').val();
    if (value === undefined) {
        value = document.getElementById("newVal").value;
    }

    //store to file:
    var urlFormat1 = '/ZWaveAPI/Run/zway.devices[{0}].instances[{1}].commandClasses[{2}].data.{3}.value={4}';
    var urlFormat2 = '/ZWaveAPI/Run/zway.devices[{0}].data.{1}.value={2}';
    var url;
    if (classNo_curr) {
        url = urlFormat1.format(device_curr, instance_curr, classNo_curr, string_curr, value);
    } else {
        url = urlFormat2.format(device_curr, string_curr, value);
    }

    sendUrl(url, device_curr, instance_curr, classNo_curr, string_curr, value);
} //submitStore

function sendUrl(url, device_curr, instance_curr, classNo_curr, string_curr, value) {
    try {
        ch_utils.ajax_get(url, success);
	} catch (err) {
        alert('err: '+err.message);
    }
    function success (data) {
        //alert('success: '+data);
        alert('OK');
        changeValueInBuffer(device_curr, instance_curr, classNo_curr, string_curr, value);
    }
} //sendUrl

function changeValueInBuffer(device_curr, instance_curr, classNo_curr, string_curr, value) {
    if (classNo_curr !== undefined) {
        vData.devices[device_curr].instances[instance_curr].commandClasses[classNo_curr].data[string_curr].value = value;
    } else {
        vData.devices[device_curr].data[string_curr].value = value;
    }
} //changeValueInBuffer

