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

var MetaConstants = require('../constants/MetaConstants');
var CHANGE_EVENT = 'change';
var _formdata = null;

var getFormMeta = () => _formdata;

function loadMeta (cb) {
    let xhr_opts = {
        url: '/dform/formdata',
        headers: {  'Authorization': 'OAuth ' + 'bob'  }
    }

    let ch = xhr(xhr_opts);
    AppDispatcher.dispatch({actionType: MetaConstants.META_LOADING});
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

// Register callback function with Dispatcher
AppDispatcher.register(function(action) {
    var text;

    switch(action.actionType) {
        case MetaConstants.TODO_CREATE:
            text = action.text.trim();
            if (text !== '') {
                create(text);
            }
            MetaStore.emitChange();
            break;

        case MetaConstants.TODO_TOGGLE_COMPLETE_ALL:
            if (TodoStore.areAllComplete()) {
                updateAll({complete: false});
            } else {
                updateAll({complete: true});
            }
            MetaStore.emitChange();
            break;

        case MetaConstants.TODO_UNDO_COMPLETE:
            update(action.id, {complete: false});
            MetaStore.emitChange();
            break;

        case MetaConstants.TODO_COMPLETE:
            update(action.id, {complete: true});
            MetaStore.emitChange();
            break;

        case MetaConstants.TODO_UPDATE_TEXT:
            text = action.text.trim();
            if (text !== '') {
                update(action.id, {text: text});
            }
            MetaStore.emitChange();
            break;

        case MetaConstants.TODO_DESTROY:
            destroy(action.id);
            MetaStore.emitChange();
            break;

        case MetaConstants.TODO_DESTROY_COMPLETED:
            destroyCompleted();
            MetaStore.emitChange();
            break;

        default:
        // no op
    }
});

module.exports = MetaStore;
