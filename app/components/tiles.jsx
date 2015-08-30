'use strict;'

import React, {Component} from 'react';
import { SvgIcon } from './utils.jsx';

import t from 'transducers.js';
const { range, seq, compose, map, filter } = t;

import DynamicForm from '../services/dynamicForm.es6';
import {RecordList} from './dform.jsx';

export class Tile extends Component {

    // This component doesn't hold any state - it simply transforms
    // whatever was passed as attributes into HTML that represents a picture.
    setFilter(id){
        // When the component is clicked, trigger the onClick handler that
        // was passed as an attribute when it was constructed:
        this.props.onTileClick(id);
    }

    render(){
        var meta = this.props.meta,
            boxclass = "small-box " + 'bg-aqua',
            iclass = "ion " + 'ion-stats-bars';

        return (
          <li className="slds-col--padded slds-size--1-of-2 slds-large-size--1-of-4">
            <div className="grid-card">

              <div className="slds-grid slds-grid--align-spread">
                <h3 className="site-text-heading--label-weak-large slds-align-middle">{meta.name} - <small>{meta.type}</small></h3>
                <SvgIcon spriteType="utility" spriteName="add"/>
              </div>

              <hr className="hr hr--pink"/>
              <p>descript this object, it could be anything but need to explain a little</p>
              <div className="slds-button-group">
                <a className="slds-button slds-button--neutral" href={"#RecordList?gid="+meta._id}>list</a>
                <a className="slds-button slds-button--neutral" href={"#Form?gid="+meta._id}>new</a>
              </div>
            </div>
          </li>
        );
    }
}

export class TileList extends Component {
    render () {
        let df = DynamicForm.instance,
            metaview = df.getForm ();
        console.log ('TileList render : ' + metaview.length);
        return (
            <ul className="slds-grid slds-wrap slds-grid--align-left slds-grid--pull-padded-large">
                  {metaview.map(function(row, i) { if (row.type === 'top') return (
                      <Tile key={row._id} meta={row}/>
                  );})}
            </ul>
        )
    }
}
