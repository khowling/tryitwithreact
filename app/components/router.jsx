'use strict';


import React, {Component} from 'react';
import DynamicForm from '../services/dynamicForm.es6';


const DEFAULT_LANDING = 'TileList';

let _backUrl = null;
export default class Router extends Component {

    static set backUrl(val) {
      _backUrl = val;
    }
    static get backUrl() {
      return _backUrl;
    }

    static URLfor(comp, form, record, params) {
      let df = DynamicForm.instance,
          routeJson = {appid: df.app && df.app._id, params: {}};
      if (comp) routeJson.hash = comp;
      if (form) routeJson.params.gid = form + (record && ("-"+record) || "");
      if (params) Object.assign (routeJson.params, params);
      return Router._encodeHash (routeJson);
    }

    static navTo(comp, form, record, params, backiflist) {
      if (window) {
        if (Router.backUrl && backiflist && (Router.backUrl.hash === "ListPage" || Router.backUrl.hash === DEFAULT_LANDING))
          window.location.href = Router._encodeHash(Router.backUrl);
        else
          window.location.href = Router.URLfor(comp, form, record, params);
      }
    }

    static _encodeHash (routeJson) {
      let array = [],
          {appid, hash, params} = routeJson;

      for(var key in params) {
        if (params[key]) {
          array.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
        }
      }
      console.log ("Router._encodeHash got params " + array.length + " : " + JSON.stringify(array));
      return "#" + (appid && (appid+"/") || "") + (hash || DEFAULT_LANDING) + ((array.length > 0) &&  ("?" + array.join("&")) || "");
    }

    static _decodeHash (hashuri) {
      console.log ('Router._decodeHash value : ' + hashuri);
      let retval = {appid: null, hash: DEFAULT_LANDING, params: null},
          paramjson = {};

      // url format: #[<appid>/]<compoment>
      if (hashuri &&  hashuri !== "undefined") {
        let [main, parms] = hashuri.split('?');

        if (main) {
          if (main.indexOf("/") > -1) {
            let [appid, component] = main.split('/');
            if (appid &&  appid !== "undefined") retval.appid = appid;
            if (component &&  component !== "undefined") retval.hash = component;
          } else {
            retval.hash = main;
          }
        }
        // url params ?gid=<view>[:<id>]
        if (parms) {
          let tfn = x => {
            let [n, v] = x.split('=');
            if (n === 'gid') {
              let [view, id] = v.split ('-');
              paramjson.view = view;
              paramjson.id = id;
            } else
              paramjson[n] = v;
          };

          if (parms.indexOf ('&') > -1)
            parms.split('&').map (tfn);
          else
            tfn (parms);
          retval.params = paramjson;
        }
      }
      console.log ('Router._decodeHash return value : ' + JSON.stringify(retval));
      return (retval);
    }

    static setupRouterfunction (onPopState) {
      if (window) {
        if (true) { // use HTML5 history
          if (window.addEventListener) {
            window.addEventListener('popstate', onPopState, false);
          } else {
            window.attachEvent('popstate', onPopState);
          }
        } else {
          if (window.addEventListener) {
            window.addEventListener('hashchange', onHashChange, false);
          } else {
            window.attachEvent('onhashchange', onHashChange);
          }
        }
      }
    }

    static decodeCurrentURI () {
      if (typeof window  !== 'undefined')
        return Router._decodeHash(decodeURI(window.location.href.split('#')[1]));
      else
        return {};
    }

    static ensureAppInUrl (newappid) {
      let currentroute = Router.decodeCurrentURI();
      console.log ("current route " + JSON.stringify(currentroute) + "new app requeted: " + newappid);
      if (currentroute.appid && (currentroute.appid != newappid)) {
        console.log ("chaning apps, ensure the hash and params are wiped");
        delete currentroute.hash;
        delete currentroute.params;
      }
      currentroute.appid = newappid;
      if (window) window.history.replaceState("", "", Router._encodeHash(currentroute));
    }

    constructor (props) {
      super (props);
      console.log ('Router() Initialising...');

      let chng_route_fn = () => {
        var newroute = Router.decodeCurrentURI();
        console.log ('Router() url changed : ' + JSON.stringify(newroute));
        if (props.updateRoute) props.updateRoute (newroute);
        // Save current route before overriding for backURL
        if (this.state) Router.backUrl = this.state.newroute;

        return {newroute: newroute};
      };

      // Register function on route changes
      Router.setupRouterfunction (() => {
        this.setState (chng_route_fn());
      });
      // Handle initial app load
      this.state = chng_route_fn();
    }

    render() {
      console.log ('Router() Rendering newroute: ' + JSON.stringify(this.state));
      let Routefactory = this.props.componentFactories[this.state.newroute.hash];
      if (Routefactory) {
          return Routefactory(
            {key: JSON.stringify(this.state.newroute.params),
             urlparam: this.state.newroute.params});
      } else return (
          <div>404</div>
      )
    }
}
