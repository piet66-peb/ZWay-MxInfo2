//h-------------------------------------------------------------------------------
//h
//h Name:         MxLogging.html.js
//h Type:         Javascript module
//h Purpose:      Switch active + logging of Mx instances on/off.
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V2.0.1 2024-08-10/peb
//v History:      V1.0   2023-10-07/peb first version
//v               V2.0.0 2024-06-04/peb [*]set logging parameter 
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
var MODULE='MxLogging.html.js';
var VERSION='V2.0.1';
var WRITTEN='2024-08-10/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 11;
var ix_selectTexts = 12;
var messageFormats = [
    //message texts (0+...):
    {//0
        de: 'Mx Logging',
        en: 'Mx Logging'
    },
    {//1
        de: 'Sie müssen sich zuerst als Administratur anmelden!',
        en: 'You have to log in first as administrator!'
    },
    {//2
        de: 'Hallo {0}, leider haben Sie nicht die erforderlichen Administratorrechte!',
        en: 'Hallo {0}, sorry, you have no administrator rights to read the data!'
    },
    {//3
        de: 'Instanzen werden eingelesen...',
        en: 'Reading instances...'
    },
    {//4
        de: 'Daten werden verarbeitet...',
        en: 'Dataprocessing...'
    },
    {//5
        de: '<b>Mx Modulinstanzen:</b>',
        en: '<b>Mx Module-Instances:</b>'
    },
    {//6
        de: 'Filter...',
        en: 'Filter...',
    },
    {//7
        de: 'Instanz {0} ist gestartet',
        en: 'instance {0} is started',
    },
    {//8
        de: 'Instanz {0} ist beendet',
        en: 'instance {0} is stopped',
    },
    {//9
        de: 'Instanz {0}: Logging ist eingeschaltet',
        en: 'instance {0}: logging is switched on',
    },
    {//10
        de: 'Instanz {0}: Logging ist ausgeschaltet',
        en: 'instance {0}: logging is switched off',
    },

    {//11
        de: 'Instanz {0}: Fehler beim Setzen von Logging ({1})',
        en: 'instance {0}: error at switching logging on/off ({1})',
    },

    //button texts (12+...):
    //select texts (12+...):
    {
        de: 'Instanz',
        en: 'Instance'
    },
    {
        de: 'Titel',
        en: 'Title'
    },
    {
        de: 'Modul',
        en: 'Module'
    },
    {
        de: 'Aktiv',
        en: 'Active'
    },
    {
        de: 'Anzahl: {0}',
        en: 'Number: {0}'
    },
    {//5
        de: 'Logging',
        en: 'Logging'
    },
    {//6
        de: 'nicht gespeicherte Änderungen: ',
        en: 'not saved changes: '
    },
    {//7
        de: 'Änderungen speichern',
        en: 'Save Changes'
    },
    {//8
        de: 'Failed',
        en: 'Failed'
    },
];

var instancesArray;
var changesList = {};
var api_change_pending;

//-----------
//b Functions
//-----------
document.addEventListener("DOMContentLoaded", function(event) {
    //get html language
    var lang = ch_utils.getLanguage();
    ch_utils.convertMessagesToUTF8();

    var BasicAuth = ch_utils.getParameter('BasicAuth');
    console.log('BasicAuth='+BasicAuth);

    ch_utils.buttonVisible('json-renderer', false);
    document.title = ch_utils.buildMessage(0);

    ch_utils.requireAdmin(readInstances, BasicAuth);

    var filterInput = document.getElementById("myInput");
    filterInput.placeholder = ch_utils.buildMessage(6);
    filterInput.focus();

    api_change_pending = null;
    function changeActive(instNo) {
    //---------------------------------------------------------------------
    // ZAutomation API:
    // changing of the instance configuration 
    // always send the complete configuration, missing parameters are reset
    // it results in
    // -implicite stop of the instance, if it is active
    // -start instance (again), if active=true is set
    //---------------------------------------------------------------------
        if (api_change_pending) {
            console.log('waiting for changeActive response from '+api_change_pending);
            return;
        }
        //request current instance configuration
        var url = '/ZAutomation/api/v1/instances/'+instNo;
        ch_utils.ajax_get(url, success_get);

        function success_get (response) {
            //change received instance configuration
            var data = response.data;
            var instNo = data.id;
            var activeNew = instancesArray[instNo].active;
            data.active = activeNew;
            //send changed instance configuration
            api_change_pending = instNo;
            var url = '/ZAutomation/api/v1/instances/'+instNo;
            ch_utils.ajax_put(url, JSON.stringify(data), success_put, fail_put);
        }

        function success_put(response) {
            //console.log(response);
            api_change_pending = null;
            var instNo = response.data.id;
            var active = response.data.active;
            var text;
            if (active === true) {
                text = ch_utils.buildMessage(7, instNo);
            } else {
                text = ch_utils.buildMessage(8, instNo);
            }
            console.log(text);
            alert(text);
        }
        function fail_put(status, statusText) {
            api_change_pending = null;
            alert(status+': '+statusText);
        }
    } //changeActive

    function changeLogging(instNo) {
    //---------------------------------------------------------------------
    // JS API:
    // changing of special parameters in the instance configuration
    // -changing of the active flag doesn't start/stop the instance
    //---------------------------------------------------------------------
        if (api_change_pending) {
            console.log('waiting for changeLogging response from '+api_change_pending);
            return;
        }
        api_change_pending = instNo;
        var loggingNew = instancesArray[instNo].logging;
        var url = [
            '/JS/Run/',
            '{',
                'var obj = controller.instances;',
                'var len = obj.length;',
                'for (var i = 0; i < len; i++) {',
                    'if (obj[i].id === '+instNo+') {',
                        'obj[i].params.logging = '+loggingNew+';',
                        'break;',
                    '}',
                '}',
            '}'
        ].join('');
        ch_utils.ajax_get(url, success_get, fail_get, no_data_get);

        function success_get(response) {
            //console.log(response);
            api_change_pending = null;
            var text;
            if (response === true) {
                text = ch_utils.buildMessage(9, instNo);
            } else
            if (response === false) {
                text = ch_utils.buildMessage(10, instNo);
            } else {
                text = ch_utils.buildMessage(11, instNo, response);
            }
            console.log(text);
            alert(text);
        }
        function no_data_get(response) {
            api_change_pending = null;
            alert(ch_utils.buildMessage(11, instNo, response));
        }
        function fail_get(status, statusText) {
            api_change_pending = null;
            alert(status+': '+statusText);
        }
    } //changeLogging

    function readInstances() {
        //read instances
        changesList = {};
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/instances';
        ch_utils.ajax_get(url, success);
        function success (data) {
            instancesArray = processInstances(data.data);
            var html = buildHTML(instancesArray);
            ch_utils.buttonVisible('json-renderer', true);
            printHTML(html, 5);
            if (filterInput.value.length > 0) {
                myFunction();
            }

            //define checkbox event:
            var checkboxList = document.querySelectorAll('[type="checkbox"]');
            //console.log(checkboxList);
            /*jshint loopfunc:true */
            for (var i = 0; i < checkboxList.length; i++) {
                checkboxList[i].addEventListener('change', function(event) {
                    //console.log(event.target);
                    var id = event.target.id.split('_');
                    var column = id[0];
                    var instNo = id[1];
                    var checked = event.target.checked;
                    if (api_change_pending) {
                        console.log('waiting for changeActive response from '+api_change_pending);
                        event.target.checked = checked ? false : true;
                        return;
                    }
                    changesList[instNo] = 'yes';
                    if (column === 'active') {
                        instancesArray[instNo].active = checked;
                        changeActive(instNo);
                    } else
                    if (column === 'logging') {
                        instancesArray[instNo].logging = checked;
                        changeLogging(instNo);
                    }
                });
            }
            /*jshint loopfunc:false */
        }
    } //readInstances

    function toBoolean(value) {
        value = value === 'true' ? true : value;
        value = value === 'false' ? false : value;
        return value;
    }

    function processInstances(instances) {
        ch_utils.displayMessage(4);

        var instancesArray = {}, active, logging;
        instances.forEach(function(inst, ix) {
            if (inst.moduleId.indexOf('Mx') === 0) {
                //store instance info
                var item = {id: inst.id,
                            module: inst.moduleId,
                            title: inst.title,
                            active: toBoolean(inst.active),
                            logging: toBoolean(inst.params.logging),
                            failed: toBoolean(inst.params.failed),
                        };
                instancesArray[inst.id] = item;
            }
        });
        return instancesArray;
    } //processInstances

    function buildHTML(instancesArray) {
        var countInstNo = 0;

        function nextLine(instNo, col0, col1, col2, col3, col4, col5) {
            var html = '';
            html += '<tr>';
            html += '<td headers="instance" align=center>'+col0+'</td>';
            html += '<td headers="title" align=left>'+col1+'</td>';
            html += '<td headers="module" align=center>'+col2+'</td>';

            var color, val;
            html += '<td headers="active" align=center>';
            switch (col3) {
                case true:
                    html += '<input type="checkbox" id="active_'+instNo+'" checked>';
                    break;
                case false:
                    html += '<input type="checkbox" id="active_'+instNo+'">';
                    break;
                default:
                    color = 'black';
                    val = undefined;
                    html += "<font color='"+color+"'>"+val+"</font>";
                    break;
            }

            html += '<td headers="logging" align=center>';
            switch (col4) {
                case true:
                    html += '<input type="checkbox" id="logging_'+instNo+'" checked>';
                    break;
                case false:
                    html += '<input type="checkbox" id="logging_'+instNo+'">';
                    break;
                default:
                    color = 'black';
                    val = '';
                    html += "<font color='"+color+"'>"+val+"</font>";
                    break;
            }

            html += '<td headers="failed" align=center>';
            switch (col5) {
                case true:
                    html += '<input type="checkbox" id="failed'+instNo+'" checked disabled>';
                    break;
                case false:
                    html += '<input type="checkbox" id="failed'+instNo+'" disabled>';
                    break;
                default:
                    color = 'black';
                    val = '';
                    html += "<font color='"+color+"'>"+val+"</font>";
                    break;
            }

            html += '</td>';
            html += '</tr>\n';

            return html;
        } //nextLine

        var html = '';
        html +=  '<table id="indextable" class="sortable">';
        html += '<thead><tr>';
        html += '<th id="instance"> '+ch_utils.buildMessage(ix_selectTexts+0)+' </th>';
        html += '<th id="title"> '+ch_utils.buildMessage(ix_selectTexts+1)+' </th>';
        html += '<th id="module"> '+ch_utils.buildMessage(ix_selectTexts+2)+' </th>';
        html += '<th id="active" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+3)+' </th>';
        html += '<th id="logging" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+5)+' </th>';
        html += '<th id="failed" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+8)+' </th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        Object.keys(instancesArray).forEach(function(instNo, ix) {
            if (instNo) {
                var t = instancesArray[instNo].title;
                var m = instancesArray[instNo].module;
                html += nextLine(instNo,
                                 '<a href="/ZAutomation/api/v1/instances/'+instNo+'">'+instNo+'</a>',
                                 '<a href="/smarthome/#/module/put/'+instNo+'">'+t+'</a>',
                                 '<a href="/ZAutomation/api/v1/modules/'+m+'">'+m+'</a>',
                                 instancesArray[instNo].active,
                                 instancesArray[instNo].logging,
                                 instancesArray[instNo].failed
                                );
                countInstNo += 1;
            }
        }); //instNo

        html += '</tbody>';
        html += '<tfoot>';
        html += '<tr>';
        html += '<th id="instance">'+ch_utils.buildMessage(ix_selectTexts+4,countInstNo)+' </th>';
        html += '<th id="title"></th>';
        html += '<th id="module"></th>';
        html += '<th id="active"></th>';
        html += '<th id="logging"></th>';
        html += '<th id="failed"></th>';
        html += '</tr>';
        html += '</tfoot>';
        html += '</table>';
        return html;
    } //buildHTML
}); //(document).ready

function printHTML(dataBuffer, messNo) {
    ch_utils.buttonVisible('json-renderer', true);
    ch_utils.displayMessage(messNo);
    document.getElementById('json-renderer').innerHTML = dataBuffer;
    var el = document.getElementById('indextable');
    sorttable.makeSortable(el);
    scrollUp(true);
} //printHTML

function scrollUp(flag) {
    if (flag) { document.getElementById('json-renderer').scrollTop = 0; }
} //scrollUp
