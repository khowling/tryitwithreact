
'use strict;'

import React, {Component} from 'react';
import {Modal, SvgIcon, IconField, Alert, UpdatedBy } from './utils.jsx';
import Router from './router.jsx';


import DynamicForm from '../services/dynamicForm.es6';


export class FormHeader extends Component {
  render() {
    let df = DynamicForm.instance,
        isformmeta = this.props.view == "303030303030303030313030";

    console.log ("Form " + this.props.view.name + ", icon :" + this.props.view.icon);
    return (
      <div className="slds-page-header ">
        <div className="slds-grid">
          <div className="slds-col slds-has-flexi-truncate">

            <div className="slds-media">
              <div className="slds-media__figure">
                <a  href={ Router.URLfor(true, "ListPage", this.props.view._id)}>
                <IconField value={this.props.view.icon} large={true}/>
                </a>
              </div>

              <div className="slds-media__body">
                <p className="slds-text-heading--label">Record Type</p>
                <div className="slds-grid">
                  <h1 className="slds-text-heading--medium slds-m-right--small slds-truncate slds-align-middle">{this.props.view.name}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-col slds-no-flex slds-align-bottom">
            <div className="slds-grid">
              { !isformmeta &&
              <a className="slds-button slds-button--icon-more slds-shrink-none slds-m-left--large" href={ Router.URLfor("admin", "RecordPage", "303030303030303030313030", this.props.view._id)}>
                <SvgIcon spriteType="utility" spriteName="settings" small={true} classOverride="slds-button__icon icon-utility"/>
              </a>
              }
            </div>
          </div>
        </div>
        <p className="slds-text-body--small slds-m-top--x-small">10 items, sorted by name</p>
      </div>
    );
  }
}


export class RecordHeader extends Component {
  render() {
    let df = DynamicForm.instance,
        isformmeta = this.props.view == "303030303030303030313030";

    console.log ("Form " + this.props.view.name + ", icon :" + this.props.view.icon);
    return (
      <div className="slds-page-header ">
        <div className="slds-grid">
          <div className="slds-col slds-has-flexi-truncate">

            <div className="slds-media">
              <div className="slds-media__figure">
                <a  href={ Router.URLfor(true, "ListPage", this.props.view._id)}>
                <IconField value={this.props.view.icon} large={true}/>
                </a>
              </div>

              <div className="slds-media__body">
                <p className="slds-text-heading--label">Record Type</p>
                <div className="slds-grid">
                  <h1 className="slds-text-heading--medium slds-m-right--small slds-truncate slds-align-middle">{this.props.view.name}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-col slds-no-flex slds-align-bottom">
            <div className="slds-grid">
              { !isformmeta &&
              <a className="slds-button slds-button--icon-more slds-shrink-none slds-m-left--large" href={ Router.URLfor("admin", "RecordPage", "303030303030303030313030", this.props.view._id)}>
                <SvgIcon spriteType="utility" spriteName="settings" small={true} classOverride="slds-button__icon icon-utility"/>
              </a>
              }
            </div>
          </div>
        </div>
        <div className="slds-grid slds-page-header__detail-row">
          <div className="slds-col--padded slds-size--1-of-4">
            <dl>
              <dt>
                <p className="slds-truncate" title="Field 1">Field 1</p>
              </dt>
              <dd>
                <p className="slds-text-body--regular slds-truncate" title="Description that demonstrates truncation with a long text field">Description that demonstrates truncation with a long text field</p>
              </dd>
            </dl>
          </div>
          <div className="slds-col--padded slds-size--1-of-4">
            <dl>
              <dt>
                <p className="slds-text-heading--label slds-truncate" title="Field2 (3)">Field 2 (3)
                  <button className="slds-button slds-button--icon-bare">
                    <svg aria-hidden="true" className="slds-button__icon slds-button__icon--small">
                      <use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#down"></use>
                    </svg>
                    <span className="slds-assistive-text">More Actions</span>
                  </button>
                </p>
              </dt>
              <dd>
                <p className="slds-text-body--regular">Multiple Values</p>
              </dd>
            </dl>
          </div>
          <div className="slds-col--padded slds-size--1-of-4">
            <dl>
              <dt>
                <p className="slds-text-heading--label slds-truncate" title="Field 3">Field 3</p>
              </dt>
              <dd><a href="#">Hyperlink</a></dd>
            </dl>
          </div>
          <div className="slds-col--padded slds-size--1-of-4">
            <dl>
              <dt>
                <p className="slds-text-heading--label slds-truncate" title="Field 4">Field 4</p>
              </dt>
              <dd>
                <p>
                  <span>Description (2-line truncation—must use JS to t...</span>
                </p>
              </dd>
            </dl>
          </div>
        </div>



      </div>
    );
  }
}
