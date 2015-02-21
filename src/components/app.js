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

var _isListening;
var ensureSlash = function() {
  var hashpath = decodeURI(
    // We can't use window.location.hash here because it's not
    // consistent across browsers - Firefox will pre-decode it!
    window.location.href.split('#')[1] || '');
  if (hashpath.charAt(0) !== '/')  hashpath = '/' + hashpath;
  return hashpath;
}

module.exports  = React.createClass({
    displayName: 'App',
    getInitialState: function() {
        return { formdata: MetaStore.getMeta(), renderThis: 'Test'};
    },
    navTo: function (element) {

      event.preventDefault();
      var newComp = $(event.target).attr('href').substring(1);
      history.pushState({}, "page", "/#" + newComp);
      console.log ('App navTo ' + newComp);
      if (newComp !== this.state.renderThis) {
        this.setState ({renderThis: newComp});
      }
    },

    setupRouter: function () {

      if (!_isListening) {
        if (false) { // use HTML5 history
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
          _isListening = true;
        }
      }
    },


    componentDidMount: function() {
      MetaStore.addListener('change', this._onChange);
    },

    componentWillUnmount: function() {
      MetaStore.removeListener('change', this._onChange);
    },

    render: function () {
      console.log ('App render : ' + this.state.renderThis);
      return compfact[this.state.renderThis](
        {meta: MetaStore.getMeta(),
         navTo: this.navTo});

    },
    _onChange: function() {
      this.setState({ formdata: MetaStore.getMeta()});
    }
});
