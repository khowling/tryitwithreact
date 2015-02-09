const React = require('react');
const Router = require('react-router');
const { Route, DefaultRoute, RouteHandler, Link } = Router;

var App = require('./components/app');
var {Home, Dashboard, Form} = require('./components/dashboard_example');
var {DForm} = require('./components/dform');
var { ContentHeader, TileList, Tile, Report} = require('./components/tiles');

var routes = (
    <Route handler={App} path="/">
        <DefaultRoute handler={TileList}/>
        <Route name="tiles" path="/tiles/:flt" handler={TileList}/>
        <Route name="report" path="/report/:id" handler={Report}/>
    </Route>
);
module.exports = routes;