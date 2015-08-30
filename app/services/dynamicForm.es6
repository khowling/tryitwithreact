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

  get host() {
    return this._host;
  }

  static get instance() {
    if (!instance) throw "DynamicForm() need to construct first";
    return instance;
  }

  _callServer(path, mode = 'GET', body) {
    return new Promise( (resolve, reject) => {
       // Instantiates the XMLHttpRequest
       var client = new XMLHttpRequest();
       client.open(mode, this._host + '/dform/' + path);
       client.setRequestHeader ("Authorization", "OAuth " + "Junk");
       if (mode === 'POST') {
         console.log ('_callServer: POSTING : ' + JSON.stringify(body));
         client.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
         client.send(JSON.stringify(body));
       } else {
         client.send();
       }
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
  getFormByName (fid) {
    this._formMeta.length > 0 ||   console.log( "DynamicForm.getForm : FormData Not Loaded");
    if (!fid)
      return this._formMeta;
    else
      return this._formMeta.find(f => f.name === fid);
  }
  _queryParams(source) {
    var array = [];
    for(var key in source) {
       array.push(encodeURIComponent(key) + "=" + encodeURIComponent(source[key]));
    }
    return array.join("&");
  }
  query(req) {
    return this._callServer('db/' + req.form + (req.q && ("?q=" + JSON.stringify(req.q)) || ''));
  }
  save(req) {
    return this._callServer('db/' + req.form + (req.parent && "?"+this._queryParams(req.parent) || ''), 'POST', req.body);
  }
  delete(req) {
    return this._callServer('db/' + req.form + '/' + req.id + (req.parent && "?"+this._queryParams(req.parent) || ''), 'DELETE');
  }
  listFiles() {
    return this._callServer('filelist');
  }
  uploadFile (file, evtFn) {
    return new Promise( (resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress",  evtFn, false);
      xhr.addEventListener("load", function (evt) {
        resolve(JSON.parse(evt.target.response));
       }, false);
     xhr.addEventListener("error", function (evt) {
       reject (evt);
     }, false);
     xhr.addEventListener("abort", function (evt) {
       reject(evt);
     }, false);
     xhr.addEventListener("loadstart", evtFn);

     xhr.open("PUT", this._host + '/dform/file/' + file.name, true);
     xhr.setRequestHeader("Content-Type", file.type);
     console.log ('uploadFile() sending : ' + file.name + ', ' + file.type);
     xhr.send(file);
   });
 }
}
