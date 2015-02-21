const React = require('react');
const Router = require('react-router');
const { Route, DefaultRoute, RouteHandler, Link } = Router;

var App = require('./components/app');
let { ContentHeader, TileList, Tile, Report, Test} = require('./components/tiles');
var {Home, Dashboard, Form} = require('./components/dashboard_example');

var routes = (
    <Route handler={App} path="/">
        <DefaultRoute handler={Test}/>
        <Route name="listId" path="/list/:metaId" handler={TileList} />
        <Route name="list"  handler={TileList} />
    </Route>
);
module.exports = routes;
