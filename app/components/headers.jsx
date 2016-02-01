
'use strict;'

import React, {Component} from 'react';
import {Modal, SvgIcon, IconField, Alert, UpdatedBy } from './utils.jsx';
import Router from './router.jsx';

import DynamicForm from '../services/dynamicForm.es6';


export const SectionHeader = ({title, buttons}) => {
  return (
    <div className="slds- col slds-col-- padded slds -size--1-of-1 ">
        <div className="slds-grid form-seperator">
          <div className="slds-col slds-col--padded slds-has-flexi-truncate">
            <h3 className="slds-text-heading--small" style={{marginTop: "8px"}}>{title}</h3>
          </div>
          <div className="slds-col slds-col--padded slds-no-flex slds-align-top" style={{marginBottom: "4px"}}>
            { buttons && buttons.map(function(button, i) { return (
              <Button key={i} definition={button}/>
            );})}
          </div>
        </div>
    </div>
  );
}

export const Button = ({definition}) => {
  let runAction = () => {
    if (definition.hasOwnProperty('then')) {
      definition.action().then(definition.then);
    } else {
      definition.action();
    }
  }
  if (typeof definition.action ===  'function') {
    return (
      <button className="slds-button slds-button--neutral" onClick={runAction}  disabled={definition.disable || false}>{definition.label}</button>
    );
  } else if (typeof definition.action ===  'string') {
    return (
      <a className="slds-button slds-button--neutral" href={definition.action}>{definition.label}</a>
    );
  }
}


export const FormHeader = ({form, buttons, count}) => {
  let df = DynamicForm.instance,
      isformmeta = form == "303030303030303030313030";
  return (

    <div className="slds-page-header "  role="banner">
      <div className="slds-grid">
        <div className="slds-col slds-has-flexi-truncate">

          <div className="slds-media">
            <div className="slds-media__figure">
              <a  href={ Router.URLfor(true, "ListPage", form._id)}>
              <IconField value={form.icon} large={true}/>
              </a>
            </div>

            <div className="slds-media__body">
              <p className="slds-text-heading--label">Record Type</p>
              <div className="slds-grid">
                <h1 className="slds-text-heading--medium slds-m-right--small slds-truncate slds-align-middle">{form.name}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="slds-col slds-no-flex slds-align-bottom">
          <div className="slds-grid">
            { !isformmeta &&
              <div className="slds-button-space-left" aria-haspopup="true">
                <a className="slds-button slds-button--icon-more" href={ Router.URLfor("admin", "RecordPage", "303030303030303030313030", form._id)}>
                  <SvgIcon spriteType="utility" spriteName="settings" small={true} classOverride="slds-button__icon icon-utility"/>
                </a>
              </div>
            }
            { buttons &&
              <div className="slds-button-group">
                { buttons.map(function(button, i) { return (
                  <Button key={i} definition={button}/>
                )})}
              </div>
            }
          </div>
        </div>
      </div>
      <p className="slds-text-body--small slds-m-top--x-small">{count} items, sorted by name</p>
    </div>
  );
}


export class RecordHeader extends Component {
  render() {
    let df = DynamicForm.instance,
        isformmeta = this.props.form == "303030303030303030313030";

    console.log ("Form " + this.props.form.name + ", icon :" + this.props.form.icon);
    return (
      <div className="slds-page-header ">
        <div className="slds-grid">
          <div className="slds-col slds-has-flexi-truncate">

            <div className="slds-media">
              <div className="slds-media__figure">
                <a  href={ Router.URLfor(true, "ListPage", this.props.form._id)}>
                <IconField value={this.props.form.icon} large={true}/>
                </a>
              </div>

              <div className="slds-media__body">
                <p className="slds-text-heading--label">Record Type</p>
                <div className="slds-grid">
                  <h1 className="slds-text-heading--medium slds-m-right--small slds-truncate slds-align-middle">{this.props.form.name}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-col slds-no-flex slds-align-bottom">
            <div className="slds-grid">
              { !isformmeta &&
              <a className="slds-button slds-button--icon-more slds-shrink-none slds-m-left--large" href={ Router.URLfor("admin", "RecordPage", "303030303030303030313030", this.props.form._id)}>
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
                <p className="slds-text-heading--label slds-truncate" title="Field 1">Field 1</p>
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
                    <SvgIcon spriteType="utility" spriteName="down" small={true} classOverride="slds-button__icon icon-utility"/>
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
