
//h-------------------------------------------------------------------------------
//h
//h Name:         ConfigJson.html.js
//h Type:         Javascript module
//h Purpose:      Display config.json devices for ZWay module MxInfo2
//h Project:      ZWay
//h Usage:        .../ConfifJson.html [test]
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V2.0.0 2024-06-10/peb
//v History:      V1.0   2019-02-08/peb first version
//v               V1.3   2019-08-20/peb [-]test for user login with ZAutomation
//v                                        removed, doesn't work in 3.0.0 any more
//v               V2.0.0 2024-02-10/peb [*]use command /JS/Run/controller.devices.cleanup("xxx")
//v                                        to remove obsolete device xxx
//h Copyright:    (C) piet66 2019
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 6 */
/*jshint evil: true */
/*globals $, saveObject, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='ConfigJson.html.js';
var VERSION='V2.0.0';
var WRITTEN='2024-06-10/peb';

//------------------
//b Data Definitions
//------------------
var useTestData = false;
var lang;

var razberryURL = '';
var dataCollected = 0;
var configJson;
var devArray = [];
var devConfigArray = [];
var devOldArray = [];
var devNewArray = [];
var jsEl;
var jsVisible = false;

var ixButtonTextBase = 20;
var ix_selectTexts = 30;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {
        de: 'Hallo {0}, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo {0}, sorry, you have no administrator rights to read the data!'
    },
    {
        de: '{0} wird gelesen...',
        en: 'Reading {0}...'
    },
    {
        de: 'Gerätedaten werden gelesen...',
        en: 'Reading device data...'
    },
    {
        de: 'Bitte entweder ein Gerät oder eine Instanz auswählen!',
        en: 'Please select either a device or an instance!'
    },
    {
        de: '{0}',
        en: '{0}'
    },
    {
        de: 'Liste: Config.json',
        en: 'List: Config.json'
    },
    {
        de: 'Liste: {0} Geräte in Gebrauch, nach ID sortiert',
        en: 'List: {0} devices in use, sorted by id'
    },
    {
        de: 'Liste: {0} Geräte in config.json, nach ID sortiert',
        en: 'List: {0} devices in config.json, sorted by id'
    },
    {
        de: 'Liste: {0} alte Geräte in config.json, nach ID sortiert',
        en: 'List: {0} old devices in config.json, sorted by id'
    },
    {//10
        de: 'Alle alten Geräte werden entfernt...',
        en: 'Removing all old devices...'
    },
    {//11
        de: 'Fehler beim Lesen von {0}: {1}',
        en: 'Error reading {0}: {1}'
    },
    {//12   not used
        de: '12 not used',
        en: '12 not used',
    },
    {//13
        de: '{0} gelöscht',
        en: '{0} removed',
    },
    {//14
        de: 'Fehler beim Löschen von {0}',
        en: 'Error at removing {0}',
    },
    {//15
        de: 'Sie benötigen eine erweiterte Version von updateBackendConfig.js, um diese Geräte löschen zu lassen! Siehe Verzeichnis sysmodules_changed.',
        en: 'You need an enhanced version of updateBackendConfig.js to delete these devices! See folder sysmodules_changed.'
    },
   {//16
        de: 'Liste: {0} benutzte Geräte nicht in config.json, nach ID sortiert',
        en: 'List: {0} used devices not in config.json, sorted by id'
    },
    {//17
        de: 'Keine alten Geräte (mehr) zu entfernen',
        en: 'No (more) old devices to remove',
    },
    {//18 not used
        de: '18 not used',
        en: '18 not used',
    },
   {
        de: 'Config.json Geräte',
        en: 'Config.json Devices'
    },

    //button texts (20+...):
    {
        de: 'Config.json',
        en: 'Config.json'
    },
    {
        de: 'Geräte in Gebrauch',
        en: 'Devices in Use'
    },
    {
        de: 'Config.json Geräte',
        en: 'Config.json Devices'
    },
    {
        de: 'Alte Geräte',
        en: 'Old Devices'
    },
    {
        de: 'Alle alten Geräte entfernen',
        en: 'Remove all old Devices'
    },
    {
        de: 'Download neue Config.json',
        en: 'Download new Config.json'
    },
    {
        de: 'Config.json neu Einlesen',
        en: 'Reload Config.json'
    },
    {
        de: 'Überprüfung:',
        en: 'Check:'
    },
    {
        de: 'Bereinigung:',
        en: 'Clearing up:'
    },
    {
        de: 'Löschen aller  alten, obsoleten Geräte',
        en: 'Delete all old, obsolete Devices'
    },
    {
        de: 'Nicht gespeicherte Geräte',
        en: 'Not stored Devices'
    },
];

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get html language
    lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    //set test flag
    var testFlag = ch_utils.getParameter('test');
    console.log('testFlag='+testFlag);

    langTexts();
    ch_utils.requireAdmin(getDeviceData, BasicAuth);

    function langTexts() {
        document.title = ch_utils.buildMessage(19);
        ch_utils.buttonText('config_json', 0);
        ch_utils.buttonText('used_devices', 1);
        ch_utils.buttonText('config_json_devices', 2);
        ch_utils.buttonText('old_devices', 3);
        ch_utils.buttonText('new_devices', 10);
        ch_utils.buttonText('delete_old_devices', 4);
        ch_utils.buttonText('download_new_config', 5);
        ch_utils.buttonText('reload_config_json', 6);
        ch_utils.buttonText('label1', 7);
        ch_utils.buttonText('label2', 8);
        ch_utils.buttonText('store_old_devices', 9);

        ch_utils.buttonVisible('delete_old_devices', testFlag);
        ch_utils.buttonVisible('download_new_config', testFlag);
        ch_utils.buttonVisible('reload_config_json', testFlag);
    } //langTexts

    function getDeviceData() {
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/devices';
        ch_utils.ajax_get(url, success);
        function success (data) {
            var devInput = data;
            devInput.data.devices.forEach(function(device) {
                devArray.push(device.id);
            });

            //sort by device id
            devArray.sort();

            ++dataCollected;
            continueWork();
        }
    } //getDeviceData

    function getConfigjson(first) {
        var fil = 'config.json';
        ch_utils.displayMessage(2, fil);
        var url = '/ZWaveAPI/Run/loadObject("'+fil+'")';
        ch_utils.ajax_get(url, success);
        function success (data) {
            //get data
            configJson = data;

            buildDevArrays();
            if (first) {
                ++dataCollected;
                continueWork();
            } else {
                printJSON(configJson, 6);
            }
        }
    } //getConfigjson

    function getTestData(first) {
        var fil = 'testData/config.json';
        alert('Reading test config: '+fil);
        ch_utils.displayMessage(2, fil);
        ch_utils.ajax_get(fil, success);
        function success (data) {
            //get data
            configJson = data;

            buildDevArrays();
            if (first) {
                ++dataCollected;
                continueWork();
            } else {
                printJSON(configJson, 6);
            }
        }
    } //getTestData

    //reove all old devices
    function removeAllOldDevices() {
        var devCount = devOldArray.length;
        if (devCount === 0) {
            ch_utils.displayMessage(17);
            return devCount;
        }

        var url = '/JS/Run/controller.devices.cleanup("'+devOldArray[0]+'")';
        console.log(url);
        var async = true;
        ch_utils.ajax_get(url, success, fail, success, async);

        function success () {   //returns 200 + null
            ch_utils.displayMessage(13, devOldArray[0]);
            devOldArray.shift();
            removeAllOldDevices();
        }
        function fail () {   //returns 500 + not found
            ch_utils.displayMessage(14, devOldArray[0]);
            devOldArray.shift();
            removeAllOldDevices();
        }
    } //removeAllOldDevices

    function downloadConfigjson() {
        download('config_new.json', JSON.stringify(configJson));
    } //downloadConfigjson

/* doesn't work in edge
    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    } //download
*/

    function download(filename, text) {
        var blob = new Blob([text], { type: 'text/json;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    } //download

    function buildDevArrays() {
        devConfigArray = [];
        //1. device definitions
        Object.keys(configJson.vdevInfo).forEach(function(device, ix) {
            devConfigArray.push(device);
        });
        //2. profiles definitions
        configJson.profiles.forEach(function(profile, ix) {
            profile.dashboard.forEach(function(device) {
                devConfigArray.push(device);
            });
            profile.hide_single_device_events.forEach(function(device) {
                devConfigArray.push(device);
            });
        });

        //sort
        devConfigArray.sort();

        //filter doubles
        devConfigArray = devConfigArray.filter(function (value, index, self) {
                             return self.indexOf(value) === index;
                         });

        devOldArray = devConfigArray.diff(devArray);
        devNewArray = devArray.diff(devConfigArray);
    } //buildDevArrays

    function delOldDevices() {
        //remove old devices from config.json
        ch_utils.displayMessage(10);
        devOldArray.forEach(function(oldDevId) {
            delete configJson.vdevInfo[oldDevId];
            configJson.profiles.forEach(function(profile, ix) {
                var indx;
                indx = configJson.profiles[ix].dashboard.indexOf(oldDevId);
                if (indx >= 0) {
                    configJson.profiles[ix].dashboard.splice(indx, 1);
                }
                indx = configJson.profiles[ix].hide_single_device_events.indexOf(oldDevId);
                if (indx >= 0) {
                    configJson.profiles[ix].hide_single_device_events.splice(indx, 1);
                }
            });

        });

        //build new difference array
        buildDevArrays();
    } //delOldDevices

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    function continueWork() {
        //if device data are collected we continue requesting instance data
        if (dataCollected === 1) {
            if (useTestData) {
                getTestData(true);
            } else {
                getConfigjson(true);
            }
        }
        //if all data are collected we can go on
        else if (dataCollected >= 2) {
            dataCollected++;
            exploitData();
        }
    } //continueWork

    //------------- functions -----------------------------------------------

    function printJSON (objectJSON, text_id, counter) {
        //alert(JSON.stringify(objectJSON));
        counter = String(counter);

        if (!jsEl) {
            $("body").append('<pre id="json-renderer"></pre>');
            jsEl = document.getElementById("json-renderer");
            jsVisible = true;
        } else {
            jsEl.style.display = "inherit";
            jsVisible = true;
        }

        ch_utils.displayMessage(text_id, counter);
        var objectPrint = objectJSON;

        $('#json-renderer').jsonViewer(objectPrint, {
            collapsed: false,
            withQuotes: false
        });
    } //printJSON

    function exploitData() {
        //display config.json
        printJSON(configJson, 6);
    } //exploitData

    //------------- event listeners -----------------------------------------------

    document.getElementById('config_json').addEventListener('click', function() {
        printJSON(configJson, 6);
    });

    document.getElementById('used_devices').addEventListener('click', function() {
        printJSON(devArray, 7, devArray.length);
    });

    document.getElementById('config_json_devices').addEventListener('click', function() {
        printJSON(devConfigArray, 8, devConfigArray.length);
    });

    document.getElementById('old_devices').addEventListener('click', function() {
        printJSON(devOldArray, 9, devOldArray.length);
    });

    document.getElementById('new_devices').addEventListener('click', function() {
        printJSON(devNewArray, 16, devNewArray.length);
    });

    document.getElementById('reload_config_json').addEventListener('click', function() {
        if (useTestData) {
            getTestData();
        } else {
            getConfigjson(false);
        }
    });

    document.getElementById('delete_old_devices').addEventListener('click', function() {
        delOldDevices();
        printJSON(devOldArray, 9, devOldArray.length);
    });

    document.getElementById('download_new_config').addEventListener('click', function() {
        downloadConfigjson();
    });

    document.getElementById('store_old_devices').addEventListener('click', function() {
        printJSON(devOldArray, 9, devOldArray.length);
        removeAllOldDevices();
    });
}); //$(document).ready
