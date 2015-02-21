const React = require('react');
var Router = require('react-router');
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
var { ContentHeader, TileList, Tile, Report} = require('./tiles');

var MetaStore = require('../stores/MetaStore');


module.exports  = React.createClass({
    displayName: 'App',
    getInitialState: function() {
        //console.log ('get init state');
        //return getTodoState();
        return { formdata: MetaStore.getMeta()};
    },

    componentDidMount: function() {
      MetaStore.addListener('change', this._onChange);
    },

    componentWillUnmount: function() {
      MetaStore.removeListener('change', this._onChange);
    },

    render: function () {
        return (
          <Link to="list">List</Link>
          <RouteHandler/>
        );
    },
    _onChange: function() {
      this.setState({ formdata: MetaStore.getMeta()});
    }
});
