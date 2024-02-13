/*** MxInfo2 V1.0.4 2022-08-05 Z-Way HA module *********************************/

//h-------------------------------------------------------------------------------
//h
//h Name:         index.js
//h Type:         Javascript code for Z-Way module MxInfo2
//h Purpose:      dummy module, does nothing
//h Project:      Z-Way HA
//h Usage:
//h Remark:
//h Result:
//h Examples:
//h Outline:
//h Resources:    AutomationModule
//h Issues:
//h Authors:      peb piet66
//h Version:      V1.0.4 2022-08-05/peb
//v History:      V1.0.0 2022-07-07/peb first version
//h Copyright:    (C) piet66 2022
//h License:      http://opensource.org/licenses/MIT
//h
//h-------------------------------------------------------------------------------

/*jshint esversion: 5 */
/*globals inherits, _module: true, AutomationModule, system */
'use strict';

//h-------------------------------------------------------------------------------
//h
//h Name:         MxInfo2
//h Purpose:      create module subclass.
//h
//h-------------------------------------------------------------------------------
function MxInfo2(id, controller) {
    // Call superconstructor first (AutomationModule)
    MxInfo2.super_.call(this, id, controller);

    this.MODULE='index.js';
    this.VERSION='V1.0.4';
    this.WRITTEN='2022-08-05/peb';
}
inherits(MxInfo2, AutomationModule);
_module = MxInfo2;

//h-------------------------------------------------------------------------------
//h
//h Name:         init
//h Purpose:      module initialization.
//h
//h-------------------------------------------------------------------------------
MxInfo2.prototype.init = function(config) {
    MxInfo2.super_.prototype.init.call(this, config);
    var self = this;

    //b nothing to do
    //---------------
}; //init

//h-------------------------------------------------------------------------------
//h
//h Name:         stop
//h Purpose:      module stop.
//h
//h-------------------------------------------------------------------------------
MxInfo2.prototype.stop = function() {
    var self = this;

    //b nothing to do
    //---------------

    MxInfo2.super_.prototype.stop.call(this);
}; //stop

