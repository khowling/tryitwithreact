'use strict;'

import './index.html';
import 'babel-core/polyfill';

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';

import { SvgIcon } from './components/utils.jsx';
import Router from './components/router.jsx'
import {TileList}  from './components/tiles.jsx'
import {ListPage, RecordPage} from './components/dform.jsx'
import {Login, LogMeIn, AuthState} from './components/auth.jsx'

import DynamicForm from './services/dynamicForm.es6';
class App extends Component {

   constructor (props) {
     super(props);
     console.log ('call createFact ' );
     this.appComponents = App.createFactories (TileList, ListPage, RecordPage, Login, LogMeIn);
     this.dynamicForm = new DynamicForm(props.buildprops.server_url);
     this.state = { formdata: [], booted: false, bootmsg: "not booted"};
   }

   static createFactories (...comps) {
     let factories = [],
         navMeta = [];

     for (let mods of comps) {
    //   console.log ('import mods : ' + mods);
       if (typeof mods === "function" ) {
         //if (mods.navProps) {
           console.log ('creating factory : ' + mods.name);
           factories[mods.name] = React.createFactory(mods);
           navMeta.push (mods.navProps);
         //}
       }
     }
     return {factories: factories, navMeta: navMeta};
   }

   componentWillMount() {
    console.log ('App componentWillMount: setting up services');
    //this.setState ({ bootmsg:  'got cordova deviceready'});
    this.dynamicForm.loadApp().then (() => {
        this.setState ({ booted: true, bootmsg: 'loaded meta'});
    }, (error) => {
        this.setState ({ bootmsg: 'error loading meta : ' + error});
    });

  }

  routeUpdated () {
    console.log ('App:  router noitified App route updated');
  }

   render () {
     console.log ('APP rendering: ' + this.state.bootmsg);
     if (this.state.booted) {
       return (
         <div className="slds">

             <section className="site-banner">
               <div className="slds-container--center slds-container--medium">
                  <div className="slds-grid">
                    <div className="slds-col slds-has-flexi-truncate">
                      <h1>
                        <a href='#'><SvgIcon classOverride="slds-button__icon slds-button__icon--large" spriteType="utility" spriteName="apps"/></a>
                        <small></small>
                      </h1>
                    </div>

                    <div className="slds-col slds-no-flex slds-align-bottom">
                      <div className="slds-grid">
                        <div className="slds-button-space-left" >
                          <AuthState/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </section>
            <div style={{height: "3.5rem"}}></div>

            <div className="container">
              <Router componentFactories={this.appComponents.factories} updateRoute={this.routeUpdated}/>
            </div>

         </div>
       )
     } else return (
       <div>{this.state.bootmsg}</div>
     );
   }
 }
 /*
 <MenuNav menuItems={this.appComponents.navMeta}/>
 { this.state.showSync &&
 <SyncProgress sfd={this.dynamicForm}/>
 }
 */
 React.render(React.createElement(App, {buildprops: buildprops}), document.getElementById('app'));
