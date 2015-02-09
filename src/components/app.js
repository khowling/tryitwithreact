const React = require('react');
var Router = require('react-router');
var { Route, DefaultRoute, RouteHandler, Link } = Router;
var { ContentHeader, TileList, Tile, Report} = require('./tiles');


module.exports  = React.createClass({
    displayName: 'App',
    render: function () {
        return (
            <aside className="right-side">
                <ContentHeader />
                <RouteHandler/>
            </aside>
        );
    }
});



