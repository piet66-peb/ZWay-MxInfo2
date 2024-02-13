//h-------------------------------------------------------------------------------
//h
//h Name:         DeviceParameters.html.js
//h Type:         Javascript module
//h Purpose:      Display configuration of devices, compare parameters of 2
//h               devices.
//h               module MxInfo2
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V4.3 2023-10-12/peb
//v History:      V1.0 2020-06-04/peb first version
//v               V3.6 2020-12-05/peb [+]button 'configuration'
//v               V4.1 2021-02-26/peb [*]signed parameter values
//                V4.2 2021-03-29/peb [+]0086-0002-0064_42
//                V4.3 2022-07-19/peb [x]correct xml file parameter
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*jshint evil: true */
/*globals $, ch_utils */
/*jshint bitwise: false */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='DeviceParameters.html.js';
var VERSION='V4.3';
var WRITTEN='2023-10-12/peb';

//------------------
//b Data Definitions
//------------------
var show_invalids = false;
var update = false;

var manufacturerDoc = {133: 'https://www.fakro.com/service/user-manuals/',
                       134: 'https://aeotec.freshdesk.com/support/solutions',
                       270: 'https://danalock.com/support/',
                       271: 'https://manuals.fibaro.com/',
                       340: 'https://aeotec.freshdesk.com/support/solutions',   //Popp
                       345: 'https://support.qubino.com/support/home',
                       410: 'https://sensativesupport.zendesk.com',
                      };

var ixButtonTextBase = 24;
var ix_selectTexts = 42;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Geräteparameter',
        en: 'Device Parameters'
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
    {//4
        de: 'Konfiguration wird verarbeitet...',
        en: 'Treating configuration...'
    },
    {//5
        de: 'Bitte eine Auswahl vornehmen!',
        en: 'Please make a select!'
    },
    {
        de: '{0}',
        en: '{0}'
    },
    {
        de: '<a href="http://manuals.z-wave.info/#/" target="_blank">Handbücher</a>'+
            //alternative: http://manuals-backend.z-wave.info/make.php?lang=EN
            '&nbsp;<a href="{0}" target="_blank">ZDDX Gerätebeschreibungen</a>'+
            '&nbsp;<a href="https://products.z-wavealliance.org/" target="_blank">Produkte</a>',
            //'&nbsp;<a href="https://github.com/OpenZWave/open-zwave/tree/master/config" target="_blank">OpenZWave Geräte</a>'+
            //'&nbsp;<a href="https://www.openhab.org/addons/bindings/zwave/doc/things.html" target="_blank">OpenHAB Z-Wave Bindings</a>'+
            //'&nbsp;<a href="https://www.cd-jackson.com/index.php/zwave/zwave-device-database/zwave-device-list" target="_blank">OpenHAB Device List</a>',
        en: '<a href="http://manuals.z-wave.info/#/" target="_blank">Manuals</a>'+
            '&nbsp;<a href="{0}" target="_blank">ZDDX Device Descriptions</a>'+
            '&nbsp;<a href="https://products.z-wavealliance.org/" target="_blank">Products</a>'
            //'&nbsp;<a href="https://github.com/OpenZWave/open-zwave/tree/master/config" target="_blank">OpenZWave Devices</a>'+
            //'&nbsp;<a href="https://www.openhab.org/addons/bindings/zwave/doc/things.html" target="_blank">OpenHAB Z-Wave Bindings</a>'+
            //'&nbsp;<a href="https://www.cd-jackson.com/index.php/zwave/zwave-device-database/zwave-device-list" target="_blank">OpenHAB Device List</a>',
    },
    {
        de: 'Passende ZDDX Gerätebeschreibung zu {0} für Gerät #{1}',
        en: 'Matching ZDDX Device Description for {0} for Device #{1}'
    },
    {
        de: 'Änderung von Parameter {0} für Gerät #{1}',
        en: 'Change of Parameter {0} for Device #{1}'
    },
    {
        de: '<b>Neuer Wert: </b>',
        en: '<b>New value: </b>'
    },
    {
        de: "<b>Bedaure, der Parametertyp '{0}' wird zur Zeit nicht unterstützt!</b>",
        en: "<b>Sorry, parameter type '{0}' isn't supported yet!</b>"
    },
    {
        de: "<b>Die Parameterdefinition scheint fehlerhaft zu sein.<br><br><br><br>"+
            "Soll ein Interview für Kommandoklasse 112=Configuration<br>durchgeführt"+
            " und alle Parameter neu vom Gerät abgeholt werden?</b><br><br>",
        en: "<b>The parameter definition seems to be faulty.<br><br><br><br>"+
            "Force an interview fo Command Class 112=Configuration<br>"+
            "and newly retrieve all parameters from device?</b><br><br>"
    },
    {
        de: "Ausdruck der Parametrierung",
        en: "Parameter Printout"
    },
    {
        de: "&nbsp;&nbsp;&nbsp;auf eigenes Risiko",
        en: "&nbsp;&nbsp;&nbsp;at own risk"
    },
    {
        de: 'Änderung des Wakeup Intervalls für Gerät #{0}',
        en: 'Change of Wakeup Interval for Device #{0}'
    },
    {
        de: '<b>kein Wakeup:</b>',
        en: '<b>no Wakeup:</b>'
    },
    {
        de: 'Default: {0}',
        en: 'Default: {0}'
    },
    {
        de: '<br><b>Defaultwert setzen:</b>',
        en: '<br><b>set Default Value:</b>'
    },
    {
        de: 'Die Gerätebeschreibung ist fehlerhaft,<br> Parameterwerte müssen zwingend hexadezimal angegeben werden!',
        en: 'The Device Description is invalid,<br> parameter values must always be specified in hexadecimal!'
    },
    {
        de: 'Die Parameterlänge von {0} Bytes ist nicht spezifiziert!<br><br>',
        en: 'The parameter length of {0} bytes is not specified!<br><br>'
    },
    {
        de: '<a href="http://manuals.z-wave.info/#/" target="_blank">Handbücher</a>'+
            '&nbsp;<a href="{0}" target="_blank">ZDDX Gerätebeschreibungen</a>'+
            '&nbsp;<a href="https://products.z-wavealliance.org/" target="_blank">Produkte</a>'+
            '&nbsp;<a href="{1}" target="_blank">Hersteller-Dokumentation</a>',
        en: '<a href="http://manuals.z-wave.info/#/" target="_blank">Manuals</a>'+
            '&nbsp;<a href="{0}" target="_blank">ZDDX Device Descriptions</a>'+
            '&nbsp;<a href="https://products.z-wavealliance.org/" target="_blank">Products</a>'+
            '&nbsp;<a href="{1}" target="_blank">Manufacturer-Documentation</a>'
    },
    {
        de: 'Ungültige Eingabe!',
        en: 'Invalid input!'
    },
    {
        de: '\n\nDaten aktualisieren?',
        en: '\n\nRefresh data?'
    },

    //ixButtonTextBase button texts (24+...):
    {//24
        de: '<b>Auswahl Geräte:</b>',
        en: '<b>Select Devices:</b>'
    },
    {
        de: 'Hersteller: ',
        en: 'Manufacturer: '
    },
    {
        de: 'Gerät 1: ',
        en: 'Device 1: '
    },
    {
        de: 'Gerät 2: ',
        en: 'Device 2: '
    },
    {
        de: '<b>Auswahl der neuen Datei: </b>',
        en: '<b>Select a new File: </b>'
    },
    {
        de: 'Absenden',
        en: 'Submit'
    },
    {
        de: 'Eintrag löschen',
        en: 'Delete entry'
    },
    {
        de: 'Drucken',
        en: 'Print'
    },
    {
        de: 'Aktualisieren',
        en: 'Update'
    },
    {
        de: 'Gerät 1',
        en: 'Device 1'
    },
    {
        de: 'Gerät 2',
        en: 'Devic 2'
    },
    {
        de: 'Gerät 1+2',
        en: 'Device 1+2'
    },
    {
        de: 'alle Geräte',
        en: 'all Devices'
    },
    {
        de: 'neue Seite nach jedem Gerät',
        en: 'new page after each device'
    },
    {
        de: 'Seiten fortlaufend',
        en: 'continuous printing'
    },
    {
        de: 'Datei Speichern',
        en: 'Store File'
    },
    {
        de: 'Datei einlesen',
        en: 'Read File'
    },

    {
        de: 'Konfiguration',
        en: 'Configuration'
    },

    //ix_selectTexts select texts (42+...):
    {//42
        de: 'Keine Auswahl',
        en: 'Nothing selected'
    },
    {
        de: 'Parameter',
        en: 'Parameter'
    },
    {
        de: 'Wert',
        en: 'Value'
    },
    {
        de: 'Typ',
        en: 'Type'
    },
    {
        de: 'Bytes',
        en: 'Bytes'
    },
    {
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
        de: 'Produkt',
        en: 'Product'
    },
    {
        de: 'Gerätetyp',
        en: 'Devicetype'
    },
    {
        de: 'Firmware',
        en: 'Firmware'
    },
    {
        de: 'ZWProtokoll',
        en: 'ZWProtocol'
    },
    {
        de: 'SDK',
        en: 'SDK'
    },
    {
        de: 'Version',
        en: 'Version'
    },
    {
        de: 'ZWLib',
        en: 'ZWLib'
    },
    {
        de: 'Hardware Version',
        en: 'Hardware Version'
    },
    {
        de: 'ZDDXMLFile',
        en: 'ZDDXMLFile'
    },
    {
        de: 'Parameter',
        en: 'Parameter'
    },
    {
        de: 'Bedeutung',
        en: 'Meaning'
    },
    {
        de: 'Geräte-<br>nummer',
        en: 'Device<br>Number'
    },
    {
        de: 'Name',
        en: 'Name'
    },
    {//64
        de: 'Datei: ',
        en: 'File: '
    },
    {
        de: 'Handbuch: ',
        en: 'Manual: '
    },
    {
        de: 'Default',
        en: 'Default'
    },
    {
        de: 'Bytes',
        en: 'Bytes'
    },
    {
        de: 'Z-Wave Plus Version',
        en: 'Z-Wave Plus Version'
    },
];

var devicesConfig;
var devicesArray;
var manufacturerArray;
var devicesList;
var manufacturerSelected, devNumKeySelected1, devNumKeySelected2;
var html1, html2;
var ZDDXArray = [];
var ZDDXArray2 = {};
var hashStrong_1, hashStrong_2, Firmware_1, Firmware_2, HashStrong_1, HashStrong_2;
var device_curr, param_curr, length_curr;
var frequency, scaleTitleTemp;

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get server url
    var urlServer = window.location.href.replace(/:8083.*$/, ':8083');
    var urlZDDX = urlServer + '/ZDDX/';
    var urlData = '/ZWaveAPI/Data/0';

    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();
    langTexts();

    //checkLogin (function() {startDatacollection();});
    startDatacollection();

    var valueConvert;
    //for convert parameter-values intern <> user defined
    var paramConvertArray = {
        '0086-0002-0064': {name: 'Aeotec Multisensor 6 ZW100-C CEPT',
                           '41': '0086-0002-0064_41',
                           '42': '0086-0002-0064_42',
                           '49': '0086-0002-0064_49',
                           '50': '0086-0002-0064_50',
                           '81': '0086-0002-0064_81',
                           '201': '0086-0002-0064_201'
                          },
        '0086-0102-0064': {name: 'Aeotec Multisensor 6 ZW100-A U.S. / Canada / Mexico',
                           '41': '0086-0002-0064_41',
                           '42': '0086-0002-0064_42',
                           '49': '0086-0002-0064_49',
                           '50': '0086-0002-0064_50',
                           '81': '0086-0002-0064_81',
                           '201': '0086-0002-0064_201'
                          },
        '0086-0202-0064': {name: 'Aeotec Multisensor 6 ZW100-B Australia, NZL, Brasil',
                           '41': '0086-0002-0064_41',
                           '42': '0086-0002-0064_42',
                           '49': '0086-0002-0064_49',
                           '50': '0086-0002-0064_50',
                           '81': '0086-0002-0064_81',
                           '201': '0086-0002-0064_201'
                          },
        '0086-0302-0064': {name: 'Aeotec Multisensor 6 ZW100-D Hong Kong',
                           '41': '0086-0002-0064_41',
                           '42': '0086-0002-0064_42',
                           '49': '0086-0002-0064_49',
                           '50': '0086-0002-0064_50',
                           '81': '0086-0002-0064_81',
                           '201': '0086-0002-0064_201'
                          },
        '0086-0A02-0064': {name: 'Aeotec Multisensor 6 ZW100-G Japan',
                           '41': '0086-0002-0064_41',
                           '42': '0086-0002-0064_42',
                           '49': '0086-0002-0064_49',
                           '50': '0086-0002-0064_50',
                           '81': '0086-0002-0064_81',
                           '201': '0086-0002-0064_201'
                          },
        '010E-0009-0001': {name: 'Danalock V3',
                           '2': '010E-0009-0001_2',
                           '3': '010E-0009-0001_3',
                          },
        '010F-0600-1000': {name: 'Fibaro Wall Plug FGWPF-102 ZW5',
                           '40': '010F-0600-1000_40',
                           '42': '010F-0600-1000_42',
                           '43': '010F-0600-1000_43',
                           '45': '010F-0600-1000_45',
                           '47': '010F-0600-1000_47',
                           '49': '010F-0600-1000_49',
                           '50': '010F-0600-1000_50',
                           '51': '010F-0600-1000_51',
                           '52': '010F-0600-1000_52',
                           '61': '010F-0600-1000_61',
                           '62': '010F-0600-1000_62',
                          },
        '010F-0602-1001': {name: 'Fibaro Wall Plug FGWPF-102 ZW5',
                           '10': '010F-0602-1001_10',
                           '11': '010F-0602-1001_11',
                           '12': '010F-0602-1001_12',
                           '13': '010F-0602-1001_13',
                           '14': '010F-0602-1001_14',
                           '15': '010F-0602-1001_15',
                           '41': '010F-0602-1001_41',
                           '42': '010F-0602-1001_42',
                          },
        '010F-0602-1003': {name: 'Fibaro Wall Plug FGWPF-102',
                           '10': '010F-0602-1001_10',
                           '11': '010F-0602-1001_11',
                           '12': '010F-0602-1001_12',
                           '13': '010F-0602-1001_13',
                           '14': '010F-0602-1001_14',
                           '15': '010F-0602-1001_15',
                           '41': '010F-0602-1001_41',
                           '42': '010F-0602-1001_42',
                          },
        '010F-0701-1001': {name: 'Fibaro Door/Window Sensor FGK-10x',
                           '50': '010F-0701-1001_50',
                           '51': '010F-0701-1001_51',
                           '52': '010F-0701-1001_52',
                           '53': '010F-0701-1001_53',
                           '54': '010F-0701-1001_54',
                           '55': '010F-0701-1001_55',
                           '56': '010F-0701-1001_56',
                          },
        '0159-0001-0051': {name: 'Qubino',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0001-0052': {name: 'Qubino',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0001-0053': {name: 'Qubino',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0002-0051': {name: 'Qubino Flush 2 Relays ZMNHB',
                           '40': '0159-0002-0051_40',
                           '41': '0159-0002-0051_41',
                           '42': '0159-0002-0051_42',
                           '43': '0159-0002-0051_43',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0002-0052': {name: 'Qubino',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0002-0053': {name: 'Qubino Flush 1 Relay ZMNHN',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0003-0052': {name: 'Qubino Flush Shutter ZMNHCD3',
                           '40': '0159-0003-0052_40',
                           '42': '0159-0003-0052_42',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0003-0053': {name: 'Qubino',
                           '110': '0159-0002-0051_110',
                           '120': '0159-0002-0051_120'
                          },
        '0159-0005-0054': {name: 'Qubino Flush On/Off Thermostat 2 ZMNKID3',
                           '110': '0159-0005-0054_110'
                          },
    };
    //convert decimal to hexa, n bytes
    function hex(bytes, dec) {
        return (dec*1).toString(16).padStart(bytes*2, '0').toUpperCase();
    }
    // converts unsigned integer to signed integer:
    function unsignedToSigned(value, bytes) {
        var maxSigned = parseInt('0x7'.padEnd(bytes*2+2, 'F'));
        var maxUnsigned = parseInt('0xF'.padEnd(bytes*2+2, 'F')) + 1;
        return value > maxSigned ? value - maxUnsigned : value;
    } //unsignedToSigned

    // get value of special device/ parameter:
    function getParameterValue(device, param) {
        if (device) {
            return devicesConfig[device].data[param].val.value;
        } else {
            return undefined;
        }
    } //getParameterValue

    var paramConvertArrayDetails = {
        '0086-0002-0064_41': {name: 'temperature threshold change for automatic report',
                              convertToUser : function(value, bytes, device) {
                                    var valueHex_left = hex(bytes, value).substr(0,4);
                                    var valueDec_left_unsigned = parseInt('0x'+valueHex_left);
                                    var valueDec_left = unsignedToSigned(valueDec_left_unsigned, 2)/10;
                                    var item = {
                                        min: 0.1,
                                        max: 212.0,
                                        value: valueDec_left,
                                        step: 0.1,
                                        default: 2.0,
                                        scaleTitle: scaleTitleTemp,
                                        length: 2,
                                        valueHex: '0x'+valueHex_left,
                                        valueUnsigned: valueDec_left_unsigned,
                                    };
                                    if (devicesArray[device].applicationMajor > 1 ||
                                        devicesArray[device].applicationMinor > 8)
                                    {
                                        item.min = 1;
                                        item.max = frequency === 'US' ? 212.0 : 100;
                                        item.remark = 'new since version 1.11: min = '+item.min+
                                                                            ', max = '+item.max;
                                    }
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                              },
                              convertToInternal: function(value) {
                                    return value * 10;
                              }
        }, //0086-0002-0064_41
        '0086-0002-0064_42': {name: 'humidity threshold change for automatic report',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: 100,
                                        value: value,
                                        step: 1,
                                        default: 10,
                                        scaleTitle: '%',
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                              },
                              convertToInternal: function(value) {
                                    return value;
                              }
        }, //0086-0002-0064_42
        '0086-0002-0064_49': {name: 'temperature upper limit',
                               convertToUser : function(value, bytes, device) {
                                    var valueHex_left = hex(bytes, value).substr(0,4);
                                    var valueDec_left_unsigned = parseInt('0x'+valueHex_left);
                                    var valueDec_left = unsignedToSigned(valueDec_left_unsigned, 2)/10;
                                    var item = {
                                        min: -40.0,
                                        max: frequency === 'US' ? 212.0 : 100.0,
                                        value: valueDec_left,
                                        step: 0.1,
                                        default: frequency === 'US' ? 82.4 : 28.0,
                                        scaleTitle: scaleTitleTemp,
                                        length: 2,
                                        valueHex: '0x'+valueHex_left,
                                        valueUnsigned: valueDec_left_unsigned,
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value) {
                                    return value * 10;
                               }
        }, //0086-0002-0064_49
        '0086-0002-0064_50': {name: 'temperature lower limit',
                               convertToUser : function(value, bytes, device) {
                                    var valueHex_left = hex(bytes, value).substr(0,4);
                                    var valueDec_left_unsigned = parseInt('0x'+valueHex_left);
                                    var valueDec_left = unsignedToSigned(valueDec_left_unsigned, 2)/10;
                                    var item = {
                                        min: -40.0,
                                        max: frequency === 'US' ? 212.0 : 100.0,
                                        value: valueDec_left,
                                        step: 0.1,
                                        default: frequency === 'US' ? 32.0 : 0.0,
                                        scaleTitle: scaleTitleTemp,
                                        length: 2,
                                        valueHex: '0x'+valueHex_left,
                                        valueUnsigned: valueDec_left_unsigned,
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value) {
                                    return value * 10;
                               }
        }, //0086-0002-0064_50
        '0086-0002-0064_81': {name: 'enable/ disable LED blinking',
                               convertToUser : function(value, bytes, device) {
                                    var item = {
                                        enum: {
                                            "0": 'enabled',
                                            "1": 'disabled for PIR',
                                        },
                                        value: '',
                                        default: 'enabled',
                                        scaleTitle: '',
                                    };
                                    if (devicesArray[device].applicationMajor === 1 &&
                                        devicesArray[device].applicationMinor >= 10)
                                    {
                                        item.enum[2] = 'completely disabled';
                                        item.remark = '"'+item.enum[2]+'" only existing since 1.10';
                                    }
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0086-0002-0064_81
        '0086-0002-0064_201': {name: 'temperature offset',
                               convertToUser : function(value, bytes, device) {
                                    var valueHex_left = hex(bytes, value).substr(0,2);
                                    var valueDec_left_unsigned = parseInt('0x'+valueHex_left);
                                    var valueDec_left = unsignedToSigned(valueDec_left_unsigned, 1)/10;
                                    var item = {
                                        min: -12.8,
                                        max: 12.7,
                                        value: valueDec_left,
                                        step: 0.1,
                                        default: 0,
                                        scaleTitle: scaleTitleTemp,
                                        length: 1,
                                        valueHex: '0x'+valueHex_left,
                                        valueUnsigned: valueDec_left_unsigned,
                                    };
                                    if (devicesArray[device].applicationMajor <= 1 &&
                                        devicesArray[device].applicationMinor <= 6)
                                    {
                                        item.min = -10.0;
                                        item.max = 10.0;
                                        item.remark = 'till version 1.06: min = '+item.min+
                                                                       ', max = '+item.max;
                                    }
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value) {
                                    return value * 10;
                               }
        }, //0086-0002-0064_201
        '010F-0701-1001_50': {name: 'interval of temperature measurements',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 32400,
                                        value: value,
                                        step: 1,
                                        default: 300,
                                        scaleTitle: 'seconds',
                                        remark: 'min = 5',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0701-1001_50
        '010F-0701-1001_51': {name: 'temperature reports threshold',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 30,
                                        value: value/10,
                                        step: 0.1,
                                        default: 1,
                                        scaleTitle: ch_utils.convertToUTF8('°C'),
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //010F-0701-1001_51
        '010F-0701-1001_52': {name: 'interval of temperature reports',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 32400,
                                        value: value,
                                        step: 1,
                                        default: 0,
                                        scaleTitle: 'seconds',
                                        remark: 'min = 300',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0701-1001_52
        '010F-0701-1001_53': {name: 'temperature offset',
                               convertToUser : function(value, bytes) {
                                    var valueConv = unsignedToSigned(value, bytes)/10;
                                    var item = {
                                        min: -100.0,
                                        max: 100.0,
                                        value: valueConv,
                                        step: 0.1,
                                        default: 0,
                                        scaleTitle: ch_utils.convertToUTF8('°C'),
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //010F-0701-1001_53
        '010F-0701-1001_54': {name: 'temperature alarm reports',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'disabled',
                                            "1": 'high temperature alarm',
                                            "2": 'low temperature alarm',
                                            "3": 'high+low temperature alarm',
                                        },
                                        value: '',
                                        default: 'disabled',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0701-1001_54
        '010F-0701-1001_55': {name: 'high temperature alarm threshold',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 0.1,
                                        max: 60,
                                        value: value/10,
                                        step: 0.1,
                                        default: 35,
                                        scaleTitle: ch_utils.convertToUTF8('°C'),
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //010F-0701-1001_55
        '010F-0701-1001_56': {name: 'low temperature alarm threshold',
                               convertToUser : function(value, bytes) {
                                    var valueConv = unsignedToSigned(value, bytes)/10;
                                    var item = {
                                        min: 0,
                                        max: 59.9,
                                        value: value/10,
                                        step: 0.1,
                                        default: 10,
                                        scaleTitle: ch_utils.convertToUTF8('°C'),
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //010F-0701-1001_56
        '010E-0009-0001_2': {name: 'hold back latch and release after',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 0,
                                        max: 2147483647,
                                        value: value,
                                        step: 1,
                                        default: 0,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010E-0009-0001_2
        '010E-0009-0001_3': {name: 'move block to block',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'deactivated',
                                            "1": 'activated',
                                        },
                                        value: '',
                                        default: 'deactivated',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010E-0009-0001_3

        '010F-0600-1000_40': {name: 'threshold for high priority power report',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: '100 (disabled)',
                                        value: value,
                                        step: 1,
                                        default: 80,
                                        scaleTitle: '%',
                                    };
                                    item.valueDisp = value === 100 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_40',
        '010F-0600-1000_42': {name: 'threshold for standard power report',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: '100 (disabled)',
                                        value: value,
                                        step: 1,
                                        default: 15,
                                        scaleTitle: '%',
                                        remark: 'at most 5 reports per interval',
                                    };
                                    item.valueDisp = value === 100 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_42',
        '010F-0600-1000_43': {name: 'power reporting interval',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: '255 (disabled)',
                                        value: value,
                                        step: 1,
                                        default: 30,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = value === 255 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_43',
        '010F-0600-1000_45': {name: 'energy reporting threshold',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 0.01,
                                        max: '2.55 (disabled)',
                                        value: value/100,
                                        step: 0.01,
                                        default: 0.1,
                                        scaleTitle: 'kWh',
                                    };
                                    item.valueDisp = value === 255 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10 * 1000;
                               }
        }, //010F-0600-1000_45',
        '010F-0600-1000_47': {name: 'power and energy periodic reports',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: '65535 (disabled)',
                                        value: value,
                                        step: 1,
                                        default: 3600,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = value === 65535 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_47',
        '010F-0600-1000_49': {name: 'measuring energy consumed by the Wall Plug itself',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'inactive',
                                            "1": 'activated',
                                        },
                                        value: '',
                                        default: 'inactive',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_49',
        '010F-0600-1000_50': {name: 'lower power threshold',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 0.0,
                                        max: 2500,
                                        value: value/10,
                                        step: 0.1,
                                        default: 30,
                                        scaleTitle: 'W',
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //010F-0600-1000_50',
        '010F-0600-1000_51': {name: 'upper power threshold',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 0.1,
                                        max: 2500,
                                        value: value/10,
                                        step: 0.1,
                                        default: 50,
                                        scaleTitle: 'W',
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //010F-0600-1000_51',
        '010F-0600-1000_52': {name: '2nd associated device action if of exceeding power threshold',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'inactive',
                                            "1": 'turn on at lower threshold',
                                            "2": 'turn off at lower threshold',
                                            "3": 'turn on at upper threshold',
                                            "4": 'turn off at upper threshold',
                                            "5": '1+4 combined',
                                            "6": '2+3 combined',
                                        },
                                        value: '',
                                        default: 'inactive',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_52',
        '010F-0600-1000_61': {name: 'LED ring colour when device is on',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'steps to power',
                                            "1": 'continuously to power',
                                            "2": 'white',
                                            "3": 'red',
                                            "4": 'green',
                                            "5": 'blue',
                                            "6": 'yellow',
                                            "7": 'cyan',
                                            "8": 'magenta',
                                            "9": 'turned off',
                                        },
                                        value: '',
                                        default: 'continuously to power',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_61
        '010F-0600-1000_62': {name: 'LED ring colour when device is off',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'corresponding to last power',
                                            "1": 'white',
                                            "2": 'red',
                                            "3": 'green',
                                            "4": 'blue',
                                            "5": 'yellow',
                                            "6": 'cyan',
                                            "7": 'magenta',
                                            "8": 'turned off',
                                        },
                                        value: '',
                                        default: 'turned off',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0600-1000_62
        '010F-0602-1001_10': {name: 'threshold for high priority power report',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: '100 (disabled)',
                                        value: value,
                                        step: 1,
                                        default: 80,
                                        scaleTitle: '%',
                                    };
                                    item.valueDisp = value === 100 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_10
        '010F-0602-1001_11': {name: 'threshold for standard power report',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 1,
                                        max: '100 (disabled)',
                                        value: value,
                                        step: 1,
                                        default: 15,
                                        scaleTitle: '%',
                                        remark: 'at most 5 reports per interval',
                                    };
                                    item.valueDisp = value === 100 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_11
        '010F-0602-1001_12': {name: 'power reporting interval',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: 5,
                                        max: 600,
                                        value: value,
                                        step: 1,
                                        default: 30,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_12
        '010F-0602-1001_13': {name: 'energy reporting threshold',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 5.0,
                                        value: value/100,
                                        step: 0.01,
                                        default: 0.1,
                                        scaleTitle: 'kWh',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10 * 1000;
                               }
        }, //010F-0602-1001_13
        '010F-0602-1001_14': {name: 'power and energy periodic reports',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 32400,
                                        value: value,
                                        step: 1,
                                        default: 3600,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_14
        '010F-0602-1001_15': {name: 'measuring energy consumed by the Wall Plug itself',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'inactive',
                                            "1": 'activated',
                                        },
                                        value: '',
                                        default: 'inactive',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_15
        '010F-0602-1001_41': {name: 'LED ring colour when device is on',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'turned off',
                                            "1": 'continuously to power',
                                            "2": 'steps to power',
                                            "3": 'white',
                                            "4": 'red',
                                            "5": 'green',
                                            "6": 'blue',
                                            "7": 'yellow',
                                            "8": 'cyan',
                                            "9": 'magenta',
                                        },
                                        value: '',
                                        default: 'continuously to power',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_41
        '010F-0602-1001_42': {name: 'LED ring colour when device is off',
                               convertToUser : function(value, bytes) {
                                    var item = {
                                        enum: {
                                            "0": 'turned off',
                                            "1": 'corresponding to last power',
                                            "3": 'white',
                                            "4": 'red',
                                            "5": 'green',
                                            "6": 'blue',
                                            "7": 'yellow',
                                            "8": 'cyan',
                                            "9": 'magenta',
                                        },
                                        value: '',
                                        default: 'turned off',
                                        scaleTitle: '',
                                    };
                                    item.valueDisp = item.value = item.enum[value+''];
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //010F-0602-1001_42
        '0159-0002-0051_40': {name: 'power reporting in Watts on power change for Q1',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 100,
                                        value: value,
                                        step: 1,
                                        default: 10,
                                        scaleTitle: '%',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0159-0002-0051_40
        '0159-0002-0051_41': {name: 'power reporting in Watts on power change for Q2',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 100,
                                        value: value,
                                        step: 1,
                                        default: 10,
                                        scaleTitle: '%',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0159-0002-0051_41
        '0159-0002-0051_42': {name: 'power reporting in Watts by time interval for Q1',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 32535,
                                        value: value,
                                        step: 1,
                                        default: 0,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0159-0002-0051_42
        '0159-0002-0051_43': {name: 'power reporting in Watts by time interval for Q2',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 32535,
                                        value: value,
                                        step: 1,
                                        default: 0,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0159-0002-0051_43
        '0159-0002-0051_110': {name: 'temperature offset',
                               convertToUser : function(value, bytes) {
                                    var valueConv;
                                    if (value*1 === 32536) {valueConv = 0.0;}
                                    else
                                    if (value > 0 && value <= 100) {valueConv = value/10;}
                                    else
                                    if (value >= 1001 && value <= 1100) {valueConv = -(value - 1000)/10;}
                                    else
                                    {
                                        alert ('value not allowed!');
                                        valueConv = 0.0;
                                    }
                                    var item = {
                                        min: -10.0,
                                        max: 10.0,
                                        value: valueConv,
                                        step: 0.1,
                                        default: 0,
                                        scaleTitle: scaleTitleTemp,
                                    };
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    var valueInt;
                                    if (value*1 === 0){
                                        valueInt = 32536;
                                    } else
                                    if (value < 0) {
                                        valueInt = -value * 10 + 1000;
                                    } else {
                                        valueInt = value * 10;
                                    }
                                    return valueInt;
                               }
        }, //0159-0002-0051_110
        '0159-0002-0051_120': {name: 'temperature threshold change for automatic report',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 12.7,
                                        value: value/10,
                                        step: 0.1,
                                        default: 0.5,
                                        scaleTitle: ch_utils.convertToUTF8('°C'),
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //0159-0002-0051_120
        '0159-0003-0052_40': {name: 'power reporting in Watts on power change for Q1 or Q2',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 100,
                                        value: value,
                                        step: 1,
                                        default: 1,
                                        scaleTitle: '%',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0159-0003-0052_40
        '0159-0003-0052_42': {name: 'power reporting in Watts by time interval for Q1 or Q2',
                              convertToUser : function(value, bytes) {
                                    var item = {
                                        min: '0 (disabled)',
                                        max: 65535,
                                        value: value,
                                        step: 1,
                                        default: 300,
                                        scaleTitle: 'seconds',
                                    };
                                    item.valueDisp = value === 0 ? 'disabled' : item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value;
                               }
        }, //0159-0003-0052_42
        '0159-0005-0054_110': {name: 'temperature offset',
                               convertToUser : function(value, bytes, device) {
                                    var valueConv = unsignedToSigned(value, bytes)/10;
                                    var item = {
                                        min: -15.0,
                                        max: 15.0,
                                        value: valueConv,
                                        step: 0.1,
                                        default: 0,
                                        scaleTitle: ch_utils.convertToUTF8('°C'),
                                    };
                                    if (getParameterValue(device, 78) === 1) {
                                        item.min = -27.0;
                                        item.max = 27.0;
                                        item.scaleTitle = '°F';
                                    }
                                    item.valueDisp = item.value+' '+item.scaleTitle;
                                    return item;
                               },
                               convertToInternal: function(value, bytes) {
                                    return value * 10;
                               }
        }, //0159-0005-0054_110
    };

    function startDatacollection() {
        getDeviceList();

    } //startDatacollection

    $('#selectFile').change(getDeviceList);

    function getDeviceList(evt) {
        ch_utils.displayMessage(3);
        if (evt) {
            update = true;
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                if (theFile.total === theFile.loaded) {
                    var obj = theFile.target.result;
                    if (obj) {
                      obj = 'anyName = ' + obj;
                      var data = eval(obj);
                      processConfig(data.devices);
                    }
                }
                return function(e) {
                    alert(e);
                };
            });
            if (file) {
                reader.readAsText(file);
            }
        } else {
            var url = urlData;
            ch_utils.ajax_get(url, success);
        }
        function success (data) {
            frequency = data.controller.data.frequency.value;
            scaleTitleTemp = ch_utils.convertToUTF8(frequency === 'US' ? '°F' : '°C');
            processConfig(data.devices);
        }
    } //getInstanceList

    function processConfig(devices) {
        ch_utils.displayMessage(4);

        var i = 0;
        if (!update) {
            ch_utils.displayMessage(5);
            devNumKeySelected1 = '';
            devNumKeySelected2 = '';
            var elId2 = document.getElementById('selDevNo1');
            var elId3 = document.getElementById('selDevNo2');

            var option2 = new Option(ch_utils.buildMessage(ix_selectTexts+0), '');
            var option3 = new Option(ch_utils.buildMessage(ix_selectTexts+0), '');
            elId2.options[i] = option2;
            elId3.options[i] = option3;
        }
        i += 1;

        devicesConfig = {};
        devicesArray = {};
        manufacturerArray = {};
        devicesList = [];
        Object.keys(devices).forEach(function(device, ix) {
            if (device > 1) {
                devicesList.push(device);
                //store configuration (112):
                devicesConfig[device] = devices[device].instances["0"].commandClasses["112"];

                //store device info
                var givenName = devices[device].data.givenName.value;
                var manufacturerId = devices[device].data.manufacturerId.value || 0;
                var vendorString = devices[device].data.vendorString.value;
                var deviceTypeString = devices[device].data.deviceTypeString.value;
                var manufacturerProductType = devices[device].data.manufacturerProductType.value;
                var manufacturerProductId = devices[device].data.manufacturerProductId.value;
                var ZWProtocolMajor = devices[device].data.ZWProtocolMajor.value;
                var ZWProtocolMinor = devices[device].data.ZWProtocolMinor.value;
                var applicationMajor = devices[device].data.applicationMajor.value;
                var applicationMinor = devices[device].data.applicationMinor.value;
                var SDK = devices[device].data.SDK.value;
                var ZDDXMLFile = devices[device].data.ZDDXMLFile.value;

                var class134 = devices[device].instances["0"].commandClasses["134"];
                var version = '???';
                var ZWLib = '???';
                var hardwareVersion = '???';
                if (class134) {
                    version = class134.data.version.value;
                    ZWLib = class134.data.ZWLib.value;
                    hardwareVersion = class134.data.hardwareVersion.value;
                } else {
                    alert('device #'+device+': class 134 = Version is undefined!');
                }
                var plusVersion = '';
                var class94 = devices[device].instances["0"].commandClasses["94"];
                if (class94) {
                    plusVersion = class94.data.plusVersion.value;
                }

                var wakeupInterval, wakeupInterval_min, wakeupInterval_max, wakeupInterval_default;
                if (devices[device].instances["0"].commandClasses["128"] &&
                    devices[device].instances["0"].commandClasses["132"] &&
                    !devices[device].data.isListening.value) {
                    wakeupInterval = devices[device].instances["0"].commandClasses["132"]
                                            .data.interval.value;
                    wakeupInterval_min = devices[device].instances["0"].commandClasses["132"]
                                            .data.min.value;
                    wakeupInterval_max = devices[device].instances["0"].commandClasses["132"]
                                            .data.max.value;
                    wakeupInterval_default = devices[device].instances["0"].commandClasses["132"]
                                            .data.default.value;
                }

                var item = {givenName: givenName,
                            manufacturerId: manufacturerId,
                            vendorString: vendorString,
                            deviceTypeString: deviceTypeString,
                            manufacturerProductType: manufacturerProductType,
                            manufacturerProductId: manufacturerProductId,
                            ZWProtocolMajor: ZWProtocolMajor,
                            ZWProtocolMinor: ZWProtocolMinor,
                            ZWProtocol: ZWProtocolMajor+'.'+ZWProtocolMinor+'/'+
                                        hex(1, ZWProtocolMajor) +'-'+hex(1, ZWProtocolMinor),
                            applicationMajor: applicationMajor,
                            applicationMinor: applicationMinor,
                            application: applicationMajor+'.'+ applicationMinor,
                            SDK: SDK,
                            ZDDXMLFile: ZDDXMLFile,
                            version: version,
                            ZWLib: ZWLib,
                            hardwareVersion: hardwareVersion,
                            plusVersion: plusVersion,
                            wakeupInterval: wakeupInterval,
                            wakeupInterval_min: wakeupInterval_min,
                            wakeupInterval_max: wakeupInterval_max,
                            wakeupInterval_default: wakeupInterval_default
                           };
                devicesArray[device] = item;

                if (! manufacturerArray.hasOwnProperty(manufacturerId)) {
                    manufacturerArray[manufacturerId] = {devices: [],
                                                         vendorString: ''};
                }
                manufacturerArray[manufacturerId].devices.push(device);
                if (vendorString.length > 0) {
                    manufacturerArray[manufacturerId].vendorString=vendorString;
                }

                //device selectboxes
                if (!update) {
                    option2 = new Option('#'+device+': '+givenName, device);
                    option3 = new Option('#'+device+': '+givenName, device);
                    elId2.options[i] = option2;
                    elId3.options[i] = option3;
                }
                i += 1;
            }
        });

        //manufacturer selectbox
        if (!update) {
            manufacturerSelected = '';
            i = 0;
            var elId1 = document.getElementById('selManufacturer');
            var option1 = new Option(ch_utils.buildMessage(ix_selectTexts+0), '');
            elId1.options[i++] = option1;

            Object.keys(manufacturerArray).forEach(function(manufacturerId, ix) {
                if (manufacturerId) {
                    option1 = new Option('#'+manufacturerId+
                        ': '+manufacturerArray[manufacturerId].vendorString, manufacturerId);
                    elId1.options[i++] = option1;
                }
            });
        }
        if (manufacturerSelected) {
            if (manufacturerDoc.hasOwnProperty(manufacturerSelected)) {
                ch_utils.displayMessage(21, urlZDDX, manufacturerDoc[manufacturerSelected]);
            } else {
                ch_utils.displayMessage(7, urlZDDX);
            }
        }

        if (update) {
            update = false;
            //update display
            if (manufacturerSelected === '') {
                        ch_utils.displayMessage(5);
            }
            if (devNumKeySelected1 !== '') {
                html1 = displayHTML(1, devNumKeySelected1);
                buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);
            }
            if (devNumKeySelected2 !== '') {
                html2 = displayHTML(2, devNumKeySelected2);
                buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);
            }
        } else {
            //read ZDDX files
            buildZDDXArray();
            buildZDDXArray2();
        }
    } //processConfig

    function buildZDDXArray() {
        var fil;
        //read folder
        ch_utils.ajax_get(urlZDDX, success);
        function success (folderContents) {
            ZDDXArray = folderContents.replace(/<.*href="/gi, '')
                                      .replace(/\.xml.*/gi, '.xml').split("\n");
        }
    } //buildZDDXArray

    //compares hash and xml filename for identity
    function compareHashXml(hashStrong, xml) {
        var xmlArr = xml.toUpperCase().split('-');
        if (!xmlArr[1] || !xmlArr[2] || !xmlArr[3] ||
            xmlArr[1].length !== 4 || xmlArr[2].length !== 4 || xmlArr[3].length !== 4) {
            return false;
        }
        var hashArr = hashStrong.split('-');

        //check for identity
        if (xmlArr[1] === hashArr[0] &&
            xmlArr[2] === hashArr[1] &&
            xmlArr[3] === hashArr[2]) {
            return true;
        }

        //check for placeholder x/X
        var re11 = new RegExp(xmlArr[1].replace(/X/g, '.'), 'g');
        var re12 = new RegExp(xmlArr[2].replace(/X/g, '.'), 'g');
        var re13 = new RegExp(xmlArr[3].replace(/X/g, '.'), 'g');
        if (hashArr[0].search(re11) === 0 &&
            hashArr[1].search(re12) === 0 &&
            hashArr[2].search(re13) === 0) {
            return true;
        }
        return false;
    }
    function buildZDDXArray2() {
        //read file
        var url = urlZDDX+'/ZDDX.indx';
        ch_utils.ajax_get(url, success);
        function success (indexFile) {
            //separate lines
            var indexArray = indexFile.replace(/\r/g, '').split('\n');
            //eval lines
            var i = 0;
            indexArray.forEach(function(line, ix) {
                if (line.indexOf('.xml') > 0) {
                    line.replace(/\t*/, '\t');
                    var lineArray = line.split('\t');
                    var hashStrong = hex(2, lineArray[0])+'-'+
                                     hex(2, lineArray[1])+'-'+
                                     hex(2, lineArray[2]);
                    var xml = lineArray[lineArray.length-1];
                    //alert(hashStrong+' '+xml);
                    if (ZDDXArray2.hasOwnProperty(hashStrong)) {
                        ZDDXArray2[hashStrong].push(xml);
                    } else {
                        ZDDXArray2[hashStrong] = [xml];
                    }
                    //if (xml.toUpperCase().indexOf(hashStrong) <=0) {
                    if (compareHashXml(hashStrong, xml) === false) {
                        console.log((++i)+' '+ix+' '+lineArray[0]+'-'+lineArray[1]+'-'+lineArray[2]+' '+
                              hashStrong+' '+xml);
                    }
                }
             });
        }
    } //buildZDDXArray2

    document.getElementById('selManufacturer').addEventListener('click', function() {
        var manufacturerSelectedOld = manufacturerSelected;
        manufacturerSelected = this.value;
        if (manufacturerSelected !== manufacturerSelectedOld) {
            if (manufacturerDoc.hasOwnProperty(manufacturerSelected)) {
                ch_utils.displayMessage(21, urlZDDX, manufacturerDoc[manufacturerSelected]);
            } else {
                ch_utils.displayMessage(7, urlZDDX);
            }
            buildDevicesSelectbox(manufacturerSelected);
        }
    }, true);

    function buildDevicesSelectbox(manufacturerSelected) {
        var arr;
        if (manufacturerSelected === '') {
            arr = devicesList;
        } else {
            arr = manufacturerArray[manufacturerSelected].devices;
        }

        devNumKeySelected1 = '';
        devNumKeySelected2 = '';
        var i;
        var elId2 = document.getElementById('selDevNo1');
        var elId3 = document.getElementById('selDevNo2');
        elId2.selectedIndex = 0;
        elId3.selectedIndex = 0;
        var length = elId2.options.length;
        for (i = length-1; i >= 0; i--) {
            elId2.remove(i);
        }
        for (i = length-1; i >= 0; i--) {
            elId3.remove(i);
        }

        i = 0;
        var option2 = new Option(ch_utils.buildMessage(ix_selectTexts+0), '');
        var option3 = new Option(ch_utils.buildMessage(ix_selectTexts+0), '');
        elId2.options[i] = option2;
        elId3.options[i] = option3;
        i += 1;

        var givenName;
        arr.forEach(function(device, ix) {
            givenName = devicesArray[device].givenName;
            option2 = new Option('#'+device+': '+givenName, device);
            option3 = new Option('#'+device+': '+givenName, device);
            elId2.options[i] = option2;
            elId3.options[i] = option3;
            i += 1;

        });
    } //buildDevicesSelectbox

    document.getElementById('selDevNo1').addEventListener('click', function() {
        var devNumKeySelected1Old = devNumKeySelected1;
        devNumKeySelected1 = this.value;
        $("#selDevTitle1").val(devNumKeySelected1);
        if (devNumKeySelected1) {
            if (devNumKeySelected1 !== devNumKeySelected1Old || !html1 ) {
                html1 = displayHTML(1, devNumKeySelected1);
                buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);
            }
        }
    }, true);

    document.getElementById('selDevNo2').addEventListener('click', function() {
        var devNumKeySelected1Old = devNumKeySelected2;
        devNumKeySelected2 = this.value;
        $("#selDevTitle2").val(devNumKeySelected2);
        if (devNumKeySelected2) {
            if (devNumKeySelected2 !== devNumKeySelected1Old || !html2) {
                html2 = displayHTML(2, devNumKeySelected2);
                buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);
            }
        }
    }, true);

    function view(str) {
        if (str === null || str === undefined ||
            str === 'undefined' || str === 'empty') {return '';}
        return str;
    }

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    function buildHTMLDifferences(device1, device2) {
        //extract key (= col1) from html line:
        function getKey(line) {
            var len = line.length;
            if (line.indexOf('<tr>') === 0 && line.indexOf('</tr>') === len-5) {
                //var key = line.replace(/<\/td>.*$/, '').replace(/^.*>/, '');
                var key = line.replace(/<[^<]*>/g, '<>')
                              .replace(/^<><>/, '')
                              .replace(/<.*$/, '');
                return key;
            } else {
                return undefined;
            }
        } //getKey

        function dispDifferences(arr, diff, num, ZDDXMLFileIndex, ZDDXMLFile) {
            var diffLen = diff.length;
            var i, j, diffKey;
            //if (diffLen > 0) {
                var arrLen = arr.length;
                for (i = 0; i < diffLen; i++) {
                    diffKey = getKey(diff[i]);
                    if (!diffKey) {continue;}
                    for (j = i; j < arrLen; j++) {
                        var arrKey = getKey(arr[j]);
                        if (!arrKey) {continue;}
                        if (arrKey === diffKey) {
                            arr[j] = arr[j].replace(/align=center>/g,"align=center><font color='red'><b>")
                                           .replace(/<\/td>/g,"<\/b><\/font><\/td>");
                            break; //j
                        }
                    }
                }
                //restore ZDDXMLFile
                arr[ZDDXMLFileIndex] = ZDDXMLFile;

                document.getElementById('json-renderer'+num).innerHTML = arr.join('');
            //}
        } //dispDifferences

        if (!html1 || !html2) {
            return;
        }
        if (devicesArray[devNumKeySelected1].manufacturerId !==
                devicesArray[devNumKeySelected2].manufacturerId) {
            return;
        }

        var arr1 = html1.split("\n");
        var arr2 = html2.split("\n");

        //save ZDDXMLFile
        var ZDDXMLFile1Index = arr1.findIndex(function (v) {return /ZDDXMLFile/.test(v);});
        var ZDDXMLFile1 = arr1[ZDDXMLFile1Index];
        var ZDDXMLFile2Index = arr2.findIndex(function (v) {return /ZDDXMLFile/.test(v);});
        var ZDDXMLFile2 = arr2[ZDDXMLFile2Index];

        //differences in arr1:
        var diff = arr1.diff(arr2);
        dispDifferences(arr1, diff, 1, ZDDXMLFile1Index, ZDDXMLFile1);

        //differences in arr2:
        diff = arr2.diff(arr1);
        dispDifferences(arr2, diff, 2, ZDDXMLFile2Index, ZDDXMLFile2);

        //rebuild eventlistener for dynamic table row:
        eval('$("#htmlTable'+1+' tr:has(td)").click(function(e) {'+
                    'var clickedCell = $(e.target).closest("tr");'+
                    'var a = 1+","+'+device1+'+","+clickedCell.text();'+
                    'rowClick(a);'+
                   '});');
        eval('$("#htmlTable'+2+' tr:has(td)").click(function(e) {'+
                    'var clickedCell = $(e.target).closest("tr");'+
                    'var a = 2+","+'+device2+'+","+clickedCell.text();'+
                    'rowClick(a);'+
                   '});');

    } //buildHTMLDifferences

    function genXMLList(arr, string, count, device, xmlCurrent) {
        //create html output
        var html = '';
        html += '<h3>'+ch_utils.buildMessage(8, string, device)+'</h3>';
        html += '<table id="ZDDXtable'+count+'">';
        html += '<thead><tr>';
        html += '<th id="file">ZDDXMLFile</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        function nextLine(col1) {
            var html = '';
            html += '<tr><td align=center>';
            if (col1 === xmlCurrent) {
                html += '<font color="blue">'+col1+'<\/font>';
            } else {
                html += col1;
            }
            html += '</td></tr>\n';
            return html;
        }

        arr.forEach(function(fil, ix) {
            html += nextLine(fil);
        });
        html += '</tbody>';
        html += '</table>';

        return html;
    } //genXMLList

    function uniqueArray(arrArg) {
        return arrArg.filter(function(elem, pos,arr) {
            return arr.indexOf(elem) === pos;
        });
    }

    function buildXMLList(num, device, xmlCurrent) {
        function sortByDigits(array) {
             var re = /-.*$/g;
             array.sort(function(a, b) {
                 return(parseInt(a.replace(re, ""), 10) - parseInt(b.replace(re, ""), 10));
             });
             return(array);
        }
        var hashStrong = num === 1 ? hashStrong_1 : hashStrong_2;
        var count = 1;
        //alert('hashStrong='+hashStrong);

        if (num === 1) {
            html2 = undefined;
        } else {
            html1 = undefined;
        }
        device_curr = device;

        //build list
        var arr1 = ZDDXArray.filter(function (xml) {
            return compareHashXml(hashStrong, xml);
            //return xml.toUpperCase().indexOf(hashStrong) > 0;
        });

        //add data from index file
        var arr1_2 = ZDDXArray2[hashStrong];
        if (arr1_2) {
            arr1 = uniqueArray(arr1.concat(arr1_2).sort());
        }

        var arr = sortByDigits(arr1);
        var html = genXMLList(arr, hashStrong, count, device, xmlCurrent);

        if (arr.length === 0) {
            hashStrong = hashStrong.replace(/-[^\-]*$/, '');
            arr1 = ZDDXArray.filter(function (xml) {
                return xml.toUpperCase().indexOf(hashStrong) > 0;
            });
            arr = sortByDigits(arr1);
            count++;
            html += genXMLList(arr, hashStrong+'-???', count, device, xmlCurrent);
        }

        html += '<br><br><br>';
        html +=   '<label for="storeZDDX">'+messageFormats[ixButtonTextBase+4][lang]+'</label>';
        html +=   '<select name="storeZDDX" id="storeZDDX">';
        html += '<option value="">'+messageFormats[ixButtonTextBase+6][lang]+'</option>';
        arr.forEach(function(fil, ix) {
            html += '<option value="'+fil+'">'+fil+'</option>';
        });
        html +=   '</select>';
        html +=   '<br><br>';
        html += '<button type="button" id="submitZDDX">'+messageFormats[ixButtonTextBase+5][lang]+'</button>';
        html += messageFormats[14][lang];

        var n = num === 1 ? 2 : 1;
        document.getElementById('json-renderer'+n).innerHTML = html;

        eval("document.querySelector('#submitZDDX').addEventListener('click', submitZDDX);");
        //build eventlistener for dynamic table row:
        eval('$("#ZDDXtable'+count+' tr:has(td)").click(function(e) {'+
                    'var clickedCell = $(e.target).closest("tr");'+
                    'var a = '+num+'+","+clickedCell.text();'+
                    'ZDDXClick(a);'+
                   '});');

    } //buildXMLList

    function ZDDXClick(str) {
        var a = str.split(',');
        var num = a[0];
        var xmlFile = a[1];

        var url = urlZDDX+xmlFile;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                success(this);
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
        function success(xml) {
            ZDDXhtml(num, xmlFile, xml.responseXML);
        }
    } //ZDDXClick

    //build device description page from xml file
    function ZDDXhtml(num, xml, xmlDoc) {
        console.log('ZDDXhtml', num, xml, xmlDoc);
        //check parameter value for validity
        var invalid = false;
        function checkParaValidity(value, invalid) {
             if (value.length % 2 === 0) {
                 return false;
             } else {
                 return true;
             }
         }

         Object.prototype.xml_get = function(action, name) {
            var a;
            try {
                if (action === 'node') {
                    if (name === 'lang') {
                        var langDefault = 'en';
                        var langCurr;
                        var ixLang;
                        var ixDefault;
                        var ixValue;

                        var obj = this.getElementsByTagName(name);
                        Object.keys(obj).forEach(function(ix) {
                            ixValue = obj[ix].xml_get('value');
                            if (ixValue && ixValue !== '') {
                                a = obj[ix];
                                langCurr = a.xml_get('attribute', 'xml:lang');

                                if (langCurr === lang) {
                                    ixLang = ix;
                                } else
                                if (langCurr === langDefault) {
                                    ixDefault = ix;
                                }
                            }
                        });
                        if (ixLang) {
                            a = obj[ixLang];
                        } else
                        if (ixDefault) {
                            a = obj[ixDefault];
                        } else {
                            a = obj[0];
                        }
                    } else {
                        a = this.getElementsByTagName(name)[0];
                    }
                } else
                if (action ==='attribute') {
                    a = '';
                    a = this.getAttribute(name);
                } else
                if (action ==='value') {
                    a = '';
                    a = this.childNodes[0].nodeValue;
                }
            } finally {
                return a;
            }
        }; //xml_get

        var b;
        var certNumber = '';
        try {
            certNumber = xmlDoc.xml_get('node', 'certNumber').xml_get('value');
        } catch (err) {
            certNumber = '';
        }
        var html = '';
        html += '<h3>'+ch_utils.buildMessage(ix_selectTexts+22);
        html += '<a href="'+urlZDDX+xml+'" target="_blank">'+xml+'</a>';
        if (certNumber !== '') {
            html += '<br>'+ch_utils.buildMessage(ix_selectTexts+23);
            html += '<a href="http://manuals-backend.z-wave.info/make.php?lang='+lang+'&cert='+certNumber+'" target="_blank">'+certNumber+'</a>';
        }
        html += '</h3>';

        try {
            html += '<br>'+xmlDoc.xml_get('node', 'productName').xml_get('value');
        } catch(err) {
            b ='not defined';
        }
        try {
            html += '<br>'+xmlDoc.xml_get('node', 'productCode').xml_get('value');
        } catch(err) {
            b ='not defined';
        }
        html += '<br><br>';
        var desc;
        desc = xmlDoc.xml_get('node', 'deviceDescription').xml_get('node', 'description').
                                                               xml_get('node', 'lang').
                                                               xml_get('value').trim();
        //html += desc;

        //insert linebreaks:
        String.prototype.replaceAt = function(index, char) {
            return this.substr(0, index) + char + this.substr(index+1);
        };
        var step = 75;
        var pos;
        var len = desc.length;
        var next = 1;
        desc = desc.replace(/\r/g, '');
        for (var i = 0; i < len; i = next) {
            pos = desc.indexOf('\n', i);
            if (pos >= 0 && pos <= i + step) {
                //alert('ja');
                desc = desc.replaceAt(pos, '<br>');
                next = pos + 4;
            } else {
                pos = desc.indexOf(' ', i + step);
                if (pos >= 0) {
                    desc = desc.replaceAt(pos, '<br>');
                    next = pos + 4;
                } else {
                    next = i + step;
                }
            }
        }
        html += desc;

        var img = '';
        var imgObj = xmlDoc.xml_get('node', 'deviceImage');
        if (imgObj) {
            img = imgObj.xml_get('attribute', 'url');
            if (img.indexOf('www.pepper1.net') >= 0) {
                img = '';
            }
        }
        html += '<br>';
        html += '<img src="'+img+'" height="200" style="float:none">';
        //html += img;

        var paramArray = [];
        var paramObjects = {};
        var number;
        var name;
        var defaultt;
        var size;

        var configParams = xmlDoc.xml_get('node', 'configParams');
        if (configParams) {
            var configParam = xmlDoc.getElementsByTagName("configParam");
            Object.keys(configParam).forEach(function(param, ix) {
                number = parseInt(configParam[param].getAttribute('number'));
                try {
                    defaultt = configParam[param].getAttribute('default');
                } catch(err) {
                    defaultt = '';
                }
                try {
                    size = configParam[param].getAttribute('size');
                } catch(err) {
                    size = '';
                }
                invalid = checkParaValidity(defaultt, invalid);
                name = configParam[param].xml_get('node', 'name').xml_get('node', 'lang').xml_get('value').trim();
                paramObjects[number] = {name: name, size: size, defaultt: defaultt};
                paramArray.push(number);
            });
        }
        if (invalid) {
            html += '<p style="text-align:left"> <b><font color="red">'+ch_utils.buildMessage(19)+'<\/font><\/b><br><br><\/p>';
        }

        html += '<table>';
        html += '<thead><tr>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+18)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+25)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+24)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+19)+'</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        paramArray.sort(function(a, b){return a-b;});
        paramArray.forEach(function(number, ix) {
            html += '<tr>';
            html += '<td align=center>'+number+'</td>';
            html += '<td align=center>'+paramObjects[number].size+'</td>';
            if (invalid && (paramObjects[number].defaultt < 0 || paramObjects[number].defaultt > 9)) {
                html += '<td align=center><font color="red">'+paramObjects[number].defaultt+'<\/font</td>';
            } else {
                html += '<td align=center>'+paramObjects[number].defaultt+'</td>';
            }
            html += '<td align=left>'+paramObjects[number].name+'</td>';
            html += '</tr>\n';
        });
        html += '</tbody>';
        html += '</table>';

        delete Object.prototype.xml_get;

        var n = num === '1' ? 2 : 1;
        document.getElementById('json-renderer'+n).innerHTML = html;

    } //ZDDXhtml

    //convert decimal to hexa, 4 digits
    function hex4(dec) {
        return (dec+0x10000).toString(16).substr(-4).toUpperCase();
    }

    function displayHTML(num, device) {
        var html =  buildHTML(num, device);
        document.getElementById('json-renderer'+num).innerHTML = html;

        //build eventlistener for dynamic table row:
        eval('$("#htmlTable'+num+' tr:has(td)").click(function(e) {'+
                    'var clickedCell = $(e.target).closest("tr");'+
                    'var a = '+num+'+","+'+device+'+","+clickedCell.text();'+
                    'rowClick(a);'+
                   '});');

        return html;
    } //displayHTML

    // color parameter length to red, if invalid
    function checkParamLength(len) {
        if ([1, 2, 4].indexOf(len) >= 0) {
            return len;
        } else {
            return '<font color="red"><b>'+len+'<\/b><\/font>';
        }
    } //checkParamLength

    function buildHTML(num, device) {
        function nextLine(col1, col2, col3, col4) {
            var html = '';
            html += '<tr>';
            //spaces are necessary as separator for clicked rows!
            //&nbsp; becomes to \u00a0
            html += '<td align=center>'+col1+'&nbsp;</td>';
            html += '<td align=center>'+view(col2)+'&nbsp;</td>';
            html += '<td align=center>'+view(col3)+'&nbsp;</td>';
            html += '<td align=center>'+view(col4)+'</td>';
            html += '</tr>\n';
            return html;
        }

        var html = '';
        html +=  '<table id="htmlTable'+num+'">';
        html += '<thead><tr>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+1)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+2)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+3)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+4)+'</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        html += nextLine(ch_utils.buildMessage(ix_selectTexts+5), '#'+device, '', '');
        //alert(JSON.stringify(devicesArray));
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+6), devicesArray[device].givenName, '', '');
        var mfIdHex = hex4(devicesArray[device].manufacturerId);
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+7), '#'+devicesArray[device].manufacturerId+'/'+
            mfIdHex, '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+8), devicesArray[device].vendorString, '', '');
        var mfPrTpHex = hex4(devicesArray[device].manufacturerProductType);
        var mfPrIdHex = hex4(devicesArray[device].manufacturerProductId);
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+9),
            devicesArray[device].manufacturerProductType+'-'+devicesArray[device].manufacturerProductId+'/'+
            mfPrTpHex+'-'+mfPrIdHex, '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+10), devicesArray[device].deviceTypeString, '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+15), devicesArray[device].ZWLib+'/'+
           hex(1, devicesArray[device].ZWLib), '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+12), devicesArray[device].ZWProtocol, '', '');
        var application = devicesArray[device].application;
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+11), application+'/'+
           hex(1, devicesArray[device].applicationMajor)+'-'+
           hex(1, devicesArray[device].applicationMinor), '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+13), devicesArray[device].SDK, '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+14), devicesArray[device].version, '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+16), devicesArray[device].hardwareVersion, '', '');
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+26), devicesArray[device].plusVersion, '', '');

        var ZDDXString = devicesArray[device].ZDDXMLFile;
        var hashStrong = mfIdHex+'-'+mfPrTpHex+'-'+mfPrIdHex;
        var libType = hex(1, devicesArray[device].ZWLib);
        var protoVersion = hex(1, devicesArray[device].ZWProtocolMajor);
        var protoSubVersion = hex(1, parseInt(devicesArray[device].ZWProtocolMinor));
        var appVersion = hex(1, devicesArray[device].applicationMajor);
        var appSubVersion = hex(1, devicesArray[device].applicationMinor);
        var HashStrong = hashStrong+
                         '-'+libType+
                         '-'+protoVersion+
                         '-'+protoSubVersion+
                         '-'+appVersion+
                         '-'+appSubVersion;
        html += nextLine('Hash Strong', HashStrong, '', '');
        if (! ZDDXString) {
            ZDDXString = '<font color="maroon">[nnn-'+HashStrong+'.xml]<\/font>';
        } else
        if (ZDDXArray.indexOf(ZDDXString) < 0) {
            ZDDXString = '<font color="red"><b>'+ZDDXString+'<\/b><\/font>';
        } else
        if ((ZDDXString.toUpperCase()).indexOf(hashStrong) > 0) {
            ZDDXString = '<font color="blue">'+ZDDXString+'<\/font>';
        } else {
            var a = ZDDXString.split('-');
            ZDDXString = a[0]+'-';
            if (a[1] === mfIdHex) {
                ZDDXString += mfIdHex+'-';
            } else {
                ZDDXString += "<font color='red'>"+a[1]+'<\/font>'+'-';
            }
            if (a[2] === mfPrTpHex) {
               ZDDXString += mfPrTpHex+'-';
            } else {
                ZDDXString += "<font color='red'>"+a[2]+'<\/font>'+'-';
            }
            if (a[3] === mfPrIdHex) {
                ZDDXString += mfPrIdHex+'-';
            } else {
                ZDDXString += "<font color='red'>"+a[3]+'<\/font>'+'-';
            }
            ZDDXString += a[4]+'-'+a[5]+'-'+a[6]+'-'+a[7]+'-'+a[8];
        }
        html += nextLine(ch_utils.buildMessage(ix_selectTexts+17), ZDDXString, '', '');

        if (devicesArray[device].wakeupInterval) {
            html += nextLine('Wakeup Interval', devicesArray[device].wakeupInterval, '', '');
        }

        if (devicesConfig[device]) {
            var config = devicesConfig[device].data;
            html += nextLine('Configuration Class Version', config.version.value, '', '');
            Object.keys(config).forEach(function(param, ix) {
                var valueUser = '';
                if (param && ! isNaN(param)) {
                    var paramDisp = param;
                    if ((config[param].size.value && config[param].val.value !== null) || show_invalids) {
                        var parSize = config[param].size.value;
                        var parValue = config[param].val.value;
                        if (paramConvertArray[hashStrong]) {  //look for device
                            if (paramConvertArray[hashStrong][param]) {   //look for parameter
                                paramDisp += '*';
                                var parDetailsIx = paramConvertArray[hashStrong][param];
                                var parDetails = paramConvertArrayDetails[parDetailsIx];
                                valueUser = ' = '+parDetails.convertToUser(parValue, parSize, device).valueDisp;
                            }
                        }
                        var parHex = hex(parSize, parValue);
                        var parValueSign = hexToSignedInt(parHex);
                        if (parValueSign < 0) {parValueSign = parValueSign+'/'+parValue;}
                        html += nextLine(paramDisp, parValueSign+'/0x'+
                                        parHex+valueUser,
                                        config[param].val.type,
                                        checkParamLength(parSize));
                    }
                }
            });
        }
        html += '</tbody>';
        html += '</table>';

        if (num === 1) {
            hashStrong_1 = hashStrong;
            Firmware_1 = application;
            HashStrong_1 = HashStrong;
        } else {
            hashStrong_2 = hashStrong;
            Firmware_2 = application;
            HashStrong_2 = HashStrong;
        }

        return html;
    } //buildHTML

    function hexToSignedInt(hex) {
        if (hex.length % 2 !== 0) {
            hex = "0" + hex;
        }
        var num = parseInt(hex, 16);
        var maxVal = Math.pow(2, hex.length / 2 * 8);
        if (num > maxVal / 2 - 1) {
            num = num - maxVal;
        }
        return num;
    } //hexToSignedInt

    function hexToUnsignedInt(hex) {
        if (hex.length % 2 !== 0) {
            hex = "0" + hex;
        }
        var num = parseInt(hex, 16);
        return num;
    } //hexToUnsignedInt

    function rowClick(str) {
        //str:
        //PAGE,DEV,COL1 COL2 COL3 COL4
        //PAGE    = 1/2
        //DEV     = device no
        //COL1    = parameter name/ parameter no
        //COL2..4 = parameter columns (value, type, bytes)
        //1,6,ZDDXMLFile 2050-0086-0002-0064-03-06-51-00-00.xml
        //1,18,Wakeup Interval 3600
        //1,6,2 0/0x00 int 1
        //alert(str.hexEncode());
        //alert(str);

        //split parameters part 1: (by ,)
        var par = str.split(',');
        var num = par[0]*1;
        var device = par[1]*1;

        //split parameters part 2: (by 0x00a0)
        var nl = '\u00a0';
        var re1 = new RegExp(nl+'+', 'g');
        var re2 = new RegExp(nl+'+$');
        var re3 = new RegExp('^'+nl+'+');

        var rowString = par[2];
        rowString = par[2].replace(re1, nl)
                          .replace(re2, '')
                          .replace(re3, '');
        var row = rowString.split(nl);
        var parameter = row[0];
        var val_1 = row[1].replace(/ .*$/, '');
        var value = val_1.replace(/\/.*$/, '');
        var valueHex = val_1.replace(/^.*\//, '');
        var valueUnsigned =  val_1.replace(/\/0x.*$/, '').replace(/^.*\//, '');
        var type = row[2];
        var length = row[3]*1;

        if (parameter === 'ZDDXMLFile') {
            buildXMLList(num, device, value);
        } else if (parameter.indexOf('Wakeup') >= 0) {
            wakeupChange(num, device, value);
        } else {
            if (parameter.slice(-1) === '*') {
                parameter = parameter.slice(0, -1);
            }
            if (parameter && ! isNaN(parameter)) {
                valueChange(num, device, parameter*1, value, type, length, valueHex, valueUnsigned);
            }
        }
    } //rowClick

    function wakeupChange(num, device, value) {
        if (num === 1) {
            html2 = undefined;
        } else {
            html1 = undefined;
        }
        device_curr = device;
        var n = num === 1 ? 2 : 1;

        var html = '';
        html += '<h3>'+ch_utils.buildMessage(15,device)+'</h3>';
        html += '<br><br><br>';

        var min = devicesArray[device].wakeupInterval_min;
        var max = devicesArray[device].wakeupInterval_max;
        var defaultt = devicesArray[device].wakeupInterval_default;
        html += '<label for="newVal">'+ch_utils.buildMessage(10)+'</label>';
        html += '<input type="number" min="'+min+'" max="'+max+'" id="newVal" name="newVal" value="'+value+'" required>';
        html += '&nbsp;&nbsp;'+ch_utils.buildMessage(17, defaultt);

        html += '<br><label for="disableWakeup">'+messageFormats[16][lang]+'</label>';
        html += '<input type="checkbox" id="disableWakeup" name="disableWakeup" value="Bike"><br>';

        html += '<br><button type="button" id="submitStoreWakeup">'+messageFormats[ixButtonTextBase+5][lang]+'</button>';
        html += messageFormats[14][lang];
        document.getElementById('json-renderer'+n).innerHTML = html;
        eval('document.getElementById("disableWakeup").checked = false;');
        eval("document.querySelector('#submitStoreWakeup').addEventListener('click', submitStoreWakeup);");
    } //wakeupChange

    function valueChange(num, device, parameter, value, type, length, valueHex, valueUnsigned) {
        if (num === 1) {
            html2 = undefined;
        } else {
            html1 = undefined;
        }
        device_curr = device;
        param_curr = parameter;
        length_curr = length;
        var n = num === 1 ? 2 : 1;

        var html = '';
        html += '<h3>'+ch_utils.buildMessage(9, parameter, device)+'</h3><br>';

        var types = ['int'];
        if (types.indexOf(type) >= 0) {
            var min, max, enumList;
            if (length === 1) {
                min = -128;
                max = 127;
            } else
            if (length === 2) {
                min = -32768;
                max = 32767;
            } else
            if (length === 4) {
                min = -2147483648;
                max = 2147483647;
            } else { //may not occur
                html += '<font color="red"><b>'+ch_utils.buildMessage(20, length)+'<\/b><\/font>';
                min = value;
                max = value;
            }
            var step = 1;
            var evalNewVal;
            var convertToInternal = function(value, bytes) {
                return ' = '+signedToUnsigned(value, bytes);
            };
            var initOutput = ' = '+valueUnsigned+'/'+valueHex;
            var scaleTitle = '';
            valueConvert = undefined;

            //special devices:
            var devIdString = num === 1 ? hashStrong_1 : hashStrong_2;
            if (paramConvertArray[devIdString]) {  //look for device
                //alert(paramConvertArray[devIdString].name);
                if (paramConvertArray[devIdString][parameter]) {   //look for parameter
                    var parDetailsIx = paramConvertArray[devIdString][parameter];
                    //alert(parDetailsIx);
                    var parDetails = paramConvertArrayDetails[parDetailsIx];
                    var item = parDetails.convertToUser(hexToUnsignedInt(valueHex), length, device);
                    var name = parDetails.name;
                    step = item.step;
                    if (item.valueHex) {valueHex = item.valueHex;}
                    if (item.valueUnsigned) {valueUnsigned = item.valueUnsigned;}
                    if (item.length) {
                        length = item.length;
                        length_curr = length;
                    }
                    if (item.scaleTitle) {scaleTitle = item.scaleTitle;}
                    convertToInternal = function(value, bytes) {
                        return '';
                    };
                    initOutput = '';
                    //if (item.valueDisp) {
                        html += name+': '+valueHex+' = '+item.valueDisp+'<br><br>';
                    //} else {
                    //    html += name+': '+valueHex+' = '+item.value+' '+item.scaleTitle+'<br><br>';
                    //}
                    value = item.value;

                    if (item.enum !== undefined) {enumList = item.enum;}

                    if (item.min !== undefined) {
                        min = item.min+'';
                        html += 'min     = '+min+'<br>';
                        min = (min.replace(/ .*$/, ''))-0;
                    }
                    if (item.max !== undefined) {
                        max = item.max+'';
                        html += 'max     = '+max+'<br>';
                        max = (max.replace(/ .*$/, ''))-0;
                    }
                    if (item.step !== undefined) {html += 'step    = '+step+'<br>';}
                    if (item.default !== undefined) {html += 'default = '+item.default+'<br>';}
                    if (item.remark) {html += item.remark+'<br>';}
                    valueConvert = 'paramConvertArrayDetails["'+parDetailsIx+'"].convertToInternal(value, '+
                                   length+')';
                    //alert(valueConvert);
                }
            }

            html += '<br><br>';

            if (enumList) {
                var opt = '';
                Object.keys(enumList).forEach(function(key) {
                    if (value ===  item.enum[key]) {
                        opt = 'checked';
                    } else {
                        opt = 'unchecked';
                    }
                    html += '<input type="radio" id="'+key+'" name="enumList" value="'+key+'" '+opt+'>';
                    html += '<label for="'+key+'">'+item.enum[key]+'</label><br>';
                });
            } else {
                html += '<script>'+
                        'function signedToUnsigned(val, bytes) {'+
                            'var maxUnsigned = parseInt("0xF".padEnd(bytes*2+2, "F")) + 1;'+
                            'var valUnsigned = val < 0 ? maxUnsigned + val : val;'+
                            'var hex = (valUnsigned*1).toString(16).padStart(bytes*2, "0").toUpperCase();'+
                            'return valUnsigned+"/0x"+hex;'+
                        '}</script>';

                html += '<form oninput="x.value='+convertToInternal+'(newVal.value-0, '+length+')">';
                html += '<label for="newVal">'+ch_utils.buildMessage(10)+'</label>';
                html += '<input type="number" min="'+min+'" max="'+max+'" id="newVal" name="newVal" value="'+value+
                    '" step="'+step+'" required>';
                html += '<output name="x" for="newVal">'+initOutput+'</output> '+scaleTitle+'<br>';
            }

            html += '<label for="setDefault">'+messageFormats[18][lang]+'</label>';
            html += '<input type="checkbox" id="setDefault" name="setDefault" value="Bike"><br><br>';

            html += '<button type="button" id="submitStore">'+messageFormats[ixButtonTextBase+5][lang]+'</button>';
            html += messageFormats[14][lang];
            document.getElementById('json-renderer'+n).innerHTML = html;
            eval('document.getElementById("setDefault").checked = false;');
            eval("document.querySelector('#submitStore').addEventListener('click', submitStore);");
        } else {
            html += ch_utils.buildMessage(11, type);
        }
    } //valueChange

    //send new xml
    function submitZDDX() {
        //checkLogin (function() {sendZDDX();});
        sendZDDX();

    } //submitZDDX

    //send new xml
    function sendZDDX() {
        var value = document.getElementById("storeZDDX").value || "";

        //store to file:
        var urlFormat = '/JS/Run/zway.devices[{0}].data.ZDDXMLFile="{1}"';
        //Failure with ZWaveAPI und ZWave.zway !!!!
        // >>> login is necessary
        var url = urlFormat.format(device_curr, value);

        sendUrl([url]);
    } //sendZDDX

    //validate input
    function validInput(value, min, max) {
        if (value.trim() === '' || isNaN(value) || value < min || value > max) {
            ch_utils.alertMessage(22);
            return false;
        } else {
            return true;
        }
    } //validInput

    //send new value
    function submitStore() {
        //store to file:
        //var urlFormat1 = '/ZWave.zway/Run/zway.devices[{0}].instances[0].commandClasses[112].data[{1}].val={2}';
        //var url1 = urlFormat1.format(device_curr, param_curr, value);

        //request current value:
        //var urlFormat3 = '/ZWave.zway/Run/zway.devices[{0}].instances[0].commandClasses[112].Get({1})';
        //var url3 = urlFormat3.format(device_curr, param_curr);

        var defaultt = document.getElementById("setDefault").checked;
        var value;
        if (!defaultt) {
            value   = $('input[name=enumList]:checked').val();
            if (value === undefined) {
                value = document.getElementById("newVal").value;
                var min = document.getElementById("newVal").min;
                var max = document.getElementById("newVal").max;
                if (!validInput(value, min-0, max-0)) {return;}
                //console.log(document.getElementById("newVal"));
            }

            if (valueConvert) {
                value = eval(valueConvert);
                //alert(value);
            }
        }

        //send to device:
        var urlFormat1 = '/ZWave.zway/Run/zway.devices[{0}].instances[0].commandClasses[112].SetDefault({1})';
        var urlFormat2 = '/ZWave.zway/Run/zway.devices[{0}].instances[0].commandClasses[112].Set({1},{2},{3})';
        var url;
        if (defaultt) {
            url = urlFormat1.format(device_curr, param_curr);
        } else {
            url = urlFormat2.format(device_curr, param_curr, value, length_curr);
        }

        //sendUrl([url1, url2, url3]);
        sendUrl([url]);
    } //submitStore

    //send new value
    function submitStoreWakeup() {
        var value = document.getElementById("newVal").value;
        var checked = document.getElementById("disableWakeup").checked;
        if (checked) { value = 0;}

        //store to file:
        //var urlFormat1 = '/ZWave.zway/Run/zway.devices[{0}].instances[0].commandClasses[132].data.interval={2}';
        //var url1 = urlFormat1.format(device_curr, value);

        //send to device:
        var urlFormat2 = '/ZWave.zway/Run/devices[{0}].instances[0].commandClasses[132].Set({1},1)';
        var url2 = urlFormat2.format(device_curr, value);

        //request current value:
        //var urlFormat3 = '/ZWave.zway/Run/zway.devices[{0}].instances[0].commandClasses[132].Get()';
        //var url3 = urlFormat3.format(device_curr);

        //sendUrl([url1, url2, url3]);
        sendUrl([url2]);
    } //submitStoreWakeup

    function sendUrl(urlArr) {
        var url = urlArr.shift();

        try {
            console.log('sendUrl '+url);
            var fail;
            var no_data = success;
            ch_utils.ajax_get(url, success, fail, no_data);
	    } catch (err) {
            alert('err: '+err.message);
        }
        function success (data) {
            console.log('sendUrl success');
            console.log(data);
            if (urlArr.length > 0) {
                sendUrl(urlArr);
            } else {
                //alert('OK');
                if(confirm('OK'+ch_utils.buildMessage(23)))
                {
                    update = true;
                    startDatacollection();
                }
            }
        }
    } //sendUrl

    document.getElementById('storeFile').addEventListener('click', function() {
        storeJSON(urlData, 'Data0.json');

        function storeJSON (urlSource, filename){
            var blob = new Blob([{}], {type: 'text/json'}),
                e    = document.createEvent('MouseEvents'),
                a    = document.createElement('a');

            a.download = filename;
            a.href = urlSource;
            a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
        } //storeJSON
    }, true);

    document.getElementById('loadFile').addEventListener('click', function() {
        toggleVisibleButtons(false);
    }, true);

    document.getElementById('Update').addEventListener('click', function() {
        update = true;
        startDatacollection();
    }, true);

    document.getElementById('configuration1').addEventListener('click', function() {
        if (devNumKeySelected1.length > 0) {
            var URL = '/expert/#/configuration/interview/'+devNumKeySelected1;
            window.open(URL);
        }
    }, true);

    document.getElementById('configuration2').addEventListener('click', function() {
        if (devNumKeySelected2.length > 0) {
            var URL = '/expert/#/configuration/interview/'+devNumKeySelected2;
            window.open(URL);
        }
    }, true);

    document.getElementById('Print').addEventListener('click', function() {
        printHTML();
    }, true);

    function printHTML() {
        var opt1 = '', opt2 = '', opt12 = '', optall = '';
        if (devNumKeySelected1 !== '') {
            opt1 = 'checked';
        } else
        if (devNumKeySelected2 !== '') {
            opt2 = 'checked';
        } else {
            optall = 'checked';
        }
        if (devNumKeySelected1 === '') {
            opt1 = 'disabled';
            opt12 = 'disabled';
        }
        if (devNumKeySelected2 === '') {
            opt2 = 'disabled';
            opt12 = 'disabled';
        }

        var html = '';
        html += '<h3>'+ch_utils.buildMessage(13)+'</h3>';
        html += '<br><br><br>';

        html += '<input type="radio" id="p1" name="printout" value="p1" '+opt1+'>';
        html += '<label for="p1">'+messageFormats[ixButtonTextBase+9][lang]+'</label><br>';
        html += '<input type="radio" id="p2" name="printout" value="p2" '+opt2+'>';
        html += '<label for="p2">'+messageFormats[ixButtonTextBase+10][lang]+'</label><br>';
        html += '<input type="radio" id="p12" name="printout" value="p12" '+opt12+'>';
        html += '<label for="p12">'+messageFormats[ixButtonTextBase+11][lang]+'</label><br>';
        html += '<input type="radio" id="pall" name="printout" value="pall" '+optall+'>';
        html += '<label for="pall">'+messageFormats[ixButtonTextBase+12][lang]+'</label><br>';

        html += '<br><br>';
        html += '<input type="radio" id="newpage1" name="newpage"  value="yes">';
        html += '<label for="newpage1">'+messageFormats[ixButtonTextBase+13][lang]+'</label><br>';
        html += '<input type="radio" id="newpage2" name="newpage"  value="no" checked>';
        html += '<label for="newpage2">'+messageFormats[ixButtonTextBase+14][lang]+'</label><br>';

        html += '<br><br>';
        html += '<button type="button" id="submitPrint">'+messageFormats[ixButtonTextBase+5][lang]+'</button>';

        var n = 2;
        html2 = undefined;
        document.getElementById('json-renderer'+n).innerHTML = html;

        eval("document.querySelector('#submitPrint').addEventListener('click', submitPrint);");
    } //printHTML

    //send new xml
    function submitPrint() {
        var value   = $('input[name=printout]:checked').val();
        var newpage = $('input[name=newpage]:checked').val();

        var np = '<div class="pagebreak"> </div>';
        if (newpage === 'no') {np = '<br><br>';}

        if (value === 'p1') {
            html1 = displayHTML(1, devNumKeySelected1);
            buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);

            printReport($('#json-renderer1').html());
        } else
        if (value === 'p2') {
            html2 = displayHTML(2, devNumKeySelected2);
            buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);

            printReport($('#json-renderer2').html());
        } else
        if (value === 'p12') {
            html1 = displayHTML(1, devNumKeySelected1);
            html2 = displayHTML(2, devNumKeySelected2);
            buildHTMLDifferences(devNumKeySelected1, devNumKeySelected2);

            printReport($('#json-renderer1').html()+np+$('#json-renderer2').html());
        } else{
            var html = '';
            html += buildDeviceIndex();
            Object.keys(devicesArray).forEach(function(device, ix) {
                if (device > 1) {
                    html += np + buildHTML(1, device);
                }
            });

            printReport(html);
        }
    } //submitPrint

    function buildDeviceIndex() {
        var html = '';
        html += '<table>';
        html += '<thead><tr>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+20)+'</th>';
        html += '<th>'+ch_utils.buildMessage(ix_selectTexts+21)+'</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';
        Object.keys(devicesArray).forEach(function(number, ix) {
            html += '<tr>';
            html += '<td align=center>#'+number+'</td>';
            html += '<td align=left>'+devicesArray[number].givenName+'</td>';
            html += '</tr>\n';
        });
        html += '</tbody>';
        html += '</table>';
        return html;
    } //buildDeviceIndex

    function printReport(divElements) {
        //create the div that will contain the stuff to be printed
        var $printerDiv = $('<div id="printContainer" class="printContainer"></div>');
        //add the content to be printed
        //add the div to body, and make the body aware of printing
        //(we apply a set of css styles to the body to hide its contents)
        $('body').append($printerDiv).addClass("printingContent");
        $('#all').hide();
        //call print
        $printerDiv.html(divElements);
        window.print();
        //remove the div
        $printerDiv.remove();
        $('body').removeClass("printingContent");
        $('#all').show();
    }

}); //$(document).ready

    // converts unsigned integer to signed integer:
    function signedToUnsigned(value, bytes) {
        var maxUnsigned = parseInt('0xF'.padEnd(bytes*2+2, 'F')) + 1;
        return value < 0 ? maxUnsigned + value : value;
    } //signedToUnsigned
            
    function toggleVisibleButtons(bool) {
        if (bool) {
            ch_utils.buttonVisible('Update', true);
            ch_utils.buttonVisible('storeFile', true);
            ch_utils.buttonVisible('loadFile', true);
            ch_utils.buttonVisible('selectFile', false);
        } else {
            ch_utils.buttonVisible('Update', false);
            ch_utils.buttonVisible('storeFile', false);
            ch_utils.buttonVisible('loadFile', false);
            ch_utils.buttonVisible('selectFile', true);
        }
    } //toggleVisibleButtons

String.prototype.format = function() {
    var a = this;
    for (var k in arguments) {
        if (k) {
            a = a.replace("{" + k + "}", arguments[k]);
        }
    }
    return a;
};

String.prototype.hexEncode = function() {
    var hex, i;
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result;
};

function langTexts() {
    document.title = ch_utils.buildMessage(0);
    ch_utils.displayText('title1', ixButtonTextBase + 0);
    ch_utils.buttonText('label1', 1);
    ch_utils.buttonText('label2', 2);
    ch_utils.buttonText('label3', 3);
    ch_utils.buttonText('Print', 7);
    ch_utils.buttonText('Update', 8);
    ch_utils.buttonText('storeFile', 15);
    ch_utils.buttonText('loadFile', 16);
    toggleVisibleButtons(true);
    ch_utils.buttonText('configuration1', 17);
    ch_utils.buttonText('configuration2', 17);
} //langTexts
