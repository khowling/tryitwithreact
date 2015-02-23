
// https://6to5.org/docs/usage/polyfill/
require("babel/polyfill");

const React = require('react');
const Router = require('react-router');
const { Route, DefaultRoute, RouteHandler, Link } = Router;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const csp = require('../../src/lib/csp');
const { go, chan, take, put, operations: ops } = csp;

const MetaStore = require('../../src/stores/MetaStore');

var App = React.createElement(require('../../src/components/app'));
React.render(App, document.getElementById('mount'));
/*
const bootstrap = require('src/bootstrap');

let { router, pageChan } = bootstrap.run(
    routes,
    Router.RefreshLocation,
    "keith",
    "date"
);

go(function*() {
    // Since we use RefreshLocation now, we actually don't need to loop
    // here. All location changes will use a full refresh. But keep this
    // here for reference until I pull this out into a generic app template.
    while(true) {
        let { Handler, props } = yield take(pageChan);
        React.render(React.createElement(Handler, props),
            document.getElementById('mount'));
    }
});

window.relocate = function(url) {
    router.replaceWith(url);
}
*/
/*
const routes = require('../../src/routes');

Router.run(routes, function (Handler) {
    console.log ('Route me');
    React.render(<Handler/>, document.getElementById('mount'));
});
*/
