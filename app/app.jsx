'use strict';


import React, {Component} from 'react';
//import ReactDOM from 'react-dom';

import { SvgIcon, Alert }           from './components/utils.jsx';
import Router                       from './components/router.jsx';
import {AdminTileList}                   from './components/tiles.jsx';
import {ListMain, ListPage, RecordPage}       from './components/dform.jsx';
import {TimeLine}                   from './components/timeline.jsx';
import {Login, Register, AuthState}  from './components/auth.jsx';

import DynamicForm from './services/dynamicForm.js';

export default class App extends Component {

   static createFactories (...comps) {
     let factories = [],
         navMeta = [];

     for (let mods of comps) {
    //   console.log ('import mods : ' + mods);
       if (typeof mods === "function" ) {
         //if (mods.navProps) {
           //console.log ('App: creating factory : ' + mods.name);
           factories[mods.name] = React.createFactory(mods);
           navMeta.push (mods.navProps);
         //}
       }
     }
     return {factories: factories, navMeta: navMeta};
   }

  constructor (props) {
    super(props);
    this.appComponents = App.createFactories (ListMain, AdminTileList, ListPage, RecordPage, TimeLine, Register, Login, Register);
    //this.nonAppComponents = App.createFactories (Login, Register);
    this.dynamicForm = new DynamicForm(props.buildprops.server_url);
    this.state = { booted: false, booterr: false,  bootmsg: "Loading....", user: null, currentApp: null};
  }

  componentWillMount() {
    var newroute = Router.decodeCurrentURI();
    this._loadApp(newroute);
  }

  _loadApp(newroute) {
    this.dynamicForm.loadApp(newroute.appid).then ((val) => {
      if (this.dynamicForm.app) {
        //console.log ("App: _loadApp, loaded with the app id : " + this.dynamicForm.app._id);
        Router.ensureAppInUrl (this.dynamicForm.app._id);
      }
      this.setState ({ booted: true, booterr: false, bootmsg: null, user: this.dynamicForm.user, currentApp: this.dynamicForm.app});
    }, (e) => {
      this.setState ({ booted: false, booterr: true, bootmsg: 'Error loading app : ' + e.error});
    });
  }



  routeUpdated (newroute) {
    //console.log ('App: router noitified App route updated');
    if (newroute.appid !== this.state.currentApp._id) {
      this._loadApp(newroute);
    }
  }

  _logout() {
    //console.log ('App: _logout router noitified');
    this.dynamicForm.logOut().then(succ => {
      this.setState ({ booted: false, booterr: false,  bootmsg: "Loading....", user: null, currentApp: null}, () => {
        if (window)
          window.location.href = Router.URLfor(false,"Login");
          this._loadApp ({hash: "Login"});
      });
    });
  }

  render () {
    //console.log ("App: render");
    // 
    if (this.state.booted)  return (
      <div className="viewport">

      <header className="slds-global-header_container">
        
        <div className="slds-global-header slds-grid slds-grid--align-spread">
          <div className="slds-global-header__item">
            <div className="slds-global-header__logo">

                <div className="slds-context-bar__primary slds-context-bar__item--divider-right">
                  <div className="slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger--click slds-no-hover">
                    <div className="slds-context-bar__icon-action">
                      <a href={Router.URLfor(true)} className="slds-icon-waffle_container slds-context-bar__button">
                        <div className="slds-icon-waffle">
                          <div className="slds-r1"></div>
                          <div className="slds-r2"></div>
                          <div className="slds-r3"></div>
                          <div className="slds-r4"></div>
                          <div className="slds-r5"></div>
                          <div className="slds-r6"></div>
                          <div className="slds-r7"></div>
                          <div className="slds-r8"></div>
                          <div className="slds-r9"></div>
                        </div>
                        <span className="slds-assistive-text">Open App Launcher</span>
                      </a>
                    </div>
                    <span className="slds-context-bar__label-action slds-context-bar__app-name">
                      <span className="slds-truncate" title="{ props.appName || 'App Name' }">App Name</span>
                    </span>
                  </div>
                </div>
            </div>
          </div>
          <div className="slds-global-header__item slds-global-header__item--search">
            <div className="slds-form-element slds-lookup slds-is-o pen">
              <label className="slds-assistive-text" >Search</label>
              <div className="slds-form-element__control slds-input-has-icon slds-input-has-icon--left">
                <svg  className="slds-input__icon">
                  <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#search"></use>
                </svg>
                <input id="global-search-01" className="slds-input slds-lookup__search-input" type="search" placeholder="Search" />
              </div>


              <div className="slds-lookup__menu" id="global-search-list-01">
                <div className="slds-lookup__item--label slds-text-body--small">Recent Items</div>
                <ul className="slds-lookup__list" role="listbox">
                  <li role="presentation">
                    <span className="slds-lookup__item-action slds-media slds-media--center" id="option-01" role="option">
                      <svg aria-hidden="true" className="slds-icon slds-icon-standard-opportunity slds-icon--small slds-media__figure">
                        <use xlinkHref="/assets/icons/standard-sprite/svg/symbols.svg#opportunity"></use>
                      </svg>
                      <div className="slds-media__body">
                        <div className="slds-lookup__result-text">force - 1,000 Licenses</div>
                        <span className="slds-lookup__result-meta slds-text-body--small">rospecting</span>
                      </div>
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
          <ul className="slds-global-header__item slds-grid slds-grid--vertical-align-center">

            <AuthState user={this.state.user} currentApp={this.state.currentApp} onLogout={this._logout.bind(this)}/>

            <li className="slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger--hover" aria-haspopup="true">
              <a href="javascript:void(0);" className="slds-context-bar__label-action" title="Menu Item">
                <span className="slds-truncate">Menu Item</span>
              </a>
              <div className="slds-context-bar__icon-action slds-p-left--none" tabIndex="0">
                <button className="slds-button slds-button--icon slds-context-bar__button" tabIndex="-1" title="Open menu item submenu">
                  <svg aria-hidden="true" className="slds-button__icon">
                    <use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#chevrondown"></use>
                  </svg>
                  <span className="slds-assistive-text">Open menu item submenu</span>
                </button>
              </div>
              <div className="slds-dropdown slds-dropdown--right">
                <ul className="slds-dropdown__list" role="menu">
                  <li className="slds-dropdown__item" role="presentation">
                    <a href="javascript:void(0);" role="menuitem" tabIndex="-1">
                      <span className="slds-truncate">
                        <svg aria-hidden="true" className="slds-icon slds-icon--x-small slds-icon-text-default slds-m-right--x-small">
                          <use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#add"></use>
                        </svg>Main action</span>
                    </a>
                  </li>
                  <li className="slds-dropdown__header slds-has-divider--top-space" role="separator">
                    <span className="slds-text-title--caps">Menu header</span>
                  </li>
                  <li className="slds-dropdown__item" role="presentation">
                    <a href="javascript:void(0);" role="menuitem" tabIndex="-1">
                      <span className="slds-truncate">Menu Item One</span>
                    </a>
                  </li>
                  <li className="slds-dropdown__item" role="presentation">
                    <a href="javascript:void(0);" role="menuitem" tabIndex="-1">
                      <span className="slds-truncate">Menu Item Two</span>
                    </a>
                  </li>
                  <li className="slds-dropdown__item" role="presentation">
                    <a href="javascript:void(0);" role="menuitem" tabIndex="-1">
                      <span className="slds-truncate">Menu Item Three</span>
                    </a>
                  </li>
                </ul>
              </div>
            </li>


            <li className="slds-dropdown-trigger slds-dropdown-trigger--click slds-m-left--x-small slds-is-open">
              <button className="slds-button" title="person name" >
                <span className="slds-avatar slds-avatar--circle slds-avatar--medium">
                  <img src="/assets/images/avatar2.jpg" alt="person name" />
                </span>
              </button>
              <div className="slds-dropdown slds-dropdown--right">
                <ul className="slds-dropdown__list" role="menu">
                  <li className="slds-dropdown__item" role="presentation">
                    <a href="/" role="menuitem" tabIndex="0">
                      <span className="slds-truncate">Menu Item One</span>
                    </a>
                  </li>
                  <li className="slds-dropdown__item" role="presentation">
                    <a href="/" role="menuitem" tabIndex="-1">
                      <span className="slds-truncate">Menu Item Two</span>
                    </a>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </header>

      <div className="container">
        <Router key={this.state.currentApp && this.state.currentApp._id || 'none'} componentFactories={this.appComponents.factories} currentApp={this.state.currentApp} updateRoute={this.routeUpdated.bind(this)}/>
      </div>

    </div>
    );
    else if (this.state.booterr) return (
        <Alert message={"Looks like your user is not correctly configured, please email the system ower with this message" + this.state.bootmsg}/>
      );
    else return (
      <div className="slds">
      <div className="slds-spinner_container">
        <div className="slds-spinner--brand slds-spinner slds-spinner--large" role="alert">
          <div className="slds-spinner__dot-a"></div>
          <div className="slds-spinner__dot-b"></div>
        </div>
      </div>
      <div className="slds-align--absolute-center"><span className="slds-badge">{this.state.bootmsg}</span></div>
    </div>
    );
  }
 }
