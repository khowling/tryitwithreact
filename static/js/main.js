
// https://6to5.org/docs/usage/polyfill/
require("6to5/polyfill");

const React = require('react');
const Router = require('react-router');
const { Route, DefaultRoute, RouteHandler, Link } = Router;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const csp = require('../../src/lib/csp');
const { go, chan, take, put, operations: ops } = csp;


const routes = require('src/routes');

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

Router.run(routes, function (Handler) {
    console.log ('call1');
    React.render(<Handler/>, document.getElementById('mount'));
});
