const React = require('react/addons');
const { Element, Elements } = require('../lib/util');
const { displayDate } = require("../lib/date");
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const { Link, State } = require("react-router");
const xhr = require('../lib/xhr');
const MetaStore = require('../stores/MetaStore');

const { FormMain } = require('../components/tiles.js');

var Login = React.createClass({
  componentDidMount: function() {
    //console.log ("Field componentDidMount  : " + this.props.fielddef.type  + ", e:" + this.props.edit);

    var self = this;
    let loopupinput = this.getDOMNode().querySelector('input');
    $(loopupinput).iCheck({
      checkboxClass: 'icheckbox_square-blue',
      radioClass: 'iradio_square-blue',
      increaseArea: '20%' // optional
    });
  },
  _signin : function(e, d) {
    console.log (e);
  },
  render: function() {
      return (

          <div className="login-box">
            <div className="login-logo">
              <a href="../../index2.html"><b>Admin</b>LTE</a>
            </div>

            <div className="login-box-body">
              <p className="login-box-msg">Sign in to start your session</p>
              <form onSubmit={this._signin}>
                <div className="form-group has-feedback">
                  <input type="text" className="form-control" placeholder="Email"/>
                  <span className="glyphicon glyphicon-envelope form-control-feedback"></span>
                </div>
                <div className="form-group has-feedback">
                  <input type="password" className="form-control" placeholder="Password"/>
                  <span className="glyphicon glyphicon-lock form-control-feedback"></span>
                </div>
                <div className="row">
                  <div className="col-xs-8">
                    <div className="checkbox icheck">
                      <label>
                        <input type="checkbox" /> Remember Me
                      </label>
                    </div>
                  </div>
                  <div className="col-xs-4">
                    <button type="submit" className="btn btn-primary btn-block btn-flat">Sign In</button>
                  </div>
                </div>
              </form>

              <div className="social-auth-links text-center">
                <p>- OR -</p>
                <a href="#" className="btn btn-block btn-social btn-facebook btn-flat"><i className="fa fa-facebook"></i> Sign in using Facebook</a>
                <a href="#" className="btn btn-block btn-social btn-google-plus btn-flat"><i className="fa fa-google-plus"></i> Sign in using Google+</a>
              </div>

              <a href="#">I forgot my password</a><br/>
              <a href="#/UserReg" className="text-center">Register a new membership</a>

            </div>
          </div>

      )
  }
});



var UserReg = React.createClass({
  render: function() {
    var userreg = MetaStore.getForm ('000000000600');
    return (
      <FormMain key="userreg" view="000000000600"/>
    )
  }
});

module.exports = { Login, UserReg};
