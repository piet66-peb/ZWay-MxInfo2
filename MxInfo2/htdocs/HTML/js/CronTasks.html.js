
//h-------------------------------------------------------------------------------
//h
//h Name:         CronTasks.html.js
//h Type:         Javascript module
//h Purpose:      Display cron tasks for ZWay module MxInfo2
//h Project:      ZWay
//h Usage:
//h Result:
//h Examples:
//h Outline:
//h Resources:
//h Platforms:    independent
//h Authors:      peb piet66
//h Version:      V1.5 2022-07-16/peb
//v History:      V1.0 2019-02-08/peb first version
//v               V1.2 2019-08-29/peb [+]accept several times per task
//v               V1.5 2022-04-24/peb [+]ZWave: ZWaveTimeUpdater.poll
//h Copyright:    (C) piet66 2019
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals $, cytoscape, ch_utils */
'use strict';

//-----------
//b Constants
//-----------
var MODULE='CronTasks.html.js';
var VERSION='V1.5';
var WRITTEN='2022-07-16/peb';

//------------------
//b Data Definitions
//------------------
var readTestData = false;

var razberryURL = '';
var instInput;
var instCounter = 0;
var taskCounter = 0;
var cronModule = {};
var cronTasks = [];
var noCreatorTasks = [];
var nextFireArray = [];
var nextFireHTML = '';
var nextFireInstArray = [];
var nextFireInstHTML = '';
var htmlSep = ';';
var stepsSep = '|';
var instArray = [];
var instanceTasks = [];
var instanceIdselected = -1;

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
        de: 'not used',
        en: 'not used'
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
        de: 'Cron Modul',
        en: 'Cron module'
    },
    {
        de: 'Alle Cron Tasks ({0}), nach creator id sortiert',
        en: 'All cron tasks ({0}), sorted by creator id'
    },
    {
        de: 'Alle Cron Tasks ({0}) der Instanz',
        en: 'All cron tasks ({0}) of instance'
    },
    {
        de: 'Bitte eine Instanz auswählen!',
        en: 'Please select an instance!'
    },
    {
        de: 'Keine Instanz zu {0} gefunden, creatorId wird auf 0 gesetzt',
        en: 'No instance found for {0}, creatorId set to 0'
    },
    {
        de: 'Cron Tasks ({0}) ohne nach creator id, auf 0 gesetzt',
        en: 'cron tasks ({0}) without creator id, set to 0'
    },
    {
        de: 'Nächste Anstöße per Instanz und Task, sortiert nach Zeit',
        en: 'Next triggers per instance and task, ordered by time'
    },
    {
        de: 'Nächste Anstöße per Instanz und Task, sortiert nach Instanz',
        en: 'Next triggers per instance and task, ordered by instance'
    },
    {
        de: 'not used',
        en: 'not used'
    },
    {
        de: 'not used',
        en: 'not used'
    },
   {
        de: 'not used',
        en: 'not used'
    },
    {
        de: 'not used',
        en: 'not used'
    },
    {
        de: 'not used',
        en: 'not used'
    },
   {
        de: 'Z-Way Cron Tasks',
        en: 'Z-Way Cron Tasks'
    },

    //button texts (20+...):
    {
        de: 'Cron Modul',
        en: 'Cron Module'
    },
    {
        de: 'Cron Tasks',
        en: 'Cron Tasks'
    },
    {
        de: 'Alle Tasks der Instanz',
        en: 'All Tasks of the Instance'
    },
    {
        de: 'Tasks ohne Creator',
        en: 'Tasks without Creator'
    },
    {
        de: 'Nächste Anstöße',
        en: 'Next Triggers'
    },
    {
        de: 'Nächste Anstöße per Instanz',
        en: 'Next triggers per instance'
    },
    {
        de: 'Task Name',
        en: 'Task Name'
    },
    {
        de: 'Nächster Anstoß',
        en: 'Next Trigger'
    },
    {
        de: 'Instanz',
        en: 'Instance'
    },
    {
        de: 'Schrittweite<br>Mi,Std,WT,Tag,Mo',
        en: 'Steps<br>Mi,Hr,Wd,Day,Mo'
    },

    //button texts (30+...):
    {
        de: 'Instanz',
        en: 'Instance'
    },
    {
        de: 'Keine Auswahl',
        en: 'Nothing selected'
    },
    {
        de: 'not used',
        en: 'not used'
    }
];

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

    function langTexts() {
        document.title = ch_utils.buildMessage(19);
        ch_utils.buttonText('cron_module', 0);
        ch_utils.buttonText('cron_tasks', 1);
        ch_utils.buttonText('instance_tasks', 2);
        ch_utils.buttonText('no_creator_tasks', 3);
        ch_utils.buttonText('next_fire', 4);
        ch_utils.buttonText('next_fire_per_inst', 5);
        ch_utils.buttonText('label2', ix_selectTexts+0-ixButtonTextBase);
    }

    function startDatacollection() {
        //start with getting instance data
        getInstanceData();

        function buildSelectBoxes () {
            var elId;
            var i;
            var option;

            //instances
            var idLast = '';
            elId = document.getElementById('selInstance');
            i = 0;
            option = new Option(messageFormats[ix_selectTexts+1][lang], -1);
            elId.options[i++] = option;
            instArray.forEach(function(entry) {
                if (entry.id !== idLast) {
                    idLast = entry.id;
                    option = new Option(entry.id+': '+entry.title, entry.id);
                    elId.options[i++] = option;
                }
            });
        } //buildSelectBoxes

        function getInstanceData() {
            var url = razberryURL + '/ZAutomation/api/v1/instances';
            if (readTestData) {
                url = 'testData/instances.json';
                alert('Reading test data from '+url);
            }
            ch_utils.displayMessage(3);
            ch_utils.ajax_get(url, success);
            function success (data) {
                instInput = data;

                //get cron module
                instInput.data.some(function(instance) {
                    ++instCounter;
                    if (instance.moduleId === 'Cron') {
                        cronModule = instance;
                        return true;
                    }
                });

                //get cron tasks
                cronTasks = getTasks(cronModule.params.schedules);
                printHTML(nextFireHTML, 12);
                buildSelectBoxes();
                exploitData();
            }
        } //getInstanceData

        function getTasks(schedules) {
            var taskArray = [];

            Object.keys(schedules).forEach(function(schedule, ix) {
                var times = [];
                var creator;
                var switches = [];
                var steps = [];
                schedules[schedule].forEach(function(schedData) {
                    schedData.forEach(function(schedData2) {
                        if (schedData2 !== null && typeof schedData2 === 'object') {
                            if (schedData2.hasOwnProperty('time')) {
                                var timeObj = schedData2.time;
                                times.push(timeObj);
                                var stepsString, s;
                                if (timeObj.minute === null) {
                                    s = 1;
                                } else {
                                    s = (timeObj.minute[2] || '');
                                    if (timeObj.minute[0] === timeObj.minute[1]) {
                                        s = '';
                                    }
                                }
                                stepsString = s;
                                if (timeObj.hour === null) {
                                    s = 1;
                                } else {
                                    s = (timeObj.hour[2] || '');
                                    if (timeObj.hour[0] === timeObj.hour[1]) {
                                        s = '';
                                    }
                                }
                                stepsString += '-'+s;
                                if (timeObj.weekDay === null) {
                                    s = 1;
                                } else {
                                    s = (timeObj.weekDay[2] || '');
                                    if (timeObj.weekDay[0] === timeObj.weekDay[1]) {
                                        s = '';
                                    }
                                }
                                stepsString += '-'+s;
                                if (timeObj.day === null) {
                                    s = 1;
                                } else {
                                    s = (timeObj.day[2] || '');
                                    if (timeObj.day[0] === timeObj.day[1]) {
                                        s = '';
                                    }
                                }
                                stepsString += '-'+s;
                                if (timeObj.month === null) {
                                    s = 1;
                                } else {
                                    s = (timeObj.month[2] || '');
                                    if (timeObj.month[0] === timeObj.month[1]) {
                                        s = '';
                                    }
                                }
                                stepsString += '-'+s;

                                //steps.push(stepsString.replace(/-*$/, ''));
                                steps.push(stepsString);
                            }
                        }
                        if (schedData2 !== null && typeof schedData2 === 'object') {
                            if (schedData2.moduleId) {
                                creator = schedData2;
                            }
                        }
                        if (schedData2 !== null && typeof schedData2 === 'object') {
                            if (schedData2.minute) {
                                switches.push(schedData2);
                            }
                        }
                    });
                }); //schedules[schedule]

                if (creator === undefined) {
                    //number at end = instance id
                    var instanceId = schedule.replace(/^.*[^0-9]/, '');
                    //first part = module id
                    var moduleId = schedule.replace(/\..*$/, '');
                    if (schedule === 'checkForfailedNode.poll' ||   //.3..7
                        schedule === 'deadDetectionCheckBatteryDevice.poll' || //2.3.8
                        schedule === 'ZWaveTimeUpdater.poll' || //3.2.2
                        schedule === 'zwayCertXFCheck.poll') {
                        moduleId = 'ZWave';
                    }
                    creator = {
                        id : instanceId === '' ? null : instanceId,
                        title : '?',
                        moduleId : moduleId,
                        instanceCreated : null,
                        //active : null
                    };
                    creator = fillCreator(creator);
                    if (creator.instanceCreated === null) {
                        //ch_utils.alertMessage(10, schedule);
                        creator.id = 0;
                        noCreatorTasks.push(schedule);
                    }
                } else {
                    if (creator.hasOwnProperty('cronCreated')) {
                        creator.cronCreated = creator.cronCreated+' '+ch_utils.userTime(creator.cronCreated);
                    }
                }

                //console.log(schedule+': '+creator.title);
                var nextFire = timeString(switches, steps);

                var schedObj = {
                        ix : taskCounter,
                        id : schedule,
                        creator : creator,
                        time : times,
                        nextFire: nextFire
                };
                instArray.push(
                    { id: creator.id,
                      title:creator.title
                    });

                taskArray.push(schedObj);
                ++taskCounter;

                nextFireArray.push(nextFire+htmlSep+creator.title+htmlSep+schedule);
                nextFireInstArray.push(creator.title+htmlSep+nextFire+htmlSep+schedule);
            });

            //sort by creator id
            instArray.sort(function(a, b){return a.id-b.id;});
            taskArray.sort(function(a, b) {
                if (a.creator.id < b.creator.id) {
                    return -1;
                }
                if (a.creator.id > b.creator.id) {
                    return 1;
                }
                return 0;
            });

            buildNextTriggers();

            return taskArray;
        } //getTasks

        function buildNextTriggers() {
            var instT = messageFormats[ixButtonTextBase + 8][lang];
            var taskT = messageFormats[ixButtonTextBase + 6][lang];
            var nextT = messageFormats[ixButtonTextBase + 7][lang];
            var stepsT = messageFormats[ixButtonTextBase + 9][lang];
            var instLast = '';
            var nextLast = '';
            var inst, task, next, s, steps, nextArr, stepsArr, nextStepsArr, i, len;

            //next fire
            nextFireHTML =  '<table><tbody><tr>';
            nextFireHTML += '<th id="next">'+nextT+'</th>';
            nextFireHTML += '<th id="steps">'+stepsT+'</th>';
            nextFireHTML += '<th id="inst">'+instT+'</th>';
            nextFireHTML += '<th id="task">'+taskT+'</th>';
            nextFireHTML += '</tr>';

            nextFireArray.sort();
            nextFireArray.forEach(function(entry, ix) {
                s = entry.split(htmlSep);
                nextStepsArr = s[0].split(",").sort();
                len = nextStepsArr.length;
                nextArr = [];
                stepsArr = [];
                for (i=0; i< len; i++) {
                    nextArr.push(nextStepsArr[i].replace(/\|.*$/, ''));
                    stepsArr.push(nextStepsArr[i].replace(/^.*\|/, ''));
                }
                next  = nextArr.join('<br>');
                steps = stepsArr.join('<br>').replace(/-/g, ',');
                inst = s[1];
                task = s[2];
                nextFireHTML += '<tr>';
                if (nextLast !== next) {
                    nextFireHTML += '<td headers="next" align=center>'+next+'</td>';
                } else {
                    nextFireHTML += '<td headers="next"></td>';
                }
                nextFireHTML += '<td headers="steps"  align=center>'+steps+'</td>';
                if (instLast !== inst) {
                    nextFireHTML += '<td headers="inst">'+inst+'</td>';
                } else {
                    nextFireHTML += '<td headers="inst"></td>';
                }
                nextFireHTML += '<td headers="task">'+task+'</td>';
                nextFireHTML += '</tr>';
                instLast = inst;
                nextLast = next;
            });
            nextFireHTML += '</tbody></table>';

            //next fire per inst
            nextFireInstHTML =  '<table><tbody><tr>';
            nextFireInstHTML += '<th id="inst">'+instT+'</th>';
            nextFireInstHTML += '<th id="next">'+nextT+'</th>';
            nextFireInstHTML += '<th id="steps">'+stepsT+'</th>';
            nextFireInstHTML += '<th id="task">'+taskT+'</th>';
            nextFireInstHTML += '</tr>';

            nextFireInstArray.sort();
            nextFireInstArray.forEach(function(entry, ix) {
                s = entry.split(htmlSep);
                inst = s[0];
                nextStepsArr = s[1].split(",").sort();
                len = nextStepsArr.length;
                nextArr = [];
                stepsArr = [];
                for (i=0; i< len; i++) {
                    nextArr.push(nextStepsArr[i].replace(/\|.*$/, ''));
                    stepsArr.push(nextStepsArr[i].replace(/^.*\|/, ''));
                }
                next  = nextArr.join('<br>');
                steps = stepsArr.join('<br>').replace(/-/g, ',');
                task = s[2];
                nextFireInstHTML += '<tr>';
                if (instLast !== inst) {
                    nextFireInstHTML += '<td headers="inst">'+inst+'</td>';
                } else {
                    nextFireInstHTML += '<td headers="inst"></td>';
                }
                if (nextLast !== next) {
                    nextFireInstHTML += '<td headers="next" align=center>'+next+'</td>';
                } else {
                    nextFireInstHTML += '<td headers="next"></td>';
                }
                nextFireInstHTML += '<td headers="steps" align=center>'+steps+'</td>';
                nextFireInstHTML += '<td headers="task">'+task+'</td>';
                nextFireInstHTML += '</tr>';
                instLast = inst;
                nextLast = next;
            });
            nextFireInstHTML += '</tbody></table>';

        } //buildNextTriggers

        function timeString(switches, steps) {
            var nextRun, currSwitch, currTime, nextFire, i, len;
            function daysPerMonth(monat, jahr) {
                if(monat !== 2) {
                    if(monat === 9 ||
                       monat === 4 ||
                       monat === 6 ||
                       monat === 11) {
                        return 30;
                    } else {
                        return 31;
                    }
                } else {
                    return (jahr % 4) === "" && (jahr % 100) !=="" ? 29 : 28;
                }
            } //daysPerMonth

            function stripArray(arr,val) {
                nextRun = false;
                var pos;
                var found = arr.some(function(e, ix) {
                    pos = ix;
                    return e >= val;
                });
                if (found) {
                    return arr.slice(pos);
                } else {
                    nextRun = true;
                    return arr;
                }
            } //stripArray

            function pad(num, size) {
                if (!size) { size = 2;}
                var s = num+"";
                while (s.length < size) {s = "0" + s;}
                return s;
            } //pad

            function getWeekday(year, month, day)  {
                // formula of Georg Glaeser
                var d = day;
                if (!d) {d = 1;}
                var m = month;
                if (!m) {m = 1;}
                var y = year % 100;
                var c = year / 100;
                m -= 2;
                if (m <= 0) {
                    y -= 1;
                    m += 12;
                }
                var w = Math.floor((d + Math.ceil(2.6 * m - 0,2) + y + Math.floor(y/4) + Math.floor(c/4) - 2 * c) % 7);
                w = w < 0 ? w + 7 : w;
                w = w === 0 ? 7 : w;
                return w;
            } //getWeekday

            function addHour() {
                currTime.hour += 1;
                if (23 < currTime.hour) {
                    addDay();
                } else {
                    currTime.minute = 0;
                }
            } //addHours

            function addDay() {
                currTime.day += 1;
                var daysPM = daysPerMonth(currTime.month, currTime.year);
                if (daysPM < currTime.day) {
                    addMonth();
                } else {
                    currTime.hour = 0;
                    currTime.minute = 0;
                    currTime.weekDay += 1;
                    if (7 < currTime.weekDay) {
                        currTime.weekDay = 1;
                    }
                }
            } //addDays

            function addMonth() {
                currTime.month += 1;
                if (12 < currTime.month) {
                    addYear();
                } else {
                    currTime.day = 1;
                    currTime.hour = 0;
                    currTime.minute = 0;
                    //currTime.weekDay = getWeekday(currTime.year+'-'+currTime.month+'-01 00:00:00');
                    currTime.weekDay = getWeekday(currTime.year, currTime.month);
                }
            } //addMonth

            function addYear() {
                currTime.year += 1;
                currTime.month = 1;
                currTime.day = 1;
                currTime.hour = 0;
                currTime.minute = 0;
                //currTime.weekDay = getWeekday(currTime.year+'-01-01 00:00:00');
                currTime.weekDay = getWeekday(currTime.year);
            } //addYear

            var d = new Date();

            var currTimeStart = {
                minute:  d.getMinutes(),
                hour:    d.getHours(),
                day:     d.getDate(),
                month:   d.getMonth()+1,    //starting with 0
                year:    d.getFullYear(),
            };
            //currTimeStart.weekDay = getWeekday(d);
            currTimeStart.weekDay = getWeekday(currTimeStart.year, currTimeStart.month, currTimeStart.day);

            var nextFireArray = [];
            switches.forEach(function(switchObj, is) {
                currTime = JSON.parse(JSON.stringify(currTimeStart));

                while (true) {
                    //console.log('time: '+JSON.stringify(currTime));

                    //copy object, we don't want to destroy original
                    currSwitch = JSON.parse(JSON.stringify(switchObj));

                    //month, day, weekDay are starting with 0 !!!
                    len =  currSwitch.month.length;
                    for (i = 0; i < len; i++) {currSwitch.month[i] += 1;}
                    len =  currSwitch.day.length;
                    for (i = 0; i < len; i++) {currSwitch.day[i] += 1;}
                    if (currSwitch.weekDay[0] === 0) {
                        currSwitch.weekDay.shift();
                        currSwitch.weekDay.push(7);
                    }

                    //correct days per month
                    var daysInMonth = daysPerMonth(currTime.month, currTime.year);
                    var len = currSwitch.day.length;
                    for (i = len - 1; i >= 0; --i) {
                        if (currSwitch.day[i] > daysInMonth) {
                            currSwitch.day.pop();
                        } else {
                            break;
                        }
                    }

                    //remove, what's smaller than current date/time
                    //console.log('month '+currTime.month+' '+JSON.stringify(currSwitch.month));
                    currSwitch.month   = stripArray(currSwitch.month, currTime.month);
                    if (nextRun) {addYear(); continue;}
                    //console.log(JSON.stringify(currSwitch.month));

                    //console.log('day '+currTime.day+' '+JSON.stringify(currSwitch.day));
                    currSwitch.day     = stripArray(currSwitch.day, currTime.day);
                    if (nextRun) {addMonth(); continue;}
                    //console.log(JSON.stringify(currSwitch.day));

                    //console.log('weekDay '+currTime.weekDay+' '+JSON.stringify(currSwitch.weekDay));
                    currSwitch.weekDay = stripArray(currSwitch.weekDay, currTime.weekDay);
                    if (nextRun) {addDay(); continue;}
                    if (currSwitch.weekDay[0] !== currTime.weekDay) {addDay(); continue;}
                    //console.log(JSON.stringify(currSwitch.weekDay));

                    //console.log('hour '+currTime.hour+' '+JSON.stringify(currSwitch.hour));
                    currSwitch.hour    = stripArray(currSwitch.hour, currTime.hour);
                    if (nextRun) {addDay(); continue;}
                    //console.log(JSON.stringify(currSwitch.hour));

                    //console.log('minute '+currTime.minute+' '+JSON.stringify(currSwitch.minute));
                    currSwitch.minute  = stripArray(currSwitch.minute, currTime.minute);
                    if (nextRun) {addHour(); continue;}
                    //console.log(JSON.stringify(currSwitch.minute));

                    //take ix = 0
                    nextFire = currTime.year+'-'+pad(currSwitch.month[0])+'-'+pad(currSwitch.day[0])+' '+pad(currSwitch.hour[0])+':'+pad(currSwitch.minute[0]);
                    //console.log(nextFire);

                    nextFireArray.push(nextFire+stepsSep+steps[is]);
                    break;
                }
            }); //switches.forEach
            return nextFireArray;

        } //timeString

        function fillCreator(creator) {
            //get instance data
            //first try with instance id
            instInput.data.some(function(instance) {
                if (instance.id === creator.id * 1) {
                    creator.id = instance.id;
                    creator.title = instance.title;
                    creator.instanceCreated = instance.creationTime+' '+ch_utils.userTime(instance.creationTime);
                    //creator.active = instance.active === 'true' ? true : false;
                    creator.moduleId = instance.moduleId;
                    return true;
                }
            });
            //if not found try with moduleId
            if (creator.instanceCreated === null) {
                instInput.data.some(function(instance) {
                    if (instance.moduleId === creator.moduleId) {
                        creator.id = instance.id;
                        creator.title = instance.title;
                        creator.instanceCreated = instance.creationTime+' '+ch_utils.userTime(instance.creationTime);
                        //creator.active = instance.active === 'true' ? true : false;
                        creator.moduleId = instance.moduleId;
                        return true;
                    }
                });
            }
            //if not found try with lower case moduleId
            var moduleId_lower = creator.moduleId.toLowerCase();
            if (creator.instanceCreated === null) {
                instInput.data.some(function(instance) {
                    if (instance.moduleId.toLowerCase() === moduleId_lower) {
                        creator.id = instance.id;
                        creator.title = instance.title;
                        creator.instanceCreated = instance.creationTime+' '+ch_utils.userTime(instance.creationTime);
                        //creator.active = instance.active === 'true' ? true : false;
                        creator.moduleId = instance.moduleId;
                        return true;
                    }
                });
            }
            return creator;
        } //fillCreator

        function printJSON (objectJSON, text_id, counter) {
            //alert(JSON.stringify(objectJSON));
            if (!counter) {counter = '';}

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

        function printHTML(indexData, messNo, messAdd) {
            if (!jsEl) {
                $("body").append('<pre id="json-renderer"></pre>');
                jsEl = document.getElementById("json-renderer");
                jsVisible = true;
            } else {
                jsEl.style.display = "inherit";
                jsVisible = true;
            }

            ch_utils.displayMessage(messNo, messAdd);
            document.getElementById('json-renderer').innerHTML = indexData;
        } //printHTML

        function exploitData() {
            //display cron module
            //printJSON(cronModule, 6);

            //------------- functions -----------------------------------------------

            function buildInstanceTasks (instanceIdselected) {
                instanceTasks = [];
                cronTasks.forEach(function(entry) {
                    if (entry.creator.id === instanceIdselected) {
                        instanceTasks.push(entry);
                    }
                });

            } //buildInstanceTasks

            //------------- event listeners -----------------------------------------------

            document.getElementById('cron_module').addEventListener('click', function() {
                printJSON(cronModule, 6);
            });

            document.getElementById('cron_tasks').addEventListener('click', function() {
                printJSON(cronTasks, 7, taskCounter);
            });

            document.getElementById('no_creator_tasks').addEventListener('click', function() {
                printJSON(noCreatorTasks, 11, noCreatorTasks.length.toString());
            });

            document.getElementById('next_fire').addEventListener('click', function() {
                printHTML(nextFireHTML, 12);
            });

            document.getElementById('next_fire_per_inst').addEventListener('click', function() {
                printHTML(nextFireInstHTML, 13);
            });

            document.getElementById('selInstance').addEventListener('click', function() {
                instanceIdselected = this.value * 1;
                if (instanceIdselected === -1) {
                    ch_utils.displayMessage(9);
                    return;
                }
                buildInstanceTasks(instanceIdselected);
                printJSON(instanceTasks, 8, instanceTasks.length+'');
            }, true);

            document.getElementById('instance_tasks').addEventListener('click', function() {
                if (instanceIdselected === -1) {
                    ch_utils.displayMessage(9);
                    return;
                }
                buildInstanceTasks(instanceIdselected);
                printJSON(instanceTasks, 8, instanceTasks.length+'');
            });

        } //exploitData
    } //startDatacollection
}); //$(document).ready
