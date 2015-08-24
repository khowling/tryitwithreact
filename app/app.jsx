'use strict;'

import './index.html';
import 'babel-core/polyfill';

import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import Router from './components/router.jsx'
import {TileList}  from './components/tiles.jsx'
import {RecordList, Form} from './components/dform.jsx'

import DynamicForm from './services/dynamicForm.es6';
class App extends Component {

   constructor (props) {
     super(props);
     console.log ('call createFact ' );
     this.appComponents = App.createFactories (TileList, RecordList, Form);
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
    this.dynamicForm.loadMeta().then (() => {
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
         <div>
             <Router componentFactories={this.appComponents.factories} updateRoute={this.routeUpdated}/>
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

 ReactDOM.render(React.createElement(App, {buildprops: buildprops}), document.getElementById('app'));
