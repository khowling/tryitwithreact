'use strict';


import React, {Component} from 'react';
import DynamicForm from '../services/dynamicForm.es6';
import {Modal, SvgIcon, IconField, Alert, UpdatedBy } from './utils.jsx';


const DEFAULT_LANDING = 'TileList';

let _backUrl = null;
export default class Router extends Component {

  constructor (props) {
    super (props);
    console.log ('Router: constructor for : ' + props.currentApp._id);
  }

  static set backUrl(val) {
    _backUrl = val;
  }
  static get backUrl() {
    return _backUrl;
  }

  static URLfor(appid, comp, form, record, params) {
    let df = DynamicForm.instance,
        effectiveappid;

    if (typeof appid === "boolean")
      effectiveappid = appid && df.app && df.app._id;
    else
      effectiveappid = appid || false;

    let routeJson = {appid: effectiveappid, params: {}};

    if (comp) routeJson.hash = comp;
    if (form) routeJson.params.gid = form + (record && ("-"+record) || "");
    if (params) Object.assign (routeJson.params, params);

    console.log ('Router.URLFor : ' + JSON.stringify(routeJson));
    return Router._encodeHash (routeJson);
  }

  static navTo(appid, comp, form, record, params, backiflist) {
    if (window) {
      if (Router.backUrl && backiflist && (Router.backUrl.hash === "ListPage" || Router.backUrl.hash === DEFAULT_LANDING))
        window.location.href = Router._encodeHash(Router.backUrl);
      else
        window.location.href = Router.URLfor(appid, comp, form, record, params);
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
    //console.log ("Router._encodeHash got params " + array.length + " : " + JSON.stringify(array));
    return "#" + (appid && (appid+"/") || "") + (hash || "") + ((array.length > 0) &&  ("?" + array.join("&")) || "");
  }

  static _decodeHash (hashuri) {
    //console.log ('Router._decodeHash value : ' + hashuri);
    let retval = {appid: null, hash: null, params: null},
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
    //console.log ('Router._decodeHash return value : ' + JSON.stringify(retval));
    return (retval);
  }

  static setupRouterfunction (onPopState, remove = false) {
    if (window) {
      if (true) { // use HTML5 history
        if (window.addEventListener) {
          if (remove) {
            console.log ('removing popstate');
            window.removeEventListener('popstate', onPopState, false);
          }
          else
            window.addEventListener('popstate', onPopState, false);
        } else {
          if (remove)
            window.detachEvent('popstate', onPopState);
          else
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
    if (currentroute.appid && (currentroute.appid != newappid)) {
      console.log ("chaning apps, ensure the hash and params are wiped");
      delete currentroute.hash;
      delete currentroute.params;
    }
    currentroute.appid = newappid;
    if (window) window.history.replaceState("", "", Router._encodeHash(currentroute));
  }

  _chng_route_fn (popfn)  {
    let df = DynamicForm.instance,
        currentApp = df.app || {},
        updateRouteFn = this.props.updateRoute,
        newroute = Router.decodeCurrentURI();

    console.log ('Router: chng_route_fn ['+ this.props.currentApp._id +']  current appid: ' + currentApp._id);
    if (currentApp._id === newroute.appid) {
      console.log ('Router: chng_route_fn, same app, updating state with newroute: ' + JSON.stringify(newroute));
      if (updateRouteFn) updateRouteFn (newroute);
      // Save current route before overriding for backURL
      if (this.state) Router.backUrl = this.state.newroute;
      if (typeof popfn === "function")
        this.setState({newroute: newroute, popfn: popfn});
      else {
        this.setState({newroute: newroute});
      }
    } else {
      console.log ('Router: chng_route_fn, DIFFERENT app, update App & return : ' + JSON.stringify(newroute));
      if (updateRouteFn) updateRouteFn (newroute);
      return null;
    }
  }

 componentWillMount() {
   console.log ("Router componentWillMount: " + this.props.currentApp._id);
   // Register function on route changes
   let popfn = this._chng_route_fn.bind(this);
   Router.setupRouterfunction (popfn);
   // Handle initial app load
   this._chng_route_fn(popfn);
 }

 componentWillUnmount() {
   console.log ("Router componentWillUnmount: " + this.props.currentApp._id);
   Router.setupRouterfunction (this.state.popfn, true);
   console.log ("Router componentWillUnmount done");
 }

  render() {
    let df = DynamicForm.instance,
        template3 = (head,content,side) => {
      return (
        <div className="slds-grid slds-wrap">
          <div className="slds-col slds-size--1-of-1">{head}
          </div>
          <div className="slds-col slds-size--1-of-1 slds-medium-size--2-of-3">{content}
          </div>
          <div className="slds-col slds-size--1-of-1 slds-medium-size--1-of-3">{side}
          </div>
      </div>
        );
    }
    console.log ('Router: render newroute');
    if (!this.state.newroute.hash) { // landingpage
      let page = df.app.landingpage && df.app.landingpage[0],
          comp = page && this.props.componentFactories[page.component._id] || null;
      if (comp) {
        console.log (`Router: rendering component ${page.component._id} with props ${JSON.stringify(page.props)}`);
        return template3((<div></div>),comp(page.props), (<div></div>) );
      } else
        return (<Alert message={page && ("Unknown Compoent " + JSON.stringify(page.component)) || "No landing page defined for app"} alert={true}/>);
    } else {
      let Routefactory = this.props.componentFactories[this.state.newroute.hash];
      if (Routefactory) {
          return Routefactory(
            {key: JSON.stringify(this.state.newroute.params),
              view: {_id: this.state.newroute.params.view},
             urlparam: this.state.newroute.params});
      } else return (<Alert message={"Unknown Compoent " + this.state.newroute.hash} alert={true}/>);
    }
  }
}
Router.propTypes = {
  currentApp: React.PropTypes.shape({
    _id: React.PropTypes.string.isRequired
  })
}
