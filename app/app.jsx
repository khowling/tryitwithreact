'use strict;'


import React, {Component} from 'react';
//import ReactDOM from 'react-dom';

import { SvgIcon, Alert }           from './components/utils.jsx';
import Router                       from './components/router.jsx';
import {TileList}                   from './components/tiles.jsx';
import {ListPage, RecordPage}       from './components/dform.jsx';
import {TimeLine}                   from './components/timeline.jsx';
import {Login, LogMeIn, AuthState}  from './components/auth.jsx';

import DynamicForm from './services/dynamicForm.es6';

export default class App extends Component {

   constructor (props) {
     super(props);
     console.log ('App: constructor');
     this.appComponents = App.createFactories (TileList, ListPage, RecordPage, TimeLine, Login, LogMeIn);
     this.dynamicForm = new DynamicForm(props.buildprops.server_url);
     this.state = { booted: false, booterr: false,  bootmsg: "not booted", user: null, currentApp: null};
   }

   static createFactories (...comps) {
     let factories = [],
         navMeta = [];

     for (let mods of comps) {
    //   console.log ('import mods : ' + mods);
       if (typeof mods === "function" ) {
         //if (mods.navProps) {
           console.log ('App: creating factory : ' + mods.name);
           factories[mods.name] = React.createFactory(mods);
           navMeta.push (mods.navProps);
         //}
       }
     }
     return {factories: factories, navMeta: navMeta};
   }

   _loadApp(appid) {
     let loadappid = appid;
     this.dynamicForm.loadApp(loadappid).then ((val) => {
       if (this.dynamicForm.app) {
         console.log ("App: _loadApp, loaded with the app id : " + this.dynamicForm.app._id);
         Router.ensureAppInUrl (this.dynamicForm.app._id);
       }
       this.setState ({ booted: true, booterr: false, bootmsg: null, user: this.dynamicForm.user, currentApp: this.dynamicForm.app});
     }, (error) => {
         this.setState ({ booterr: true, bootmsg: 'Error loading app : ' + JSON.parse(error).message});
     });
   }

   componentWillMount() {
    var urlappid = Router.decodeCurrentURI().appid;
    console.log ("App: componentWillMount: setting up services for requested app id : " + urlappid);
    this._loadApp(urlappid);
  }

  _authChange(chng) {
    console.log ('App:  router noitified authChange: ' + JSON.stringify(chng));
    if (chng.logout) {
      this.dynamicForm.logOut().then(succ => {
        //this.setState ({user: {}}, () => {
        if (window)
          window.location.reload("#");
      //  });
      });
    }
  }

  routeUpdated (newroute) {
    console.log ('App: router noitified App route updated');
    if (newroute.appid !== this.state.currentApp._id) {
      console.log ('App: new app requested, need to reload the new app');
      this.setState ({ booted: false, booterr: false, bootmsg: 'loading app'}, () =>  this._loadApp(newroute.appid));
    }
  }

   render () {
     console.log ("App: render");
     if (this.state.booted)  return (
         <div className="slds">

             <section className="site-banner">
               <div className="slds-container--center slds-container--medium">
                  <div className="slds-grid">
                    <div className="slds-col slds-has-flexi-truncate">
                        <a href={Router.URLfor()}><SvgIcon classOverride="icon-utility" large={true} spriteType="utility" spriteName="apps"/></a>
                    </div>

                    <div className="slds-col slds-no-flex slds-align-bottom">
                      <div className="slds-grid">
                        <div className="slds-button-space-left" >
                          <AuthState user={this.state.user} currentApp={this.state.currentApp} onchange={this._authChange.bind(this)}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </section>
            <div style={{height: "3.5rem"}}></div>

            <div className="container">
              { this.state.currentApp &&
              <Router key={this.state.currentApp._id} componentFactories={this.appComponents.factories} currentApp={this.state.currentApp} updateRoute={this.routeUpdated.bind(this)}/>
              }
            </div>

         </div>
       );
     else if (this.state.booterr) return (
         <Alert message={"Looks like your user is not correctly configured, please email the system ower with this message" + this.state.bootmsg}/>
       );
     else return (
       <div className="slds">

           <section className="site-banner">
             <div className="slds-container--center slds-container--medium"></div>
          </section>
           <div style={{height: "3.5rem"}}></div>

           <div className="container">
             {this.state.bootmsg}
             <div className="slds-spinner--small">
              <img src="http://localhost:3000/assets/images/spinners/slds_spinner.gif" alt="Loading..." />
            </div>
          </div>
      </div>
     );
   }
 }
