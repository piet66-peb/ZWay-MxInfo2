
//h-------------------------------------------------------------------------------
//h
//h Name:         Dependencies.html.js
//h Type:         Javascript module
//h Purpose:      Display devices, instances and their dependencies  for ZWay
//h               module MxInfo2
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V3.2 2023-07-06/peb
//v History:      V1.0 2017-12-29/peb first version
//v               V2.1 2019-08-07/peb [+]instances created by automations function
//v               V2.2 2019-09-25/peb [+]multiple created devices
//v               V2.5 2019-11-27/peb [+]show current device level
//v               V2.9 2021-01-23/peb [x]indexOf(devId) > "devId"
//v               V3.0 2021-02-06/peb [+]device icons
//v               V3.1 2021-08-19/peb [+]call configuration from node
//h Copyright:    (C) piet66 2017
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals $, cytoscape, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Dependencies.html.js';
var VERSION='V3.2';
var WRITTEN='2023-07-06/peb';

//------------------
//b Data Definitions
//------------------
var useTestData = false;
var testArrayNodes = [];
var testArrayEdges = [];

var razberryURL = '';
var devArray = [];
var allDevices = {};
var instArray0 = [];        //first version without missing devices
var moduleArray = [];
var moduleDeviceKeys = [];
var instArray1 = [];        //second version with missing devices
var inactiveInstances = [];

var orphanedDevices = {};
var missingDevices = [];
var nocreatorDevices = {};
var wrongcreatorDevices = {};
var failedDevices = {};
var hiddenDevices = {};
var multiCreatedDeviceIds = {};
var inactiveDeviceIds = {};

var dataCollected = 0;
var jsEl;
var cyEl;
var listEl;
var jsVisible = false;
var cyVisible = false;
var listVisible = false;
var listVisible = false;
var deviceIdselected = "";
var instanceIdselected = 0;
var cyJSON;
//var cyLayouts = ['cose-bilkent', 'cola', 'concentric', 'cose', 'random', 'grid', 'circle', 'breadthfirst'];
var cyLayouts = ['cose-bilkent', 'cola', 'concentric', 'cose'];
var cyLayout = 'concentric';
var ix_cyLayout = -1;
var graphTXT = '';
var graphTXTTitle = '';
var graphTXTNL = false;
var graphTXTDir = false;
var graphTXTRange = 0;
var treeStack = [];

var ixButtonTextBase = 40;
var ix_selectTexts = 62;
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
        de: 'Gerätedaten werden gelesen...',
        en: 'Reading device data...'
    },
    {
        de: 'Instanzendaten werden gelesen...',
        en: 'Reading instance data...'
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
        de: 'Liste: {0} Geräte',
        en: 'List: {0} devices'
    },
    {
        de: 'Liste: {0} Modulinstanzen',
        en: 'List: {0} module instances'
    },
    {
        de: 'Baum: Geräte und von welchen Objekten sie abhängig sind',
        en: 'Tree: Devices and which objects they depend on'
    },
    {
        de: 'Baum: Modulinstanzen und von welchen Objekten sie abhängig sind',
        en: 'Tree: Module instances and which objects they depend on'
    },
    {
        de: 'Baum: Geräte und welche Objekte von ihnen abhängig sind',
        en: 'Tree: Devices and which objects depend on them'
    },
    {
        de: 'Modulinstanzen und welche Objekte von ihnen abhängig sind',
        en: 'Tree: Module instances and which objects depend on them'
    },
    {
        de: '{0} (Grafik Layout={1})',
        en: '{0} (Drawing layout={1})'
    },
    {
        de: 'Grafik-Konfiguration',
        en: 'Drawing configuration'
    },
    {
        de: 'Gerät: {0}',
        en: 'Device: {0}'
    },
    {
        de: 'Modulinstanz: {0}',
        en: 'module instance: {0}'
    },
   {
        de: 'Abhängigkeiten für {0}',
        en: 'Dependencies for {0}'
    },
    {
        de: 'Bitte zuerst eine Grafik anzeigen!',
        en: 'Please display first a drawing!'
    },
    {
        de: 'Instanz {0} für Gerät {1} nicht gefunden!',
        en: 'Instance {0} not found for device {1}!'
    },
   {
        de: 'Z-Way Abhängigkeiten',
        en: 'Z-Way Dependencies'
    },
   {
        de: 'Gerät {0} hat keine creatorId, wird auf 0 gesetzt',
        en: 'device {0} has no creatorId, set to 0'
    },
   {
        de: '{0} Module',
        en: '{0} Modules'
    },
   {
        de: '{0} verwaiste Geräte',
        en: '{0} orphaned Devices'
    },
   {
        de: '{0} fehlende Geräte',
        en: '{0} missing Devices'
    },
   {
        de: '{0} Geräte ohne erzeugende Instanz, creatorId=0 gesetzt',
        en: '{0} Devices without creating Instance, set creatorId=0'
    },
   {
        de: '{0} Geräte mit falscher creatorId',
        en: '{0} Devices with wrong creatorId'
    },
    {
        de: 'Moduldaten werden gelesen...',
        en: 'Reading module data...'
    },
    {
        de: 'fehlt: ',
        en: 'missing: '
    },
    {
        de: 'neue Grafik',
        en: 'new drawing'
    },
    {
        de: 'zeichnet eine neue Grafik für diesen Knoten',
        en: 'displays a new drawing starting with this node'
    },
    {
        de: 'Daten des Knotens',
        en: 'data of this node'
    },
    {
        de: 'zeigt die Daten dieses Knotens',
        en: 'shows the data of this node'
    },
    {
        de: '{0} fehlerhafte Geräte',
        en: '{0} failed Devices'
    },
    {
        de: '{0} versteckte Geräte',
        en: '{0} hidden Devices'
    },
    {
        de: '{0} verwendete Geräte',
        en: '{0} used Devices'
    },
    {
        de: '{0} inaktive Modulinstanzen',
        en: '{0} inactive module instances'
    },
    {
        de: '{0} Geräte wurden mehrfach erzeugt',
        en: '{0} devices are multiple created'
    },
    {
        de: '{0} Geräte erzeugt von inaktiven Instanzen',
        en: '{0} devices created by inactive instances'
    },
    {
        de: 'Konfiguration aufrufen',
        en: 'call configuration'
    },
    {
        de: 'öffnet eine neue Webseite zur Konfiguration',
        en: 'opens a new webpage for configuration'
    },

    //button texts (40+...):
    {
        de: 'Geräte',
        en: 'Devices'
    },
    {
        de: 'Instanzen',
        en: 'Instances'
    },
    {
        de: 'Gerätebaum',
        en: 'Device Tree'
    },
    {
        de: 'Instanzenbaum',
        en: 'Instance Tree'
    },
    {
        de: 'Reverser Gerätebaum',
        en: 'Reverse Device Tree'
    },
    {
        de: 'Reverser Instanzenbaum',
        en: 'Reverse Instance Tree'
    },
    {
        de: 'Grafik',
        en: 'Drawing'
    },
    {
        de: 'Konfig.',
        en: 'Config'
    },
    {
        de: 'Liste',
        en: 'List'
    },
    {
        de: 'Liste Speichern',
        en: 'Store List'
    },
    {
        de: 'Module',
        en: 'Modules'
    },
    {
        de: 'Verwaiste Geräte',
        en: 'Orphaned Devices'
    },
    {
        de: 'Fehlende Geräte',
        en: 'Missing Devices'
    },
    {
        de: 'Geräte ohne creatorId',
        en: 'Devices without creatorId'
    },
    {
        de: 'Geräte mit falscher creatorId',
        en: 'Devices with wrong creatorId'
    },
    {
        de: 'Modulgerätekeys',
        en: 'Module Device Keys'
    },
    {
        de: 'Fehlerhafte Geräte',
        en: 'Failed Devices'
    },
    {
        de: 'Versteckte Geräte',
        en: 'Hidden Devices'
    },
    {
        de: 'Verwendete Geräte',
        en: 'Used Devices'
    },
    {
        de: 'Inaktive Instanzen',
        en: 'Inactive Instances'
    },
    {
        de: 'Mehrfach erzeugte Geräte',
        en: 'Multiple created Devices'
    },
    {
        de: 'Geräte inaktiver Instanzen',
        en: 'Devices of inactive Instances',
    },

    //button texts (62+...):
    {
        de: 'Gerät: ',
        en: 'Device: '
    },
    {
        de: 'Instanz:',
        en: 'Instance: '
    },
    {
        de: 'Keine Auswahl',
        en: 'Nothing selected'
    }
];

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get server url
    //var urlServer = window.location.href.replace(/:8083.*$/, ':8083');
    var urlIcons = '/smarthome/storage/img/icons/';
    //var modulemedia = '/ZAutomation/api/v1/load/modulemedia/###/icon.png';

    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    langTexts();
    ch_utils.requireAdmin(getDeviceData, BasicAuth);

    function langTexts() {
        document.title = ch_utils.buildMessage(19);
        ch_utils.buttonText('devices',0);
        ch_utils.buttonText('instances',1);
        ch_utils.buttonText('deviceTree',2);
        ch_utils.buttonText('instanceTree',3);
        ch_utils.buttonText('revDeviceTree',4);
        ch_utils.buttonText('revInstanceTree',5);
        ch_utils.buttonText('inactiveInstances',19);
        ch_utils.buttonText('graph',6);
        ch_utils.buttonText('graphJSON',7);
        ch_utils.buttonText('graphTXT',8);
        ch_utils.buttonText('graphTXTStore',9);
        ch_utils.buttonText('modules',10);
        ch_utils.buttonText('orphanedDevices',11);
        ch_utils.buttonText('missingDevices',12);
        ch_utils.buttonText('nocreatorDevices',13);
        ch_utils.buttonText('wrongcreatorDevices',14);
        ch_utils.buttonText('modulesDevices',15);
        ch_utils.buttonText('failedDevices',16);
        ch_utils.buttonText('hiddenDevices',17);
        ch_utils.buttonText('allDevices',18);
        ch_utils.buttonText('multiCreatedDeviceIds',20);
        ch_utils.buttonText('inactiveDeviceIds',21);
        ch_utils.buttonText('label1', ix_selectTexts-ixButtonTextBase);
        ch_utils.buttonText('label2', ix_selectTexts+1-ixButtonTextBase);
        ch_utils.buttonVisible('modules', false);
        ch_utils.buttonVisible('modulesDevices', false);
    }

    function getDeviceData() {
        var url = razberryURL + '/ZAutomation/api/v1/devices';
        if (useTestData) {
            url = 'testData/devices.json';
            alert('Reading test data from '+url);
        }
        ch_utils.displayMessage(2);
        ch_utils.ajax_get(url, success);
        function success (data) {
            var devInput = data;
            var objTemp = {};
            devInput.data.devices.forEach(function(device) {
                ///store all devices, later we remove all devices of active instances
                if (device.hasOwnProperty('creatorId') && !isNaN(device.creatorId) &&
                    device.creatorId > 1) {
                    try {
                        inactiveDeviceIds[device.creatorId].push(device.id);
                    } catch(err) {
                        inactiveDeviceIds[device.creatorId] = [device.id];
                    }
                }
                if (!device.permanently_hidden) {
                    var item = {
                        title: device.metrics.title,
                        id: device.id,
                        creatorId: device.creatorId,
                        deviceType: device.deviceType,
                        probeType: device.probeType === '' ? null : device.probeType,
                        probeTitle: device.metrics.probeTitle === '' ? null : (device.metrics.probeTitle || null),
                        icon: device.metrics.icon || 'placeholder'
                    };
                    var isFailed = device.metrics.isFailed;
                    if (isFailed !== undefined && isFailed === true) {
                        item.isFailed = isFailed;
                        failedDevices[device.id] = device.metrics.title;
                    }
                    if (!device.hasOwnProperty('creatorId')) {
                        nocreatorDevices[device.id] = device.metrics.title;
                        item.creatorId = 0;
                    }
                    //change creatorId for WeatherUnderground devices
                    //"creatorId":"current_79", "forecast_79", "forecastToday_79", ...
                    if (isNaN(item.creatorId)) {
                        wrongcreatorDevices[device.id] = device.metrics.title;
                        var pos = item.creatorId.indexOf('_');
                        if (pos > 0) {
                            item.creatorId = item.creatorId.substring(pos + 1) * 1;
                        }
                    }
                    devArray.push(item);
                    allDevices[device.id] = device.metrics.title;

                    objTemp[device.id] = (objTemp[device.id] || 0) + 1;
                } else {
                    hiddenDevices[device.id] = device.metrics.title;
                }
            });

            //filter multiple created devices
            var arrTemp = Object.keys(objTemp).filter(function(key) {
                return objTemp[key] >= 2;
            }).sort().forEach(function(key) {
                multiCreatedDeviceIds[key] = objTemp[key];
            });

            continueWork('getDeviceData', ++dataCollected);
        }
    } //getDeviceData

    function getModuleData() {
        var url = razberryURL + '/ZAutomation/api/v1/modules';
        if (useTestData) {
            url = 'testData/modules.json';
        }
        ch_utils.displayMessage(26);
        ch_utils.ajax_get(url, success, fail);
        function success (data) {
            var moduleInput = data;
            //input data
            moduleArray = moduleInput.data;
            //device keys per module
            moduleDeviceKeys = getModuleDeviceKeys(moduleInput.data);

            continueWork('getModuleData', ++dataCollected);
        }
        function fail (status, statusText) {
           if (status === 404) {
                continueWork('getModuleData', ++dataCollected);
            } else {
                alert(status+': '+statusText);
            }
        }
    } //getModuleData

    function getInstanceData() {
        var url = razberryURL + '/ZAutomation/api/v1/instances';
        if (useTestData) {
            url = 'testData/instances.json';
        }
        ch_utils.displayMessage(3);

        ch_utils.ajax_get(url, success);
        function success (data) {
            var instInput = data;
            instInput.data.forEach(function(instance) {
                ///remove devices of active instances
                if (instance.active)  {
                   delete inactiveDeviceIds[instance.id];
                }

                var item = {
                    title: instance.title,
                    id: instance.id,
                    moduleId: instance.moduleId
                };
                if (!instance.active) {
                    item.active = instance.active;
                    inactiveInstances.push(instance.moduleId+'-'+instance.id+': '+instance.title);
                }

                //check included devices
                var devices = [];
                var instString = JSON.stringify(instance.params);
                devArray.forEach(function(dev) {
                    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    //if (instString.indexOf(dev.id) >= 0) {
                    if (instString.indexOf('"'+dev.id+'"') >= 0) {
                        devices.push(dev.id);
                    }
                });
                if (devices.length > 0) {
                    item.devices = uniqueArray(devices.sort());
                }
                instArray0.push(item);
            });

            //sort by instance title
            instArray0.sort(function(a, b) {
                if (a.title < b.title) {
                    return -1;
                }
                if (a.title > b.title) {
                    return 1;
                }
                return 0;
            });

            //instance devices per module keys
            instArray1 = getInstanceDevicesPerKeys(instArray0, instInput.data); //!!!!!!!!!!!!!!!!!!!!!

            //missing devices
            missingDevices = uniqueArray(missingDevices.sort());

            //sort by device title
            devArray.sort(function(a, b) {
                if (a.title < b.title) {
                    return -1;
                }
                if (a.title > b.title) {
                    return 1;
                }
                return 0;
            });

            continueWork('getInstanceData', ++dataCollected);
        }
    } //getInstanceData

    function continueWork(triggerFunction, dataCollected) {
        //console.log('continueWork: '+triggerFunction+' '+dataCollected);
        //if device data are collected we continue requesting instance data
        if (dataCollected === 1) {
            getModuleData();
        }
        //if device data are collected we continue requesting instance data
        if (dataCollected === 2) {
            getInstanceData();
        }
        //if all data are collected we can go on
            else if (dataCollected >= 3) {
            exploitData();
        }
    } //continueWork

    function getModuleDeviceKeys(moduleArray) {
        var arr = [];
        function step(mx, devArrayTmp, lastKey) {
            Object.keys(mx).forEach(function(key, ix) {
                var string = JSON.stringify(mx[key]);
                var countDev = (string.match(/deviceId/g) || []).length;
                var countBr = (string.match(/{/g) || []).length;
                if (countDev > 0) {
                    if (countBr === 1) {
                        var devKey = key;
                        if (key === 'items') {
                            devKey = lastKey;
                        }
                        //TODO: spez. für Schedules
                        //ich weiss nicht, wie man das allgemeingültig lösen soll.
                        if(key === 'devicesByRoom') {
                            devArrayTmp.push(devKey+'_');
                        } else {
                            devArrayTmp.push(devKey);
                        }
                    } else if (countBr > 1) {
                        step(mx[key], devArrayTmp, key);
                    }
                }
            });
        } //step

        moduleArray.forEach(function(module) {
            var mx = module;
            var string = JSON.stringify(mx);
            var item;
            if (string.indexOf('deviceId') >= 0) {
                var devArrayTmp = [];
                step(mx, devArrayTmp);
                item = { moduleName: mx.moduleName };
                item.deviceKeys = uniqueArray(devArrayTmp.sort());
            }
            else {
                //default key
                //for example for automatics rules:
                item = { moduleName: mx.moduleName };
                item.deviceKeys = ['deviceId'];
                item.comment = 'default key';
            }
            item.keysCount = item.deviceKeys.length;
            arr.push(item);
        });
        return arr;
    } //getModuleDeviceKeys

    function getInstanceDevicesPerKeys(instArray0, instInput) {
        if (moduleDeviceKeys.length === 0) {
            return instArray0;
        }
        var arr = [];
        instArray0.forEach(function(inst, ix) {
            var item = {title: inst.title,
                        id: inst.id,
                        moduleId: inst.moduleId
                       };
            if (inst.active === false) {item.active = false;}
            try {
                var devKeyArr =
                moduleDeviceKeys.filter(function(mod) {
                        return mod.moduleName === inst.moduleId;
                    })[0].deviceKeys;
                var devs = getInstDevByKey(inst.id, devKeyArr, instInput);
                if (devs.length > 0 || inst.devices.length > 0) {
                    item.devices = uniqueArray(inst.devices.concat(devs).sort());
                    var missingArray = devs.diff(inst.devices);
                    if (missingArray.length > 0) {
                        inst.missingDevices = missingArray;
                        missingDevices = missingDevices.concat(missingArray);

                        missingArray.forEach(function(devId) {
                            if (allDevices[devId] === undefined) {
                                allDevices[devId] = '* '+devId;
                                var item = {title: '* '+devId,
                                        id: devId,
                                        creatorId: -1,
                                        deviceType: 'missing device',
                                        probeType: null,
                                        probeTitle: null,
                                        missing: true,
                                        icon: "missing_device.png"
                                };
                                devArray.push(item);
                            }
                        });
                    }
                }
            } catch(err) {
                //moduleDeviceKeys.filter(...)[0] is undefined
                //alert(inst.id+' '+err.message);
            }
            arr.push(item);

            allDevices = sortObject(allDevices);
        });
        return arr;
    } //getInstanceDevicesPerKeys

    //sort device list by id
    function sortObject(obj) {
        return Object.keys(obj).sort().reduce(function (result, key) {
            result[key] = obj[key];
            return result;
        }, {});
    } //sortObject

    Array.prototype.diff = function (a) {
        return this.filter(function (i) {
            return a.indexOf(i) === -1;
        });
    };

    function getInstDevByKey(instId, devKeyArr, instInput) {
        var arr = [];
        try {
            instInput.some(function(inst) {
                if (inst === undefined) {
                    return false;
                }
                if (inst.id === instId) {
                    //arr.push(inst.moduleId);
                    var instString = JSON.stringify(inst.params);
                    devKeyArr.forEach(function(devKey) {
                        //arr.push(devKey);

                        var repstring = '"'+devKey+'"\s*:\s*"[^"]*"';
                        if (devKey.indexOf('_') === devKey.length-1) {
                            repstring = '"'+devKey+'[^"]*"\s*:\s*"[^"]*"';
                        }
                        var re = new RegExp(repstring,"g");
                        var res = instString.match(re);
                        var i, str, pos1, pos2;
                        if (res && res.length > 0) {
                            for (i = 0; i < res.length; i++) {
                                str = res[i];
                                pos2 = str.length;
                                pos1 = str.lastIndexOf('"', pos2-2);
                                arr.push(str.substring(pos1+1, pos2-1));
                            }
                        }

                        //funktioniert nicht:
                        //var repstring = '"'+devKey+'"\s*:\s*\[.*\]';
                        instString = instString.replace(/\[/g, '§').replace(/\]/g, '§');
                        repstring = '"'+devKey+'"\s*:\s*§[^§]*§';
                        re = new RegExp(repstring,"g");
                        res = instString.match(re);
                        if (res && res.length > 0) {
                            for (i = 0; i < res.length; i++) {
                                str = res[i];
                                pos2 = str.length;
                                pos1 = str.lastIndexOf('§', pos2-2);
                                str = str.substring(pos1+1, pos2-1);
                                if (str !== '') {
                                    //funktioniert nicht:
                                    //repstring = '"[^"]*"';
                                    //re = new RegExp(repstring,"g");
                                    //res = str.match(re);
                                    //if (res && res.length > 0) {
                                    //    arr = arr.concat(res);
                                    //}
                                    var pos0 = -1;
                                    while (true) {
                                        pos1 = str.indexOf('"', pos0+1);
                                        if (pos1 < 0) {break;}
                                        pos2 = str.indexOf('"', pos1+1);
                                        if (pos2 < 0) {break;}
                                        arr.push(str.substring(pos1+1, pos2));
                                        pos0 = pos2;
                                    }
                                }
                            }
                        }
                    });
                    return true;
                }
            });
        } catch(err) {
            alert(instId, err.message);
            arr.push(err.message);
        }

        return uniqueArray(arr.sort());
    } //getInstDevByKey

    function uniqueArray(arrArg) {
        return arrArg.filter(function(elem, pos, arr) {
            return arr.indexOf(elem) === pos;
        });
    } //uniqueArray

    function exploitData() {
        //display device list
        printJSON(devArray, 6, devArray.length.toString());

        //build dependence tree for devices
        var devDependence = [];
        devArray.forEach(function(dev) {
            devDependence.push(dependsDev(dev.id));
        });

        //build dependence tree for instances
        var instDependence = [];
        instArray1.forEach(function(inst) {
            instDependence.push(dependsInst(inst.id));
        });

        //build reverse dependence tree for devices
        var revDevDependence = [];
        devArray.forEach(function(dev) {
            revDevDependence.push(revDependsDev(dev.id));
        });

        //build reverse dependence tree for instances
        var revInstDependence = [];
        instArray1.forEach(function(inst) {
            var item = {
                title: inst.title,
                id: inst.id,
                moduleId: inst.moduleId
            };
            if (inst.active === false) {item.active = false;}
            var devices = [];
            devArray.forEach(function(dev) {
                if (dev.creatorId === inst.id) {
                    devices.push(revDependsDev(dev.id));
                    //return true;
                }
            });
            if (devices.length > 0) {
                item.devices = devices;
            }
            revInstDependence.push(item);
        });

        buildSelectBoxes ();

        //------------- functions -----------------------------------------------

        function getDeviceMetric(devId, metric, devText) {
            var url = razberryURL + '/ZAutomation/api/v1/devices/'+devId;
            var currMetric, val;
            
            ch_utils.ajax_get(url, success, fail, undefined, false);
            function success (buff) {
                val = buff.data.metrics[metric];
                currMetric = 'current '+metric+'='+val;
                currMetric += '\nupdateTime='+ch_utils.userTime(buff.data.updateTime);
            }
            function fail (status, statusText) {
                currMetric = 'error reading '+metric+': '+statusText;
            }
            
            if (devText) {
                alert(devText+'\n'+currMetric+'\n');
            } else {
                return val;
            }
        } //getDeviceMetric

        function drawGraph() {
            //check if device or instance selected
            if (deviceIdselected === '' && instanceIdselected === 0) {
                ch_utils.displayMessage(4);
                return;
            }
            if (deviceIdselected !== '' && instanceIdselected > 0) {
                ch_utils.displayMessage(4);
                return;
            }
            var titleSelected;

            //set area visible
            ch_utils.displayMessage(5);
            cyJSON = undefined;
            testArrayNodes = ['Nodes'];
            testArrayEdges = ['Edges:'];


            if (jsVisible) {
                jsEl.style.display = "none";
                jsVisible = false;
            }
            if (listVisible) {
                listEl.style.display = "none";
                listVisible = false;
            }
            if (cyVisible) {
                ++ix_cyLayout;  //walk through all layouts
            }
            if (!cyEl) {
                $("body").append('<pre id="cy"></pre>');
                cyEl = document.getElementById('cy');
                cyVisible = true;
            } else {
                cyEl.style.display = "inherit";
                cyVisible = true;
            }

            //cytoscape object http://js.cytoscape.org/#cy.$
            var cy = cytoscape({
                container: cyEl,
                elements: [],
                style: cytoscape.stylesheet()
                    .selector('node')
                    .css({'//content': 'data(id)',
                            'label': 'data(title)',
                            //'width': '20px',
                            //'height': '20px',
                            'width': 'data(size)',
                            'height': 'data(size)',
                            'background-image': 'data(image)',
                            'background-color': 'data(bordercolor)',
                            'background-fit': 'contain',
                            'background-clip': 'none',
                            "font-size": 'data(fontsize)',
                            "color": 'data(fontcolor)',
                            'font-weight': 'bolder',
                            'border-width': 'data(borderwidth)',
                            'border-color': 'data(bordercolor)'
                        })
                    .selector('edge')
                    .css({'curve-style': 'bezier',
                          'target-arrow-shape': 'triangle',
                          'line-color': 'data(color)',
                          //'line-style': 'dotted',
                          'line-style': 'data(linestyle)',
                          'target-arrow-color': 'data(color)',
                          'opacity': 0.6,
                          'width': 1
                         }),
                hideEdgesOnViewport: false,
                textureOnViewport: false,
                wheelSensitivity: 1,
                motionBlur: true
            }); //cy

  			// demo your core ext
  			cy.contextMenus({
                menuItems: [
                    {
                        id: 'draw',
                        content: messageFormats[28][lang],
                        tooltipText:  messageFormats[29][lang],
                        selector: 'node',
                        onClickFunction: function (event) {
                            var target = event.target || event.cyTarget;
                            var nodeId = target.id();
                            var isDevice = isNaN(nodeId);
                            var elId;
                            var i;
                            if (!isDevice) {
                                instanceIdselected = nodeId*1;
                                elId = document.getElementById('selInstance');
                                for (i = 0; i < elId.options.length; ++i) {
                                    if (elId.options[i].value === nodeId) {
                                        elId.selectedIndex = i;
                                        break;
                                    }
                                }

                                elId = document.getElementById('selDevice');
                                elId.selectedIndex = 0;
                                deviceIdselected = '';
                             } else {
                                deviceIdselected = nodeId;
                                elId = document.getElementById('selDevice');
                                for (i = 0; i < elId.options.length; ++i) {
                                    if (elId.options[i].value === nodeId) {
                                        elId.selectedIndex = i;
                                        break;
                                    }
                                }

                                elId = document.getElementById('selInstance');
                                elId.selectedIndex = 0;
                                instanceIdselected = '';
                             }
                             ix_cyLayout = -1;
                             drawGraph();
                        },
                        //hasTrailingDivider: true,
                        disabled: false
                    },
                    {
                        id: 'htlm',
                        content:  messageFormats[38][lang],
                        tooltipText:  messageFormats[39][lang],
                        selector: 'node',
                        onClickFunction: function (event) {
                            var target = event.target || event.cyTarget;
                            var nodeId = target.id();
                            var isDevice = isNaN(nodeId);
                            var URL;
                            if (!isDevice) {
                                instanceIdselected = nodeId*1;
                                deviceIdselected = '';
                                URL = '/smarthome/#/module/put/'+instanceIdselected;
                             } else {
                                deviceIdselected = nodeId;
                                instanceIdselected = '';
                                URL = '/ZAutomation/api/v1/devices/'+deviceIdselected;
                             }
                             window.open(URL);
                        },
                        disabled: false,
                        show: true
                    },
                    {
                        id: 'dispData',
                        content:  messageFormats[30][lang],
                        tooltipText:  messageFormats[31][lang],
                        selector: 'node',
                        onClickFunction: function (event) {
                            alert('dispData');
                        },
                        disabled: true,
                        show: false
                    }
                ],
                menuItemClasses: ['custom-menu-item'],
                contextMenuClasses: ['custom-context-menu']
            });

            //reset txt
            graphTXT = '';
            graphTXTNL = false;

            //enter objects
            var ix_cyEdge = 0;
            var edgeStack = [];
            if (deviceIdselected !== '') { //device selected
                graphTXTNL = true;
                graphTXTDir = false;
                graphTXTRange = 0;
                devDependence.some(function (dev) {
                        if (dev === undefined) {
                            return false;
                        }
                        if (dev.id === deviceIdselected) {
                            titleSelected = dev.title;
                            cyAddNode (dev.id, dev.title, null, dev.deviceType, dev.probeType,
                                       dev.probeTitle, dev.icon, 'blue', 'hexagon');
                            if (dev.instance) {
                                    cyAddInstance(dev, dev.instance, 'green', false);
                            }
                            return true;
                        }
                });
                graphTXTNL = true;
                graphTXTDir = true;
                graphTXTRange = 0;
                revDevDependence.some(function (dev) {
                        if (dev === undefined) {
                            return false;
                        }
                        if (dev.id === deviceIdselected) {
                            titleSelected = dev.title;
                            if (dev.instances) {
                                    cyAddInstances(dev, dev.instances, 'red', true);
                            }
                            return true;
                        }
                });
            } else {        //instance selected
                graphTXTNL = true;
                graphTXTDir = false;
                graphTXTRange = 0;

                instDependence.some(function (inst) {
                        if (inst === undefined) {
                            return false;
                        }
                        if (inst.id === instanceIdselected) {
                            titleSelected = inst.title;
                            var icon = 'assets/module_active.png';
                            if (inst.active === false) {
                                icon = 'assets/module_inactive.png';
                            }
                            //icon = modulemedia.replace('###', inst.moduleId);
                            cyAddNode (inst.id, inst.title, inst.moduleId, null, null, null, icon,
                                       'blue', 'ellipse');
                            if (inst.devices) {
                                    cyAddDevices(inst, inst.devices, 'green', false);
                            }
                            return true;
                        }
                });

                graphTXTNL = true;
                graphTXTDir = true;
                graphTXTRange = 0;
                revInstDependence.some(function (inst) {
                        if (inst === undefined) {
                            return false;
                        }
                        if (inst.id === instanceIdselected) {
                            titleSelected = inst.title;
                            if (inst.devices) {
                                    cyAddDevices(inst, inst.devices, 'red', true);
                            }
                            return true;
                        }
                });
            }

            if (ix_cyLayout < 0 || ix_cyLayout >= cyLayouts.length){ix_cyLayout = 0;}
            cyLayout = cyLayouts[ix_cyLayout];
            ch_utils.displayMessage(12, titleSelected, ix_cyLayout+' '+cyLayout);
            cy.layout({name: cyLayout}).run();
            cyJSON = cy.json(); //JSON.parse(JSON.stringify(cy.json()));

            cy.on('tap', 'node', function(evt){
                var node = evt.target;
                var id = node.id();
                //alert(id);
                var elNode = cy.getElementById(id);

                //display current level if node is device
                var nodeId = elNode.id();
                var isDevice = isNaN(nodeId);
                if (!isDevice) {
                    alert(elNode.data('label'));
                } else {
                    getDeviceMetric(nodeId, 'level', elNode.data('label'));
                }
            }); //cy.on

            function cyAddInstance (dev, inst, color, rev) {
                graphTXTRange += 1;
                if (inst.id > 1) {
                    var icon = 'assets/module_active.png';
                    if (inst.active === false) {
                        icon = 'assets/module_inactive.png';
                    }
                    cyAddNode (inst.id, inst.title, inst.moduleId, null, null, null, icon, color, 'ellipse');
                    cyAddEdge (inst.id, dev.id, rev, (dev.creatorId < 0 ? 'dashed' : 'solid'));
                    if (inst.devices) {
                        cyAddDevices(inst, inst.devices, color, rev);
                    }
                }
                graphTXTRange -= 1;
            } //cyAddInstance

            function cyAddNode (id, title, label, deviceType, probeType, probeTitle, icon, color, shape) {
                //console.log(title+' '+icon);
                var i = id+'';
                var el = cy.getElementById(i);
                var n = shape === 'hexagon' ? 14 : 15;
                var size = '20px';
                var fontsize = '5px';
                var fontcolor = 'black';
                if (color === 'blue') {
                    fontcolor = 'red';
                    size = '40px';
                    fontsize = '10px';
                }
                var info;
                var pT;
                try {
                if (el.empty()) {
                    var iconFound;
                    if (i.indexOf("ZWayVDev_zway_") === 0) {        //physical device
                        iconFound = getUserIcon(icon, i);
                        pT = (probeTitle !== null ? '-'+probeTitle : '') +
                             (probeType !== null ? '-'+probeType : '')+'\n';
                        info = title+'\n'+i+'\n'+deviceType+pT;
                        //info += '\n'+iconFound;
                        cy.add({data: {id: i, title: title, label: info, image: iconFound,
                                size: size, fontsize: fontsize, fontcolor: fontcolor,
                                borderwidth: '2.5px', bordercolor: 'yellow'
                        }});
                        testArrayNodes.push('device id: '+i+', title: '+title);
                    } else if (n === 14) {                          //virtual device
                        iconFound = getUserIcon(icon, i);
                        pT = (probeTitle !== null ? '-'+probeTitle : '') +
                             (probeType !== null ? '-'+probeType : '')+'\n';
                        info = title+'\n'+i+'\n'+deviceType+pT;
                        //info += '\n'+iconFound;
                        cy.add({data: {id: i, title: title, label: info, image: iconFound,
                                size: size, fontsize: fontsize, fontcolor: fontcolor,
                                borderwidth: '0px', bordercolor: 'white'
                        }});
                        testArrayNodes.push('device id: '+i+', title: '+title);
                    } else {                                        //module
                        info = title+'\n'+label+'-'+i;
                        cy.add({data: {id: i, title: title, label: info, image: icon,
                                size: size, fontsize: fontsize, fontcolor: fontcolor,
                                borderwidth: '0px', bordercolor: 'white'
                        }});
                        testArrayNodes.push('module id: '+i+', title: '+title);
                    }
                }
                } catch (err) {
                        alert(err.message);
                }

                var str;
                if (n === 14) {
                    str = ch_utils.buildMessage(n, id+'/'+title)+' ';
                    //str = messageFormats[n][lang].sprintf(id+'/'+title)+' ';
                } else {
                    str = ch_utils.buildMessage(n, label+'-'+id+'/'+title)+' ';
                    //str = messageFormats[n][lang].sprintf(label+'-'+id+'/'+title)+' ';
                }

                var d = graphTXTDir === false ? '   <=== ' : '   ===> ';
                if (graphTXT.length === 0) {
                    graphTXTTitle = str;
                    d = '';
                    graphTXTNL = true;
                    graphTXT += '\n'+d+str;
                } else {
                    if (graphTXTNL) {
                        graphTXT += '\n';
                        graphTXTNL = false;
                    }
                    graphTXT += '\n'+graphTXTRange+d+' '.repeat(graphTXTRange*3)+str;
                }
            } //cyAddNode

            function cyAddEdge (source, target, rev, linestyle) {
                var src = source+'';
                var t = target+'';
                var col = 'blue';
                if (rev) {
                    src = target+'';
                    t = source+'';
                    col = 'orange';
                }
                var cond = "[target='"+t+"'][source='"+src+"']";
                var el = cy.edges(cond);
                var edgeExisting = !el.empty();
                if (rev && edgeExisting) {
                    cy.remove(cond);
                    edgeExisting = false;
                }
                if (!edgeExisting) {
                    ++ix_cyEdge;
                    cy.add({data: {id: 'E'+ix_cyEdge, source: src, target: t, color: col,
                                   linestyle: linestyle||'solid'}});
                }
                testArrayEdges.push('id: '+ix_cyEdge+', source: '+src+', target: '+t);
            } //cyAddEdge

            function cyAddInstances (dev, instances, color, rev) {
                graphTXTRange += 1;
                instances.forEach(function (inst) {
                if (inst.id > 1) {
                    var icon = 'assets/module_active.png';
                    if (inst.active === false) {
                        icon = 'assets/module_inactive.png';
                    }
                    //icon = modulemedia.replace('###', inst.moduleId);
                    cyAddNode (inst.id, inst.title, inst.moduleId, null, null, null, icon, color, 'ellipse');
                    cyAddEdge (inst.id, dev.id, rev, (dev.creatorId < 0 ? 'dashed' : 'solid'));
                    if (inst.devices) {
                        cyAddDevices(inst, inst.devices, color, rev);
                    }
                }
                });
                graphTXTRange -= 1;
            } //cyAddInstances

            function cyAddDevices (inst, devices, color, rev) {
                graphTXTRange += 1;
                devices.forEach(function (dev) {
                    cyAddNode (dev.id, dev.title, null, dev.deviceType, dev.probeType, dev.probeTitle, dev.icon, color, 'hexagon');
                    cyAddEdge (dev.id, inst.id, rev, (dev.creatorId < 0 ? 'dashed' : 'solid'));
                    if (dev.instances) {
                        cyAddInstances(dev, dev.instances, color, rev);
                    }
                    if (dev.instance) {
                        cyAddInstance(dev, dev.instance, color, rev);
                    }
                 });
                graphTXTRange -= 1;
            }

            function getUserIcon(icon, nodeId) {
                //console.log(nodeId+': '+icon);
                if (icon.indexOf('http:/') === 0) {
                    //we don't request icons from remote (async=false)
                    //perhaps we find a local matching icon
                    icon = icon.replace(/^.*\//, '')
                               .replace(/\.png$/, '');
                }
                if (icon.indexOf('.png') > 0) {
                    return icon;
                }
                //var folder1 = '../../storage/img/icons/';
                var folder1 = urlIcons;
                var folder2 = 'assets/';
                var ret;

                if (icon.indexOf('/') < 0 && icon.indexOf('.') < 0) {
                    ret = getIconFile(icon, folder1, nodeId);
                    if (ret === undefined) {
                        ret = folder1+'placeholder.png';
                    }
                    return ret;
                }

                if (icon.indexOf('/modulemedia/') >= 0) {
                    icon = icon.replace(/.*\/modulemedia\//, '');
                    ret = getIconFile(icon, folder2, nodeId);
                    if (ret !== undefined) {
                        return ret;
                    }
                }

                icon = icon.replace(/^.*\//, '');
                ret = getIconFile(icon, folder2, nodeId);
                if (ret === undefined) {
                    ret = getIconFile(icon, folder1, nodeId);
                }

                if (ret === undefined) {
                    ret = getIconFile(icon, folder1, nodeId);
                }
                if (ret === undefined) {
                    ret = folder1+'placeholder.png';
                }
                return ret;
             } //getUserIcon

            function getIconFile(icon, folder, nodeId) {
                //console.log(icon+', '+folder+', '+nodeId);
                //read file
                var ret, val;
                if (icon.indexOf('battery') === 0) {icon = 'battery';}
                if (icon.indexOf('temperature') === 0) {icon = 'temperature';}
                if (icon.indexOf('humidity') === 0) {icon = 'humidity';}
                if (icon.indexOf('blinds') === 0) {icon = 'blind';}
                icon = icon.replace('-off', '')
                           .replace('-on', '')
                           .replace('_off', '')
                           .replace('_on', '');
                icon = icon.replace('-off', '')
                           .replace('-on', '')
                           .replace('_off', '')
                           .replace('_on', '');
                if (['switch', 'alarm', 'co-alarm', 'coo-alarm', 'cooling', 'burglar-alarm', 'dimmer',
                     'event-device', 'fan', 'flood', 'motion', 'security', 'siren', 'smoke', 'tamper',
                     'temper', 'valve', 'door', 'window', 'blind', 'lock'].indexOf(icon) >= 0) {
                    val = getDeviceMetric(nodeId, 'level');
                    if (val !== undefined) {
                        if (['door', 'window', 'lock'].indexOf(icon) >= 0) {
                            if (val === 'on') {val = 'open';}
                            else
                            if (val === 'off') {val = 'closed';}
                        }
                        else
                        if (['blind'].indexOf(icon) >= 0) {
                            if (val === 0) {
                                val = 'down';
                            }
                            else
                            if (val === 99) {
                                val = 'up';
                            }
                            else {
                                val = 'half';
                            }
                        }
                        if (val === 'open') {val = 'open';}
                        else
                        if (val === 'close') {val = 'closed';}
                        icon = icon+'-'+val;
                    }
                }

                var fil = folder+icon;
                if (icon.indexOf('.png') < 0) {
                    fil = fil+'.png';
                }

                ch_utils.ajax_get(fil, success, fail, undefined, false);
                function success (data) {
                    ret = fil;
                }
                function fail (status, statusText) {
                    //if not found
                    if (status === 404) {
                        ch_utils.ajax_get(folder, success, undefined, undefined, false);
                    } else {
                    alert(status+': '+statusText);
                    }
                    function success (data) {
                         var filFound;
                         //looping through folder
                         $(data).find("a:contains(.png)").each(function(){
                            filFound = $(this).attr("href");
                            if (filFound.indexOf(icon+'-') === 0 ||
                                filFound.indexOf(icon+'_') === 0) {
                                ret = folder+filFound;
                            }
                         });
                    }
                }

                return ret;
             } //getIconFile

        } //drawGraph

        function printJSON (objectJSON, text_id, text_add) {
            if (cyVisible) {
                //alert('cyEl');
                cyEl.style.display = "none";
                cyVisible = false;
            }
            if (listVisible) {
                //alert('listEl');
                listEl.style.display = "none";
                listVisible = false;
            }
            if (!jsEl) {
                $("body").append('<pre id="json-renderer"></pre>');
                jsEl = document.getElementById("json-renderer");
                jsVisible = true;
            } else {
                jsEl.style.display = "inherit";
                jsVisible = true;
            }

            ch_utils.displayMessage(text_id, text_add);
            //if whole array to print
            var objectPrint = objectJSON;

            //if select
            if (Array.isArray(objectJSON) && objectJSON.length > 0) {
                //if device selected
                if (objectJSON[0].creatorId) {
                    if (deviceIdselected.length > 0) {
                        objectJSON.some(function(entry) {
                            if (entry === undefined) {
                                return false;
                            }
                            if (entry.id === deviceIdselected) {
                                objectPrint = entry;
                                return true;
                            }
                        });
                    }
                //if instance selected
                } else if (objectJSON[0].moduleId) {
                    if (instanceIdselected > 0) {
                        objectJSON.some(function(entry) {
                            if (entry === undefined) {
                                return false;
                            }
                            if (entry.id === instanceIdselected) {
                                objectPrint = entry;
                                return true;
                            }
                        });
                   }
                }
            }

            $('#json-renderer').jsonViewer(objectPrint, {
                collapsed: false,
                withQuotes: false,
                withLinks: true
            });
        } //printJSON

        function printTXT (objectTXT, text_id, text_add) {

            if (cyVisible) {
                //alert('cyEl');
                cyEl.style.display = "none";
                cyVisible = false;
            }
            if (jsVisible) {
                //alert('jsEl');
                jsEl.style.display = "none";
                jsVisible = false;
            }
            if (!listEl) {
                $("body").append('<pre id="list"></pre>');
                listEl = document.getElementById("list");
                listVisible = true;
            } else {
                listEl.style.display = "inherit";
                listVisible = true;
            }

            ch_utils.displayMessage(text_id, text_add);
            document.getElementById('list').innerHTML = graphTXT;

        } //printTXT

        function buildSelectBoxes () {
            var elId;
            var i;
            var option;

            //devices
            elId = document.getElementById('selDevice');
            i = 0;
            option = new Option(messageFormats[ix_selectTexts+2][lang], '');
            elId.options[i++] = option;
            devArray.forEach(function(entry) {
                option = new Option(entry.title, entry.id);
                elId.options[i++] = option;
            });

            //instances
            elId = document.getElementById('selInstance');
            i = 0;
            option = new Option(messageFormats[ix_selectTexts+2][lang], '');
            elId.options[i++] = option;
            instArray1.forEach(function(entry) {
                if (entry.id > 1) {
                    //option = new Option(entry.id+': '+entry.title, entry.id);
                    option = new Option(entry.title+' (#'+entry.id+')', entry.id);
                    elId.options[i++] = option;
                }
            });
         } //buildSelectBoxes

        //------------- event listeners -----------------------------------------------

        document.getElementById('devices').addEventListener('click', function() {
            printJSON(devArray, 6, devArray.length.toString());
        });

        document.getElementById('modules').addEventListener('click', function() {
            printJSON(moduleArray, 21, moduleArray.length);
        });

        document.getElementById('modulesDevices').addEventListener('click', function() {
            printJSON(moduleDeviceKeys, 21, moduleDeviceKeys.length);
        });

        document.getElementById('instances').addEventListener('click', function() {
            printJSON(instArray1, 7, instArray1.length.toString());
        });

        document.getElementById('deviceTree').addEventListener('click', function() {
            printJSON(devDependence, 8);
        });

        document.getElementById('instanceTree').addEventListener('click', function() {
            printJSON(instDependence, 9);
        });

        document.getElementById('revDeviceTree').addEventListener('click', function() {
            printJSON(revDevDependence, 10);
        });

        document.getElementById('revInstanceTree').addEventListener('click', function() {
            printJSON(revInstDependence, 11);
        });

        document.getElementById('inactiveInstances').addEventListener('click', function() {
            printJSON(inactiveInstances, 35, inactiveInstances.length.toString());
        });

        document.getElementById('orphanedDevices').addEventListener('click', function() {
            printJSON(orphanedDevices, 22, Object.keys(orphanedDevices).length.toString());
        });

        document.getElementById('missingDevices').addEventListener('click', function() {
            printJSON(missingDevices, 23, missingDevices.length.toString());
        });

        document.getElementById('nocreatorDevices').addEventListener('click', function() {
            printJSON(nocreatorDevices, 24, Object.keys(nocreatorDevices).length.toString());
        });

        document.getElementById('wrongcreatorDevices').addEventListener('click', function() {
            printJSON(wrongcreatorDevices, 25, Object.keys(wrongcreatorDevices).length.toString());
        });

        document.getElementById('failedDevices').addEventListener('click', function() {
            printJSON(failedDevices, 32, Object.keys(failedDevices).length.toString());
        });

        document.getElementById('hiddenDevices').addEventListener('click', function() {
            printJSON(hiddenDevices, 33, Object.keys(hiddenDevices).length.toString());
        });

        document.getElementById('multiCreatedDeviceIds').addEventListener('click', function() {
            printJSON(multiCreatedDeviceIds, 36, Object.keys(multiCreatedDeviceIds).length.toString());
        });

        document.getElementById('inactiveDeviceIds').addEventListener('click', function() {
            var count = 0;
            Object.keys(inactiveDeviceIds).forEach(function(instNo, ix) {
                count += inactiveDeviceIds[instNo].length;
            });
            printJSON(inactiveDeviceIds, 37, count.toString());
        });

        document.getElementById('allDevices').addEventListener('click', function() {
            printJSON(allDevices, 34, Object.keys(allDevices).length.toString());
        });

        document.getElementById('graph').addEventListener('click', function() {
            drawGraph();
        });

        document.getElementById('graphJSON').addEventListener('click', function() {
            if (cyJSON === undefined) {
               printJSON(testArrayNodes.concat(testArrayEdges), 13);
            } else {
               printJSON(cyJSON, 13);
            }
        });

        $('#graphTXT').click(function() {
            //alert('graphTXT');
            if (graphTXT.length === 0) {
                ch_utils.displayMessage(17);
            } else {
                printTXT(graphTXT, 16, graphTXTTitle);
            }
        });

        $('#graphTXTStore').click(function() {
            //alert('graphTXTStore');
            if (graphTXT.length === 0) {
                ch_utils.displayMessage(17);
            } else {
                download('dependencies.txt', graphTXT);
            }
        });

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
            var blob = new Blob([text], { type: 'text/text;charset=utf-8;' });
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

        document.getElementById('selDevice').addEventListener('click', function() {
            ix_cyLayout = -1; //reset
            deviceIdselected = this.value;
            cyJSON = undefined;

            if(deviceIdselected.length > 0) {
                var elId = document.getElementById('selInstance');
                elId.selectedIndex = 0;
                instanceIdselected = '';
            }
        }, true);

        document.getElementById('selInstance').addEventListener('click', function() {
            ix_cyLayout = -1; //reset
            instanceIdselected = this.value * 1;
            cyJSON = undefined;

            if(instanceIdselected > 0) {
                var elId = document.getElementById('selDevice');
                elId.selectedIndex = 0;
                deviceIdselected = '';
            }
        }, true);

    } //exploitData
}); //$(document).ready

//------- function definitions -------------------------

function revDependsDev(devId) {
    var dev = devArray.find(function(dev) {
        return dev.id === devId;
    });
    var item = {
        title: dev.title,
        id: dev.id,
        creatorId: dev.creatorId,
        deviceType: dev.deviceType,
        probeType: dev.probeType,
        probeTitle: dev.probeTitle,
        icon: dev.icon
    };
    if (treeStack.indexOf('D:'+devId) < 0) {
        treeStack.push('D:'+devId);
        var instances = revDependsInst(dev.id);
        if (instances.length > 0) {
            item.instances = instances;
        }
        treeStack.pop();
    }
    return item;
} //revDependsDev

function revDependsInst(devId) {
    var instances = [];
    instArray1.forEach(function(inst) {
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
        //var pos = JSON.stringify(inst).indexOf(devId);
        var pos = JSON.stringify(inst).indexOf('"'+devId+'"');
        if (pos >= 0) {
            var item = {
                title: inst.title,
                id: inst.id,
                moduleId: inst.moduleId
            };
            if (inst.active === false) {item.active = false;}
            if (treeStack.indexOf('I:'+inst.id) < 0) {
                treeStack.push('I:'+inst.id);
                var devices = [];
                devArray.forEach(function(dev) {
                    if (dev.creatorId === inst.id) {
                        devices.push(revDependsDev(dev.id));
                    }
                });
                if (devices.length > 0) {
                    item.devices = devices;
                }
                treeStack.pop();
            }
            instances.push(item);
        }
    });
    return instances;
} //revDependsInst

function dependsInst(creatorId, devId, devTitle) {
    if (creatorId === 1) {
        return;
    }

    var item = {
        title: 'not found',
        id: creatorId,
        moduleId: 'not found'
    };

    var inst = instArray1.find(function(inst) {
        return inst.id === creatorId;
    });
    if (inst === undefined) {
        if (creatorId > 0) {
            orphanedDevices[devId] = devTitle;
            item.orphaned = true;
        }
        return item;
    }
    item.title = inst.title;
    item.moduleId = inst.moduleId;
    if (inst.active === false) {item.active = inst.active;}

    if (treeStack.indexOf('I:'+inst.id) < 0) {
        treeStack.push('I:'+inst.id);
        if (inst.devices) {
            var devices = [];
            inst.devices.forEach(function(dev) {
                devices.push(dependsDev(dev));
            });
            if (devices.length > 0) {
                item.devices = devices;
            }
        }
        treeStack.pop();
    }
    return item;
} //dependsInst

function dependsDev(devId) {
    var dev = devArray.find(function(dev) {
        return dev.id === devId;
    });
    var item;
    var instance;
    item = {
        title: dev.title,
        id: devId,
        creatorId: dev.creatorId,
        deviceType: dev.deviceType,
        probeType: dev.probeType,
        probeTitle: dev.probeTitle,
        icon: dev.icon
    };
    if (treeStack.indexOf('D:'+devId) < 0) {
        treeStack.push('D:'+devId);
        instance = dependsInst(dev.creatorId, devId, dev.title);
        if (instance) {
            item.instance = instance;
        }
        treeStack.pop();
    }
    return item;
} //dependsDev

