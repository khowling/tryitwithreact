const React = require('react');
var Router = require('react-router');
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

function CreateFactories(obj) {
  var res = {};
  for (var k in obj) {
    var el = obj[k];
    if (typeof el === "function" && el.isReactLegacyFactory) {
      res[k] = React.createFactory(obj[k]);
    }
  }
  return res;
}

var compfact = CreateFactories(require('./tiles'));

var MetaStore = require('../stores/MetaStore');

var _isListening = false,
    setupRouterfunction = function  (onPopState) {

  if (!_isListening) {
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
    _isListening = true;
  }
}


var App  = React.createClass({
    displayName: 'App',
    //can run them before any component instances are created, and the methods do not have access to the props or state
    statics: {
      _getURLNav:  function (lnkhash) {
        var gethash = lnkhash || decodeURI(
          // We can't use window.location.hash here because it's not
          // consistent across browsers - Firefox will pre-decode it!
          // window.location.pathname + window.location.search
          window.location.href.split('#')[1] || ''
          ) || 'TileList';
        console.log ('App _getURLNav url changed : ' + gethash);
        let [comp, parms] = gethash.split('?');
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
        return ({hash: comp, params: paramjson});
      },
    },
    getInitialState: function() {
        setupRouterfunction (function () {
          var newComp = this.constructor._getURLNav();
          console.log ('App url changed : ' + JSON.stringify(newComp));
          //if (newComp !== this.state.renderThis) {
            this.setState ({renderThis: newComp.hash, urlparam: newComp.params});
          //};
        }.bind(this));
        var newComp = this.constructor._getURLNav();
        console.log ('App Initial URL : ' + JSON.stringify(newComp));
        return {renderThis: newComp.hash, urlparam: newComp.params, formdata: []};
    },
    navTo: function (element) {
      let href, newComp;
      if (typeof element === 'object') {
        event.preventDefault();
        //var newComp = $(event.target).attr('href').substring(1);
        href = $(element.currentTarget).attr('href').substring(1);
        newComp = this.constructor._getURLNav (href);
      } else if (typeof element === 'string') {
        href = element;
        newComp = this.constructor._getURLNav (href);
      }
      // HTML5 history API
      history.pushState({}, "page", "/#" + href);
      console.log ('App navTo ' + JSON.stringify(newComp));
      //if (newComp !== this.state.renderThis) {
      this.setState ({renderThis: newComp.hash, urlparam: newComp.params});
      //}
    },
    componentDidMount: function() {
      MetaStore.initMeta (this._gotMeta);
    },
    _gotMeta: function(data) {
      //console.log ('App _gotMeta ' + JSON.stringify(data));
      this.setState({ formdata: data});
    },
    componentWillUnmount: function() {
      MetaStore.removeListener('change', this._onChange);
    },

    render: function () {
      console.log ('App render : ' + this.state.renderThis);
      if (this.state.formdata.length > 0) {
        if (compfact[this.state.renderThis]) {
          return compfact[this.state.renderThis](
            {meta: this.state.formdata,
             navTo: this.navTo,
             urlparam: this.state.urlparam});
        } else return (
            <div>404</div>
        )
      } else return (
        <div>loading meta</div>
      )

    }
});

module.exports = App;
