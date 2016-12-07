'use strict;'

import React, {Component} from 'react';
import { SvgIcon, IconField } from './utils.jsx';

import Router from './router.jsx';

import t from 'transducers.js';
const { range, seq, compose, map, filter } = t;

import DynamicForm from '../services/dynamicForm.js';

export class Tile extends Component {

  // This component doesn't hold any state - it simply transforms
  // whatever was passed as attributes into HTML that represents a picture.
  setFilter(id){
      // When the component is clicked, trigger the onClick handler that
      // was passed as an attribute when it was constructed:
      this.props.onTileClick(id);
  }

  render(){
    let meta = this.props.meta
    return (
      <li className="slds-p-horizontal--small slds-size--xx-small">
        <a href={Router.URLfor(true, "ListPage", meta._id)} className="slds-app-launcher__tile slds-text-link--reset slds-app-launcher__tile--small">
          <div className="slds-app-launcher__tile-figure slds-app-launcher__tile-figure--small">
            <IconField value={meta.icon} large={true}/>
          </div>
          <div className="slds-app-launcher__tile-body slds-app-launcher__tile-body--small">
            <p className="slds-truncate slds-text-link" title={meta.name}>{meta.name}</p>
          </div>
        </a>
      </li>
    );
  }
}

export class AdminTileList extends Component {
  render () {
    let df = DynamicForm.instance,
        metaview = df.getForm (),
        fids = this.props.formids || seq(df.appMeta, compose(filter (x => x.store !== "metadata"), map(x => x._id)));

    console.log ('TileList render : ' + metaview.length);
    return (
      <div className="slds-section slds-is-open" style={{padding: "0.5em"}}>
        <div className="slds-section__title">
          <button className="slds-button slds-button--icon slds-m-right--small">
            <svg aria-hidden="true" className="slds-button__icon">
              <use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#switch"></use>
            </svg>
            <span className="slds-assistive-text">Toggle visibility of section</span>
          </button>
          <h3>All Items</h3>
        </div>
        <div className="slds-section__content">
          <ul className="slds-grid slds-grid--pull-padded slds-wrap">

            {fids.map(function(fid, i) {
                return (
                  <Tile key={i+':'+fid} meta={df.getForm(fid)}/>
            );})}

          </ul>
        </div>
      </div>
    )
  }
}
