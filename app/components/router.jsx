'use strict';

import React, {Component} from 'react';
const DEFAULT_LANDING = 'TileList';

let _backUrl = null;
export default class Router extends Component {

    static navBack(alt) {
      console.log ('Router.navBack, backurl: ' + JSON.stringify(_backUrl));
        if (Router.backUrl)
          window.location.href = Router.encodeHash(Router.backUrl);
        else if (alt)
          window.location.href = alt;
        else
          window.location.href = "#" + DEFAULT_LANDING;
    }


    static set backUrl(val) {
      _backUrl = val;
    }
    static get backUrl() {
      return _backUrl;
    }

    static encodeHash (routeJson) {
      var array = [],
          hash = routeJson.hash,
          params = routeJson.params;

      for(var key in params) {
        if (params[key]) {
          array.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
        }
      }
      console.log ("encodeHash got params " + array.length + " : " + JSON.stringify(array));
      return "#" + (hash || DEFAULT_LANDING) + ((array.length > 0) &&  ("?" + array.join("&")) || "");
    }

    static decodeHash (hashuri) {
      console.log ('Router.decodeHash value : ' + hashuri);
      let [comp, parms] = hashuri.split('?');
      let paramjson = {};
      if (typeof parms !== 'undefined') {
        let tfn = x => {
          let [n, v] = x.split('=');
          if (n === 'gid') {
            let [view, id] = v.split (':');
            paramjson.view = view;
            paramjson.id = id;
          } else
            paramjson[n] = v;
          };

        if (parms.indexOf ('&') > -1)
          parms.split('&').map (tfn);
        else
          tfn (parms);
      }
      return ({hash: comp || DEFAULT_LANDING, params: paramjson});
    }

    static setupRouterfunction (onPopState) {
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

    constructor (props) {
      super (props);
      console.log ('Router() Initialising...');

      let chng_route_fn = () => {
        let navurl = decodeURI(window.location.href.split('#')[1] || '') || DEFAULT_LANDING;
        var newroute = Router.decodeHash(navurl);
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
