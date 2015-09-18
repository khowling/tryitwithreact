'use strict';

import { range, seq, compose, map, filter } from 'transducers.js';

let instance = null;
export default class DynamicForm {

  constructor (server_url) {
    if (instance) {
      throw "DynamicForm() only allow to construct once";
    }
    this._host = server_url;
    this.ROUTES = {dform: '/dform/', auth: '/auth/'};
    instance = this;
    this.clearApp();
  }

  static get instance() {
    if (!instance) throw "DynamicForm() need to construct first";
    return instance;
  }

  get host() {
      return this._host;
    }
  get user() {
    return this._user;
  }
  get app() {
    return this._currentApp;
  }

  _callServer(path, mode = 'GET', body) {
    return new Promise( (resolve, reject) => {
       // Instantiates the XMLHttpRequest
       var client = new XMLHttpRequest();
       client.open(mode, this._host  + path);
       client.setRequestHeader ("Authorization", "OAuth " + "Junk");
       client.withCredentials = true;
       if (mode === 'POST') {
         console.log ('_callServer: POSTING to ['+this._host  + path+']: ' + JSON.stringify(body));
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
           reject(this.response);
         }
       };
       client.onerror = function (e) {
         reject("Network Error: " + this.statusText);
       };
     });
  }

  clearApp() {
    this._appMeta = [];
    this._user = {};
    this._currentApp = {};
  }

  getMe() {
    return this._callServer(this.ROUTES.auth + 'me');
  }

  logOut() {
    return this._callServer(this.ROUTES.auth + 'logout').then(succ => {
      this.clearApp();
    });
  }

  loadApp(appid) {
    this.clearApp();
    return this._callServer(this.ROUTES.dform + 'loadApp/' + (appid && ("?appid=" + appid) || '')).then(val => {
      this._appMeta = val.appMeta || [];
      this._user = val.user;
      this._currentApp = val.app;
    });
  }
  getForm (fid) {
    this._appMeta.length > 0 ||   console.log( "DynamicForm.getForm : FormData Not Loaded");
    if (!fid)
      return this._appMeta;
    else
      return this._appMeta.find(f => f._id === fid);
  }
  getFormByName (fid) {
    this._appMeta.length > 0 ||   console.log( "DynamicForm.getForm : FormData Not Loaded");
    if (!fid)
      return this._appMeta;
    else
      return this._appMeta.find(f => f.name === fid);
  }
  _queryParams(source) {
    var array = [];
    for(var key in source) {
       array.push(encodeURIComponent(key) + "=" + encodeURIComponent(source[key]));
    }
    return array.join("&");
  }
  // get 1 or many by ID
  get(viewid, ids) {
    if (!Array.isArray(ids)) ids = [ids];
    return this._callServer(this.ROUTES.dform + 'db/' + viewid + (ids && ("?id=" + ids.join(",")) || ''));
  }
  // search by name (primary)
  search(viewid, str) {
    return this._callServer(this.ROUTES.dform + 'db/' + viewid + (str && ("?p=" + str) || ''));
  }
  // full query
  query(viewid, q) {
    return this._callServer(this.ROUTES.dform + 'db/' + viewid + (q && ("?q=" + JSON.stringify(q)) || ''));
  }
  save(req) {
    return this._callServer(this.ROUTES.dform + 'db/' + req.form + (req.parent && "?"+this._queryParams(req.parent) || ''), 'POST', req.body);
  }
  delete(req) {
    return this._callServer(this.ROUTES.dform + 'db/' + req.form + '/' + req.id + (req.parent && "?"+this._queryParams(req.parent) || ''), 'DELETE');
  }
  listFiles() {
    return this._callServer(this.ROUTES.dform + 'filelist');
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
