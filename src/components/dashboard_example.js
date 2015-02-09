
var React = require('react');
var Router = require('react-router');
var { Route, DefaultRoute, RouteHandler, Link } = Router;

var Home = React.createClass({
    render: function () {
        return <h1>Home</h1>;
    }
});

var Dashboard = React.createClass({
    render: function () {
        return <h1>Dashboard</h1>;
    }
});

var Form = React.createClass({

    mixins: [ Router.Navigation ],

    statics: {
        willTransitionFrom: function (transition, element) {
            if (element.refs.userInput.getDOMNode().value !== '') {
                if (!confirm('You have unsaved information, are you sure you want to leave this page?')) {
                    transition.abort();
                }
            }
        }
    },

    handleSubmit: function (event) {
        event.preventDefault();
        this.refs.userInput.getDOMNode().value = '';
        this.transitionTo('/');
    },

    render: function () {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <p>Click the dashboard link with text in the input.</p>
                    <input type="text" ref="userInput" defaultValue="ohai" />
                    <button type="submit">Go</button>
                </form>
            </div>
        );
    }
});

module.exports =  {Home: Home, Dashboard: Dashboard, Form: Form};