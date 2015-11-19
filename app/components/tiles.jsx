'use strict;'

import React, {Component} from 'react';
import { SvgIcon, IconField } from './utils.jsx';

import Router from './router.jsx';

import t from 'transducers.js';
const { range, seq, compose, map, filter } = t;

import DynamicForm from '../services/dynamicForm.es6';

export class Tile extends Component {

    // This component doesn't hold any state - it simply transforms
    // whatever was passed as attributes into HTML that represents a picture.
    setFilter(id){
        // When the component is clicked, trigger the onClick handler that
        // was passed as an attribute when it was constructed:
        this.props.onTileClick(id);
    }

    render(){
        let meta = this.props.meta,
            boxclass = "small-box " + 'bg-aqua',
            iclass = "ion " + 'ion-stats-bars';

        return (

          <div className="slds-media slds-tile">
            <div className="slds-media__figure">
              <IconField value={meta.icon} />
            </div>
            <div className="slds-media__body">
              <p className="slds-tile__title slds-truncate"><a href={Router.URLfor(true, "ListPage", meta._id)}>{meta.name}</a></p>
              <div className="slds-tile__detail slds-text-body--small">
                <p className="slds-truncate">26 Records</p>
              </div>
            </div>
          </div>


        );
    }
}

export class AdminTileList extends Component {
    render () {
        let df = DynamicForm.instance,
            metaview = df.getForm (),
            fids = this.props.formids || seq(df.appMeta, map(x => x._id));

        console.log ('TileList render : ' + metaview.length);
        return (
          <div className="grid-card">
            <ul className="slds-list--vertical slds-has-cards">
                  {fids.map(function(fid, i) {
                    return (
                      <Tile key={fid} meta={df.getForm(fid)}/>
                  );})}
            </ul>
          </div>
        )
    }
}
