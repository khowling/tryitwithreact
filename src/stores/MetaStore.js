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

const xhr = require('../lib/xhr');
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;


var _formdata = null;
var requestQueue = {};

var getFormMeta = () => _formdata;
var setFormMeta = (x) => _formdata = x;

function _getData (req, url) {
    let xhr_opts = {
        url: url,
        headers: {  'Authorization': 'OAuth ' + 'bob'  }
    }

    if (req.body) {
      xhr_opts.method = 'POST';
      xhr_opts.body = req.body;
    }

    let ch = xhr(xhr_opts);

    csp.takeAsync (ch, function(result) {
      req.data = result.json;
      req.finished(req);
    });
}



var MetaStore =  {
  initMeta: function (cb) {
    _getData ({finished: function(req) {
      _formdata = req.data;
      cb(_formdata);
    }}, '/dform/formdata');
  },
  getForm: function (fid) {
    _formdata.length > 0 ||  console.log ("MetaStore.getForm : FormData Not Loaded");
    return _formdata.filter(f => f._id === fid)[0];
  },
  dataReq: function(req) {
    if (req.opt === 'dform') {

      // to join 'subq' with 'data' at data.__primary
      var old_finished = req.finished;
      var new_finished = function joinsubj(ret) {
        let joineddata = ret.data.documents,
            formdef = MetaStore.getForm (req.form);


        let addPrimaryToLookup = function (formdef, val) {
          for (let recs of val) {
            for (let fld of formdef.fields) {
              if (fld.type === 'lookup') {
                recs[fld.name] = {id: recs[fld.name], primary: ret.data.subq[recs[fld.name]]};
              }
              if (fld.type === 'childform') {
                addPrimaryToLookup(MetaStore.getForm (fld.child_form), recs[fld.name]);
              }
            }
          }
        }

        addPrimaryToLookup (formdef, joineddata);

        old_finished (Object.assign(ret, {data: joineddata}));
      };

      req.finished = new_finished;
      _getData (req, '/dform/db/' + req.form + (req.q && ('?q=' + JSON.stringify(req.q)) || '') );
    }
  },
  save: function(req) {
    _getData (req, '/dform/db/' + req.form);
  }
};


module.exports = MetaStore;
