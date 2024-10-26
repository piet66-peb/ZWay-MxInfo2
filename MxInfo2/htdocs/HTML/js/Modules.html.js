//h-------------------------------------------------------------------------------
//h
//h Name:         Modules.html.js
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
//h Version:      V1.1.0 2024-08-03/peb
//v History:      V1.1.0 2024-08-03/peb first version
//h Copyright:    (C) piet66 2024
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals sorttable, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='Modules.html.js';
var VERSION='V1.1.0';
var WRITTEN='2024-08-03/peb';

//------------------
//b Data Definitions
//------------------
var ixButtonTextBase = 8;
var ix_selectTexts = 8;
var messageFormats = [
    //message texts (0+...):
    {//0
        de: "Module",
        en: "Modules"
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
        de: 'Module werden eingelesen...',
        en: 'Reading modules...'
    },
    {//4
        de: 'Daten werden verarbeitet...',
        en: 'Dataprocessing...'
    },
    {//5
        de: '<b>Module:</b>',
        en: '<b>Modules:</b>'
    },
    {//6
        de: 'Filter...',
        en: 'Filter...',
    },

    {//7
        de: '7 nou used',
        en: '7 noot used',
    },

    //button texts (8+...):
    //select texts (8+...):
    {
        de: 'Version',
        en: 'Version'
    },
    {
        de: 'Id',
        en: 'Id'
    },
    {
        de: 'Modulname',
        en: 'Module Name'
    },
    {
        de: 'Titel',
        en: 'Title'
    },
    {
        de: 'Anzahl: {0}',
        en: 'Number: {0}'
    },
    {
        de: 'Instan<br>zen',
        en: 'Instan<br>ces'
    },
    {
        de: 'Aktiv',
        en: 'Activ'
    },
    {
        de: 'Ungenutzte Module anzeigen: ',
        en: 'Show unused modules: '
    },
];
var modulesArray;

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
    ch_utils.buttonText('showUnusedText', 7);

    ch_utils.requireAdmin(readModules, BasicAuth);

    var filterInput = document.getElementById("myInput");
    filterInput.value = '';
    filterInput.placeholder = ch_utils.buildMessage(6);
    filterInput.focus();

    function readModules() {
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/modules';
        ch_utils.ajax_get(url, success);
        function success (data) {
            modulesArray = processModules(data.data);
            readInstances();
        }
    } //readModules

    function readInstances() {
        ch_utils.displayMessage(3);
        var url = '/ZAutomation/api/v1/instances';
        ch_utils.ajax_get(url, success);
        function success (data) {
            processInstances(data.data);
            display();

        }
    } //readInstances

    function toBoolean(value) {
        value = value === 'true' ? true : value;
        value = value === 'false' ? false : value;
        return value;
    } //toBoolean

    function processModules(modules) {
        ch_utils.displayMessage(4);

        var modulesArray = {};
        modules.forEach(function(mod, ix) {
            //store module info
            var item = {id: mod.id,
                        moduleName: mod.moduleName,
                        title: mod.defaults.title,
                        version: mod.version,
                        instances: 0,
                        active: 0
                       };
            modulesArray[mod.id] = item;
        });

        return modulesArray;
    } //processModules

    function processInstances(instances) {
        ch_utils.displayMessage(4);

        instances.forEach(function(inst, ix) {
            //store instance info
            var m = inst.moduleId;
            modulesArray[m].instances = modulesArray[m].instances + 1;
            var a = toBoolean(inst.active);
            if (a === true) {
                modulesArray[m].active = modulesArray[m].active + 1;
            }
        });
    } //processInstances
}); //(document).ready

    function buildHTML(modulesArray) {
        var countModules = 0;

        function nextLine(col1, col2, col3, col4, col5, col6) {
            var html = '';
            html += '<tr>';
            html += '<td headers="id" align=left>'+col1+'</td>';
            html += '<td headers="moduleName" align=left>'+col2+'</td>';
            html += '<td headers="version" align=center>'+col4+'</td>';
            html += '<td headers="title" align=left>'+col3+'</td>';
            html += '<td headers="instances" align=center>'+col5+'</td>';
            html += '<td headers="active" align=center>'+col6+'</td>';
            html += '</tr>\n';
            return html;
        } //nextLine

        var html = '';
        html +=  '<table id="indextable" class="sortable">';
        html += '<thead><tr>';
        html += '<th id="id"> '+ch_utils.buildMessage(ix_selectTexts+1)+' </th>';
        html += '<th id="moduleName"> '+ch_utils.buildMessage(ix_selectTexts+2)+' </th>';
        html += '<th id="version"> '+ch_utils.buildMessage(ix_selectTexts)+' </th>';
        html += '<th id="title"> '+ch_utils.buildMessage(ix_selectTexts+3)+' </th>';
        html += '<th id="instances"> '+ch_utils.buildMessage(ix_selectTexts+5)+' </th>';
        html += '<th id="active"> '+ch_utils.buildMessage(ix_selectTexts+6)+' </th>';
        html += '</tr></thead>';
        html += '<tbody>\n';

        //alert(JSON.stringify(modulesArray));
        var el = document.getElementById("showUnused");
        Object.keys(modulesArray).forEach(function(moduleId) {
            var id = modulesArray[moduleId].id;
            var m = modulesArray[moduleId].moduleName;
            var t = modulesArray[moduleId].title;
            var v = modulesArray[moduleId].version;
            var i = modulesArray[moduleId].instances;
            var a = modulesArray[moduleId].active;
            if (el.checked || i > 0) {
                html += nextLine('<a href="/smarthome/#/apps/local/'+id+'" target="_blank">'+id+'</a>',
                                '<a href="/ZAutomation/api/v1/modules/'+m+'" target="_blank">'+m+'</a>',
                                t,
                                v,
                                (i === 0 ? '' : i),
                                (a === 0 ? '' : a)
                                );
                countModules += 1;
            }
        }); //modulesArray

        html += '</tbody>';
        html += '<tfoot>';
        html += '<tr>';
        html += '<th id="id">'+ch_utils.buildMessage(ix_selectTexts+4,countModules)+' </th>';
        html += '<th id="moduleName"></th>';
        html += '<th id="version"></th>';
        html += '<th id="title"></th>';
        html += '<th id="instances"></th>';
        html += '<th id="active"></th>';
        html += '</tr>';
        html += '</tfoot>';
        html += '</table>';

        return html;
    } //buildHTML

    function display() {
        var html = buildHTML(modulesArray);
        ch_utils.buttonVisible('json-renderer', true);
        printHTML(html, 5);
    } //display

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
