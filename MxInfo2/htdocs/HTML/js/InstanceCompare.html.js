//h-------------------------------------------------------------------------------
//h
//h Name:         InstanceCompare.html.js
//h Type:         Javascript module
//h Purpose:      Compare 2 instances of same module.
//h               module MxInfo2
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.7 2022-07-16/peb
//v History:      V1.0 2020-06-04/peb first version
//v               V1.5 2020-12-05/peb [+]button 'configuration'
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*jshint evil: true */
/*globals $, json2html, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='InstanceCompare.html.js';
var VERSION='V1.7';
var WRITTEN='2022-07-16/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 8;
var ix_selectTexts = 22;
var messageFormats = [
    //message texts (0+...):
    {
        de: 'Modul Instanzen',
        en: 'Module Instances'
    },
    {
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {
        de: 'Hallo %s, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo %s, sorry, you have no administrator rights to read the data!'
    },
    {
        de: 'Instanzendaten werden gelesen...',
        en: 'Reading instance data...'
    },
    {//4
        de: 'Instanzendaten werden verarbeitet...',
        en: 'Treating incstances data...'
    },
    {//5
        de: 'Bitte eine Auswahl vornehmen!',
        en: 'Please make a select!'
    },
    {
        de: '%s',
        en: '%s'
    },
    {
        de: "Ausdruck der Instanzen",
        en: "Instances Printout"
    },

    //ixButtonTextBase button texts (8+...):
    {
        de: 'Modul: ',
        en: 'Module: '
    },
    {
        de: 'Instanz 1: ',
        en: 'Instance 1: '
    },
    {
        de: 'Instanz 2: ',
        en: 'Instance 2: '
    },
    {
        de: '<b>Modul Instanzen:</b>',
        en: '<b>Module Instances:</b>'
    },
    {
        de: 'Drucken',
        en: 'Print'
    },
    {
        de: 'Absenden',
        en: 'Submit'
    },
    {
        de: 'Instanz 1',
        en: 'Instance 1'
    },
    {
        de: 'Instanz 2',
        en: 'Instance 2'
    },
    {
        de: 'Instanz 1+2',
        en: 'Instance 1+2'
    },
    {
        de: 'alle Instanzen des gewählten Moduls',
        en: 'all instances of the selected module'
    },
    {
        de: 'alle Instanzen aller Module',
        en: 'all instances of all modules'
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
        de: 'Konfig',
        en: 'Config'
    },

    // ix_selectTexts select texts (22+...):
    {
        de: 'Keine Auswahl',
        en: 'Nothing selected'
    },
    {
        de: 'Modul',
        en: 'Module'
    },
    {
        de: 'Instanz',
        en: 'Instance'
    },
    {
        de: 'Titel',
        en: 'Title'
    },
];

var instancesArray;
var modulesArray;
var moduleIdselected = '';
var instance1Idselected = '';
var instance2Idselected = '';
var instance1, instance2;
var allDevices;
var buff1 = '', buff2 = '';
var styleMark = '_$$$_';
var instancesData;  //only for printout

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    langTexts();
    ch_utils.requireAdmin(startDatacollection, BasicAuth);

    function startDatacollection() {
        getInstanceList();
        getAllDevices();
    } //startDatacollection

    function getInstanceList() {
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/instances';
        ch_utils.ajax_get(url, success);
        function success (data) {
            instancesData = data.data;
            buildInstanceArray(instancesData);
            modulesArray = modulesArray.sort();
            buildSelectBoxModule(modulesArray);
        }

    } //getInstanceList

    function buildInstanceArray(instancesData) {
        ch_utils.displayMessage(4);
        modulesArray = [];
        instancesArray = {};

        var elId;
        var i;
        var option;
        elId = document.getElementById('selInstance1');
        i = 0;
        option = new Option(messageFormats[ix_selectTexts+0][lang], '');
        elId.options[i++] = option;

        elId = document.getElementById('selInstance2');
        i = 0;
        option = new Option(messageFormats[ix_selectTexts+0][lang], '');
        elId.options[i++] = option;

        instancesData.forEach(function(instance, ix) {
            if (! instancesArray.hasOwnProperty(instance.moduleId)) {
                modulesArray.push(instance.moduleId);
                instancesArray[instance.moduleId] = [];
            }
            instancesArray[instance.moduleId].push({title: instance.title,
                                                    id:    instance.id,
                                                    path:  instance});
        });
        //alert(JSON.stringify(instancesArray));

    } //buildInstanceArray

    function buildSelectBoxModule(modulesArray) {
        moduleIdselected = '';
        var elId = document.getElementById('selModules');
        var i = 0;
        var option = new Option(messageFormats[ix_selectTexts+0][lang], '');
        elId.options[i++] = option;

        modulesArray.forEach(function(module, ix) {
            option = new Option(module, module);
            elId.options[i++] = option;
        });
        if (moduleIdselected.length === 0) {
            ch_utils.displayMessage(5);
        }
    } //buildSelectBoxModule

    function buildSelectBoxInstance1(moduleArray) {
        instance1Idselected = '';
        var elId = document.getElementById('selInstance1');
        elId.selectedIndex = 0;
        var length = elId.options.length;
        for (var j = length-1; j >= 0; j--) {
            elId.remove(j);
        }
        var i = 0;
        var option = new Option(messageFormats[ix_selectTexts+0][lang], '');
        elId.options[i++] = option;

        if (moduleArray) {
            moduleArray.sort(function(a, b){
                var x = a.title.toLowerCase();
                var y = b.title.toLowerCase();
                if (x < y) {return -1;}
                if (x > y) {return 1;}
                return 0;
            });
            moduleArray.sort().forEach(function(instance, ix) {
                option = new Option(instance.id+': '+instance.title, instance.id);
                elId.options[i++] = option;
            });
        }
        if (instance1Idselected.length === 0) {
            document.getElementById('json-renderer1').innerHTML = '';
            ch_utils.displayMessage(5);
        }
    } //buildSelectBoxInstance1

    function buildSelectBoxInstance2(moduleArray) {
        instance2Idselected = '';
        var elId = document.getElementById('selInstance2');
        elId.selectedIndex = 0;
        var length = elId.options.length;
        for (var j = length-1; j >= 0; j--) {
            elId.remove(j);
        }
        var i = 0;
        var option = new Option(messageFormats[ix_selectTexts+0][lang], '');
        elId.options[i++] = option;

        if (moduleArray) {
            moduleArray.sort(function(a, b){
                var x = a.title.toLowerCase();
                var y = b.title.toLowerCase();
                if (x < y) {return -1;}
                if (x > y) {return 1;}
                return 0;
            });
            moduleArray.forEach(function(instance, ix) {
                option = new Option(instance.id+': '+instance.title, instance.id);
                elId.options[i++] = option;
            });
        }
        if (instance2Idselected.length === 0) {
            document.getElementById('json-renderer2').innerHTML = '';
            ch_utils.displayMessage(5);
        }
    } //buildSelectBoxInstance2

    document.getElementById('selModules').addEventListener('click', function() {
        var moduleIdselectedOld = moduleIdselected;
        moduleIdselected = this.value;
        if (moduleIdselected !== moduleIdselectedOld) {
            buildSelectBoxInstance1(instancesArray[moduleIdselected]);
            buildSelectBoxInstance2(instancesArray[moduleIdselected]);
        }
    }, true);

    document.getElementById('selInstance1').addEventListener('click', function() {
        var instance1IdselectedOld = instance1Idselected;
        instance1Idselected = this.value;
        instance1Idselected = !instance1Idselected ? '' : instance1Idselected;
        instance2Idselected = !instance2Idselected ? '' : instance2Idselected;

        if (instance1Idselected !== instance1IdselectedOld) {
            ch_utils.displayMessage(6);
            buff1 = '';
            if (instance1Idselected === '') {
                document.getElementById('json-renderer1').innerHTML = '';
                if (instance2Idselected !== '' && buff2 !== '') {
                    $('#json-renderer2').jsonViewer(buff2, {
                        collapsed: false,
                        rootCollapsable: false,
                        withQuotes: false
                    });
                }
            } else{
                var url = '/ZAutomation/api/v1/instances/'+instance1Idselected;
                ch_utils.ajax_get(url, success);
            }
        }
        function success (buffer) {
            buff1 = addDeviceNames(buffer.data);
            $('#json-renderer1').jsonViewer(buff1, {
                collapsed: false,
                rootCollapsable: false,
                withQuotes: false
            });
            dispDifferences();
        }
    }, true);

    document.getElementById('selInstance2').addEventListener('click', function() {
        var instance2IdselectedOld = instance2Idselected;
        instance2Idselected = this.value;
        instance1Idselected = !instance1Idselected ? '' : instance1Idselected;
        instance2Idselected = !instance2Idselected ? '' : instance2Idselected;

        if (instance2Idselected !== instance2IdselectedOld) {
            ch_utils.displayMessage(6);
            buff2 = '';
            if (instance2Idselected === '') {
                document.getElementById('json-renderer2').innerHTML = '';
                if (instance1Idselected !== '' && buff1 !== '') {
                    $('#json-renderer1').jsonViewer(buff1, {
                        collapsed: false,
                        rootCollapsable: false,
                        withQuotes: false
                    });
                }
            } else{
                var url = '/ZAutomation/api/v1/instances/'+instance2Idselected;
                ch_utils.ajax_get(url, success);
            }
        } else {
            if (instance2Idselected !== '') {
                $('#json-renderer2').jsonViewer(buff2, {
                    collapsed: false,
                    rootCollapsable: false,
                    withQuotes: false
                });
                dispDifferences();
            }
        }
        function success (buffer) {
            buff2 = addDeviceNames(buffer.data);
            $('#json-renderer2').jsonViewer(buff2, {
                collapsed: false,
                rootCollapsable: false,
                withQuotes: false
            });
            dispDifferences();
        }
    }, true);

    function isNormalInteger(str) {
        return /^\d+$/.test(str);
    }

    function parseObjectProperties (txt, obj, parse) {
        for (var k in obj) {
            if (k) {
                if (k.indexOf('.') >= 0) {
                    k = '"'+k+'"';      //esp. for Cron
                }
                var t;
                if (txt === '') {
                    t = k;
                } else {
                    if (isNormalInteger(k)) {
                        t = txt+'['+k+']';
                    } else {
                        t = txt+'.'+k;
                    }
                }
                if (typeof obj[k] === 'object' && obj[k] !== null) {
                    if (!Array.isArray(obj[k]))     {
                    //console.log('obj '+t);
                    parseObjectProperties(t, obj[k], parse);
                    } else {
                        //console.log('arr '+t);
                        parseObjectProperties(t, obj[k], parse);
                    }
                } else if (obj.hasOwnProperty(k)) {
                    //console.log(t);
                    parse(t);
                }
            }
        }
    }

    function markDifferences(buffa, buffb, Numa, Numb) {
        var buff = JSON.parse(JSON.stringify(buffa));
        parseObjectProperties('', buff, function(prop) {
            //console.log(prop);

            if (prop.indexOf(styleMark) >= 0) {
                return;
            }
            while (prop.lastIndexOf(']') === prop.length-1) {
                prop = prop.replace(/\[[0-9]*\]$/, '');
                //console.log(prop);
            }
            try {
                var vala = eval('buff'+Numa+'.'+prop);
                var valb = eval('buff'+Numb+'.'+prop);
                if (vala !== valb) {
                    eval('buff.'+prop+styleMark+' = "background-color:yellow"');
                }
            } catch(err) {
                try {
                    eval('buff.'+prop+styleMark+' = "background-color:yellow"');
                } catch(err) {
                    console.log('error setting buff.'+prop+styleMark+' = "background-color:yellow"');
                    console.log(err.message);
                }
            }

        });

        $('#json-renderer'+Numa).jsonViewer(buff, {
            collapsed: false,
            rootCollapsable: false,
            withQuotes: false,
            styleTag: styleMark
        });
    } //markDifferences

    function dispDifferences() {
        if (instance1Idselected === '' || buff1 === '' ||
            instance2Idselected === '' || buff2 === '') {
            return;
        }
        markDifferences(buff1, buff2, 1, 2);
        markDifferences(buff2, buff1, 2, 1);
     } //dispDifferences

    function addDeviceNames(instBuffer) {
        var buff = JSON.stringify(instBuffer);
        Object.keys(allDevices).forEach(function(device, ix) {
            if (device) {
                var re = new RegExp('"'+device+'"',"gi");
                buff = buff.replace(re, '"'+device+" ("+allDevices[device]+')"');
            }
        });
        var buffJSON = JSON.parse(buff);
        buffJSON.creationTime = ch_utils.userTime(buffJSON.creationTime);
        return buffJSON;
    } //addDeviceNames

    function getAllDevices() {
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/namespaces/devices_all';
        ch_utils.ajax_get(url, success);
        function success (buffer) {
            allDevices = {};
            buffer.data.forEach(function(dev, ix) {
                allDevices[dev.deviceId] = dev.deviceName;
            });
        }
    } //getAllDevices

    document.getElementById('configuration1').addEventListener('click', function() {
        if (instance1Idselected.length > 0) {
            var URL = '/smarthome/#/module/put/'+instance1Idselected;
            window.open(URL);
        }
    }, true);

    document.getElementById('configuration2').addEventListener('click', function() {
        if (instance2Idselected.length > 0) {
            var URL = '/smarthome/#/module/put/'+instance2Idselected;
            window.open(URL);
        }
    }, true);

    document.getElementById('Print').addEventListener('click', function() {
        printHTML();
    }, true);

    function printHTML() {
        var opt1 = '', opt2 = '', opt12 = '', optmodule = '', optall = '';
        if (instance1Idselected !== '') {
            opt1 = 'checked';
        } else
        if (instance2Idselected !== '') {
            opt2 = 'checked';
        } else {
            if (moduleIdselected !== '') {
                optmodule = 'checked';
            } else {
                optall = 'checked';
            }
        }
        if (instance1Idselected === '') {
            opt1 = 'disabled';
            opt12 = 'disabled';
        }
        if (instance2Idselected === '') {
            opt2 = 'disabled';
            opt12 = 'disabled';
        }
        if (moduleIdselected === '') {
            optmodule = 'disabled';
        }

        var html = '';
        html += '<h3>'+ch_utils.buildMessage(7)+'</h3>';
        html += '<br><br><br>';

        html += '<input type="radio" id="p1" name="printout" value="p1" '+opt1+'>';
        html += '<label for="p1">'+messageFormats[ixButtonTextBase+6][lang]+'</label><br>';
        html += '<input type="radio" id="p2" name="printout" value="p2" '+opt2+'>';
        html += '<label for="p2">'+messageFormats[ixButtonTextBase+7][lang]+'</label><br>';
        html += '<input type="radio" id="p12" name="printout" value="p12" '+opt12+'>';
        html += '<label for="p12">'+messageFormats[ixButtonTextBase+8][lang]+'</label><br>';
        html += '<input type="radio" id="pall" name="printout" value="pmodule" '+optmodule+'>';
        html += '<label for="pall">'+messageFormats[ixButtonTextBase+9][lang]+'</label><br>';
        html += '<input type="radio" id="pall" name="printout" value="pall" '+optall+'>';
        html += '<label for="pall">'+messageFormats[ixButtonTextBase+10][lang]+'</label><br>';

        html += '<br><br>';
        html += '<input type="radio" id="newpage1" name="newpage"  value="yes">';
        html += '<label for="newpage1">'+messageFormats[ixButtonTextBase+11][lang]+'</label><br>';
        html += '<input type="radio" id="newpage2" name="newpage"  value="no" checked>';
        html += '<label for="newpage2">'+messageFormats[ixButtonTextBase+12][lang]+'</label><br>';

        html += '<br><br>';
        html += '<button type="button" id="submitPrint">'+messageFormats[ixButtonTextBase+5][lang]+'</button>';

        var n = 2;
        document.getElementById('json-renderer'+n).innerHTML = html;

        eval("document.querySelector('#submitPrint').addEventListener('click', submitPrint);");
    } //printHTML

    function submitPrint() {
        var value   = $('input[name=printout]:checked').val();
        var newpage = $('input[name=newpage]:checked').val();

        var np = '<div class="pagebreak"> </div>';
        var html = '';
        if (newpage === 'no') {np = '<br><br>';}

        if (value === 'p1') {
            printReport($('#json-renderer1').html());
        } else
        if (value === 'p2') {
            $('#json-renderer2').jsonViewer(buff2, {
                collapsed: false,
                rootCollapsable: false,
                withQuotes: false
            });
            dispDifferences();

            printReport($('#json-renderer2').html());
        } else
        if (value === 'p12') {
            $('#json-renderer2').jsonViewer(buff2, {
                collapsed: false,
                rootCollapsable: false,
                withQuotes: false
            });
            dispDifferences();

            printReport($('#json-renderer1').html()+np+$('#json-renderer2').html());
        } else
        if (value === 'pmodule') {
            html = buildPrintIndex([moduleIdselected]);
            html += buildReport([moduleIdselected], np);
            printReport(html);
        } else{
            html = buildPrintIndex(modulesArray);
            html += buildReport(modulesArray, np);
            printReport(html);
        }
    } //submitPrint

    function buildReport(modulesArray, np) {
        var html = '';
        modulesArray.forEach(function(moduleId, ix) {
            var mod = moduleId;
            instancesArray[moduleId].forEach(function(inst, ix2) {
                html += np + $.json2html(addDeviceNames(inst.path), {
                                        collapsed: false,
                                        rootCollapsable: false,
                                        withQuotes: false
                                 });
            });
        });
        return html;
    } //buildReport

    function buildPrintIndex(modulesArray) {
        var html = '';
        html += '<table>';
        html += '<thead><tr>';
        html += '<th align=center>'+ch_utils.buildMessage(ix_selectTexts+1)+'</th>';
        html += '<th align=center>&nbsp;&nbsp;'+ch_utils.buildMessage(ix_selectTexts+2)+'&nbsp&nbsp;</th>';
        html += '<th align=center>'+ch_utils.buildMessage(ix_selectTexts+3)+'</th>';
        html += '</tr></thead>';
        html += '<tbody>\n';
        modulesArray.forEach(function(moduleId, ix) {
            var mod = moduleId;
            instancesArray[moduleId].forEach(function(inst, ix2) {
                html += '<tr>';
                html += '<td align=left>'+mod+'</td>';
                html += '<td align=center>'+inst.id+'</td>';
                html += '<td align=left>'+inst.title+'</td>';
                html += '</tr>\n';
                mod = '';
            });
        });
        html += '</tbody>';
        html += '</table>';
        return html;
    } //buildPrintIndex

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

function langTexts() {
    document.title = ch_utils.buildMessage(0);
    ch_utils.displayText('title1', 0);
    ch_utils.buttonText('selModulesLabel', 0);
    ch_utils.buttonText('selInstance1Label', 1);
    ch_utils.buttonText('selInstance2Labe', 2);
    ch_utils.buttonText('Print', 4);
    ch_utils.buttonText('configuration1', 13);
    ch_utils.buttonText('configuration2', 13);
} //langTexts
