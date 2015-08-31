'use strict;'

import React, {Component} from 'react';

import {RecordList, Form} from './dform.jsx'

import DynamicForm from '../services/dynamicForm.es6';

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
              <a href="#/UserReg" className="text-center">Register a new membership</a>
            </div>
          </div>
        </div>

      )
  }
}


export class AuthState extends Component {

  constructor(props) {
    super(props);
    let df = DynamicForm.instance;
    this.state = {user: df.user};
  }

  _logout() {
    let df = DynamicForm.instance;
    df.logOut().then(succ => {
      this.setState ({user: {}}, () => {
        window.location.reload("#");
      });

    });
  }

  render () {
    if (this.state.user._id)
      return (
        <div className="slds-dropdown-trigger" aria-haspopup="true">
            <div className="">
              {this.state.user.name}
            </div>
            <div className="slds-dropdown slds-dropdown--nubbin-top slds-dropdown--menu" style={{left: "35%"}}>
             <ul className="slds-dropdown__list" role="menu">
               <li className="slds-dropdown__item" >
                 <a onClick={this._logout.bind(this)} tabindex="-1" className="slds-truncate">logout</a>
               </li>
             </ul>
           </div>
         </div>);
    else
      return <div><a href='#Login'>Login</a></div>;
  }
}
