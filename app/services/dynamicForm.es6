'use strict';

import { range, seq, compose, map, filter } from 'transducers.js';

let instance = null;
export default class DynamicForm {

  constructor (server_url) {
    if (instance) {
      throw "SFData() only allow to construct once";
    }
    this._host = server_url;
    this._formMeta = [];
    instance = this;
  }

  static get instance() {
    if (!instance) throw "DynamicForm() need to construct first";
    return instance;
  }

  _callServer(path, mode = 'GET') {
    var promise = new Promise( (resolve, reject) => {
       // Instantiates the XMLHttpRequest
       var client = new XMLHttpRequest();
       client.open(mode, this._host + '/dform/' + path);
       client.setRequestHeader ("Authorization", "OAuth " + "Junk");
       client.send();
       client.onload = function () {
         if (this.status == 200) {
           // Performs the function "resolve" when this.status is equal to 200
           //console.log ('got records : ' + this.response);
           resolve(JSON.parse(this.response));
         } else {
           // Performs the function "reject" when this.status is different than 200
           reject("Response Error:" + this.statusText);
         }
       };
       client.onerror = function (e) {
         reject("Network Error: " + this.statusText);
       };
     });
     return promise;
  }

  loadMeta() {
    return this._callServer('formdata').then(fmeta => this._formMeta = fmeta);
  }
  getForm (fid) {
    this._formMeta.length > 0 ||   console.log( "DynamicForm.getForm : FormData Not Loaded");
    if (!fid)
      return this._formMeta;
    else
      return this._formMeta.find(f => f._id === fid);
  }

  query(req) {
    return this._callServer('db/' + req.form + (req.q && ("?q=" + JSON.stringify(req.q)) || '') );
  }
  save(req) {
    return _callServer('db/' + req.form + (req.parent && "?"+$.param(req.parent) || ''), 'POST');
  }
  delete(req) {
    return this._callServer('db/' + req.form + '/' + req.id + (req.parent && "?"+$.param(req.parent) || ''), 'DELETE');
  }

}