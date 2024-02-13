//h-------------------------------------------------------------------------------
//h
//h Name:         Instances.html.js
//h Type:         Javascript module
//h Purpose:      Display instances list.
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.1.0 2023-10-18/peb
//v History:      V1.0.0 2022-04-16/peb first version
//v               V1.1.0 2023-10-16/peb {+]active changeable
//h Copyright:    (C) piet66 2020
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals sorttable, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Instances.html.js';
var VERSION='V1.1.0';
var WRITTEN='2023-10-18/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 8;
var ix_selectTexts = 8;
var messageFormats = [
    //message texts (0+...):
    {//0
        de: 'Modulinstanzen',
        en: 'Module-Instances'
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
        de: '<b>Modulinstanzen:</b>',
        en: '<b>Module-Instances:</b>'
    },
    {//6
        de: 'Filter...',
        en: 'Filter...',
    },

    {//7
        de: 'Instanz {0} auf active={1} gesetzt',
        en: 'instance {0} set to active={1}',
    },

    //button texts (8+...):
    //select texts (8+...):
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
    {
        de: 'unbenutzte Nummern anzeigen: ',
        en: 'show unused numbers: '
    },
];
var instancesArray;

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
    ch_utils.buttonText('showEmptyLinesText', 5);

    ch_utils.requireAdmin(readInstances, BasicAuth);

    var filterInput = document.getElementById("myInput");
    filterInput.value = '';
    filterInput.placeholder = ch_utils.buildMessage(6);
    filterInput.focus();

    function readInstances() {
        //read instances
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/instances';
        ch_utils.ajax_get(url, success);
        function success (data) {
            instancesArray = processInstances(data.data);
            var html = buildHTML(instancesArray);
            ch_utils.buttonVisible('json-renderer', true);
            printHTML(html, 5);

            //define checkbox event:
            var checkboxList = document.querySelectorAll('[type="checkbox"]');
            //console.log(checkboxList);
            /*jshint loopfunc:true */
            for (var i = 0; i < checkboxList.length; i++) {
                checkboxList[i].addEventListener('change', function(event) {
                    //console.log(event.target);
                    var id = event.target.id.split('_');
                    var instNo = id[1];
                    var checked = event.target.checked;
                    changeActive(instNo, checked);
                });
            }
            /*jshint loopfunc:false */
        }
    } //readInstances

    function changeActive(instNo, checked) {
        instancesArray[instNo].active = checked;

        //get instance data
        var url = '/ZAutomation/api/v1/instances/'+instNo;
        ch_utils.ajax_get(url, success_get);

        function success_get (response) {
            var data = response.data;
            var instNo = data.id;
            var activeNew = instancesArray[instNo].active;
            data.active = activeNew;
            var url = '/ZAutomation/api/v1/instances/'+instNo;
            ch_utils.ajax_put(url, JSON.stringify(data), success_put);
        }

        function success_put(response) {
            var instNo = response.data.id;
            alert(ch_utils.buildMessage(7, instNo, response.data.active));
        }
    } //changeActive

    function toBoolean(value) {
        value = value === 'true' ? true : value;
        value = value === 'false' ? false : value;
        return value;
    } //toBoolean

    function processInstances(instances) {
        ch_utils.displayMessage(4);

        var instancesArray = {};
        instances.forEach(function(inst, ix) {
            //store instance info
            var item = {id: inst.id,
                        module: inst.moduleId,
                        title: inst.title,
                        active: toBoolean(inst.active),
                       };
            instancesArray[inst.id] = item;
        });

        return instancesArray;
    } //processInstances

    function buildHTML(instancesArray) {
        var lastInstNo, nextInstNo;
        var countInstNo = 0;

        function nextLine(instNo, col0, col1, col2, col3) {
            var html = '';
            html += '<tr>';
            html += '<td headers="instance" align=center>'+col0+'</td>';
            html += '<td headers="title" align=left>'+col1+'</td>';
            html += '<td headers="module" align=center>'+col2+'</td>';
            html += '<td headers="active" align=center>';
            switch (col3) {
                case true:
                    html += '<input type="checkbox" id="active_'+instNo+'" checked>';
                    break;
                case false:
                    html += '<input type="checkbox" id="active_'+instNo+'">';
                    break;
                default:
                    break;
            }
            html += '</td></tr>\n';
            return html;
        } //nextLine

        var html = '';
        html +=  '<table id="indextable" class="sortable">';
        html += '<thead><tr>';
        html += '<th id="instance"> '+ch_utils.buildMessage(ix_selectTexts+0)+' </th>';
        html += '<th id="title"> '+ch_utils.buildMessage(ix_selectTexts+1)+' </th>';
        html += '<th id="module"> '+ch_utils.buildMessage(ix_selectTexts+2)+' </th>';
        html += '<th id="active" class="sorttable_nosort"> '+ch_utils.buildMessage(ix_selectTexts+3)+' </th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        var el = document.getElementById("showEmptyLines");
        Object.keys(instancesArray).forEach(function(instNo, ix) {
            if (instNo) {
                if (el.checked) {
                    if (lastInstNo && instNo*1 === nextInstNo+1) {
                        html += nextLine(instNo, nextInstNo, '', '', '');
                        lastInstNo = undefined;
                    } else
                    if (lastInstNo && instNo*1 > nextInstNo+1) {
                        html += nextLine(instNo, nextInstNo+'...', '', '', '');
                        lastInstNo = undefined;
                    }
                }
                var t = instancesArray[instNo].title;
                var m = instancesArray[instNo].module;
                html += nextLine(instNo,
                                 '<a href="/ZAutomation/api/v1/instances/'+instNo+'">'+instNo+'</a>',
                                 '<a href="/smarthome/#/module/put/'+instNo+'">'+t+'</a>',
                                 '<a href="/ZAutomation/api/v1/modules/'+m+'">'+m+'</a>',
                                 instancesArray[instNo].active
                                );
                lastInstNo = instNo;
                nextInstNo = lastInstNo*1 + 1;
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
