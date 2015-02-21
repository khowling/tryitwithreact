/**
 * Created by keith on 11/02/15.
 */
/**
 * Created by keith on 11/02/15.
 *
 * UserStore : domain containing logic and data models for managing the user session
 * 1. Only the store can update its data
 * 2. Only your stores are allowed to register dispatcher callbacks
 * 3. Your Store Emits a "Change" Event when the data is changed
 * 4. Your View Responds to the store "Change" Event (in componentDidMount)
 */

var AppDispatcher = require('../bootstrap');
const xhr = require('../lib/xhr');
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;

/*    http://nodejs.org/api/events.html */
var EventEmitter = require('events').EventEmitter;
/* ES6 Object.assign() ponyfill */
var assign = require('object-assign');


var CHANGE_EVENT = 'change';
var _formdata = null;

var getFormMeta = () => _formdata;

function loadMeta (cb) {
    let xhr_opts = {
        url: '/dform/formdata',
        headers: {  'Authorization': 'OAuth ' + 'bob'  }
    }

    let ch = xhr(xhr_opts);

    csp.takeAsync (ch, function(result) {
      _formdata = result.json;
      cb();
    });
}

/*
 * Assigns enumerable own properties of "EventEmitter.prototype" & "{...}" objects to the target object "{}"
 * and returns the target object.
 * EventEmitter properties include:
 *  on/addListener(event, listener) # Adds a listener to the end of the listeners array for the specified event
 *  once(event, listener)           # Adds a one time listener for the event.
 *  removeListener(event, listener)
 *  emit(event[, arg1][, arg2][, ...])  # Execute each of the listeners in order with the supplied arguments
 *  */
var MetaStore = assign({}, EventEmitter.prototype, {

     getMeta: function() {
       if (getFormMeta()) {
         return getFormMeta();
       } else {
         loadMeta (() => this.emit(CHANGE_EVENT));
         return [];
       }
    }
});


module.exports = MetaStore;
