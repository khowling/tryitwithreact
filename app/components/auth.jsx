'use strict;'

import React, {Component} from 'react';

import Router from './router.jsx'
import {FormMain} from './dform.jsx'
import { SvgIcon } from './utils.jsx';

import DynamicForm from '../services/dynamicForm.js';

export class Register extends Component {

  _onFinished() {
  }

  render() {
    let df = DynamicForm.instance,
        userform = df.getFormByName("Users"),
        passform = df.getFormByName("AuthProviders"),
        provider_field = userform.fields.find(f => f.name === "provider");
    return (
      <div>
        <FormMain form={userform} crud="c" onComplete={this._onFinished.bind(this)}/>
        <FormMain form={passform} value={{status: "ready", record: {type:"password", provider_id: "this"}}} parent={{form_id: userform._id, field_id: provider_field._id, record_id: null}} crud="c" onComplete={this._onFinished.bind(this)}/>
      </div>
    );
  }
}

export class Login extends Component {
  constructor (props) {
    //console.log ("Field componentDidMount  : " + this.props.fielddef.type  + ", e:" + this.props.edit);
    super(props);
  }

  _signin (e, d) {
    console.log (e);
  }

  render() {
      return (

        <div className="slds-container--center slds-container--small">

          <div className="grid-card">
              <p className="login-box-msg">Sign in to start your session</p>

                <div className="slds-form--horizontal slds-grid slds-wrap" style={{padding: "1em"}}>
                  <div className="slds-col--padded slds-size--1-of-2 slds-medium-size--1-of-2">
                <form onSubmit={this._signin}>

                  <div className="slds-form-element">
                      <label className="slds-form-element__label">Email</label>
                      <div className="slds-form-element__control">
                        <input type="text" className="slds-input" />
                      </div>
                  </div>

                  <div className="slds-form-element">
                      <label className="slds-form-element__label">Password</label>
                      <div className="slds-form-element__control">
                        <input type="password" className="slds-input" />
                      </div>
                  </div>


                  <div className="slds-form-element">
                    <button type="submit" className="slds-button slds-button--neutral">Sign In</button>
                  </div>
                </form>
              </div>
            </div>
            <hr className="hr hr--pink"></hr>
            <div>
              <div className="social-auth-links text-center">
                  <a className="fbconnect_login_button FBConnectButton FBConnectButton_Large" href={"http://localhost:3000/auth/facebook?state="+encodeURIComponent("http://localhost:8000/#?signin=1")} id="facebook_login_btn">
                      <span className="FBConnectButton_Text">login or register with Facebook</span>
                  </a>
                  <br/>
                  <a href="#" className="btn btn-block btn-social btn-google-plus btn-flat"><i className="fa fa-google-plus"></i> Sign in using Google+</a>
              </div>

              <a href="#">I forgot my password</a><br/>
              <a href={Router.URLfor(true,"Register")} className="text-center">Register a new membership</a>
            </div>
          </div>
        </div>
      )
  }
}

export class AuthState extends Component {
  _changeapp(appid) {
    this.props.onchange(appid);
  }

  render () {
    let self = this;
    if (this.props.user)
      return (
        <div className="slds-dropdown-trigger" aria-haspopup="true">
            <div className="slds-button slds-button--neutral">
              {this.props.user.name} ({this.props.currentApp.name}) <SvgIcon classOverride="header-icons" small={true} spriteType="utility" spriteName="down"/>
            </div>
            <div className="slds-dropdown slds-dropdown--nubbin-top slds-dropdown--menu" style={{left: "35%"}}>
             <ul className="slds-dropdown__list" role="menu">
               { this.props.user.apps && this.props.user.apps.map(function(val, i) { return (
               <li key={i} className="slds-dropdown__item" style={{whiteSpace: "nowrap"}} role="menuitem">
                   <a href={Router.URLfor(val.app._id)} className="slds-truncate">{val.app[Object.keys(val.app)[1]]}</a>
               </li>
             );})}
               <li className="slds-dropdown__item" role="menuitem">
                 <a href={Router.URLfor(true,"RecordPage", "303030303030303030363030", this.props.user._id)} className="slds-truncate">my profile</a>
               </li>
               <li className="slds-dropdown__item" role="menuitem">
                 <a onClick={this.props.onLogout} className="slds-truncate">logout</a>
               </li>
             </ul>
           </div>
         </div>);
    else
      return <div><a href={Router.URLfor(true,"Login")}>Login</a> ({this.props.currentApp && this.props.currentApp.name || ""})</div>;
  }
}
