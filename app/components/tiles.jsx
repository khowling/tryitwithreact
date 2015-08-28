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
        var tdata = this.props.meta,
            boxclass = "small-box " + 'bg-aqua',
            iclass = "ion " + 'ion-stats-bars';

        return (

          <li className="slds-col--padded slds-size--1-of-2 slds-large-size--1-of-4">
            <div className="grid-card">

              <div className="slds-grid slds-grid--align-spread">
                <h3 className="site-text-heading--label-weak-large slds-align-middle" id="downloads-header">{tdata.name}</h3>
                <SvgIcon spriteType="utility" spriteName="add"/>
              </div>

              <hr className="hr hr--pink"/>
              <p>descript this object, it could be anything but need to explain a little</p>
              <a className="slds-button slds-button--neutral slds-m-top--large" href={"#RecordList?gid="+tdata._id} onClick={this.props.navTo}>Open</a>
            </div>
          </li>
        );
    }
}

export class TileList extends Component {

    constructor(){
      super();
      console.log ('TileList InitialState : ');
      this.state = { breadcrumbs: []};
    }
    componentWillReceiveProps (nextProps) {
        let cbc = this.state.breadcrumbst;
        console.log ('TileList componentWillReceiveProps : ' + nextProps.meta);

    }

    // The statics object allows you to define static methods that can be called on the component class
    componentDidMount(){
        console.log ('TileList componentDidMount : ');
        //self.setState({  loading: false, tiles: i.records});
    }

    handleNavClick (cflt) {
        let cbc = this.state.breadcrumbs,
            new_state = {filter: cflt};

        console.log ('TileList history ['+ cbc +'] handleNavClick : ' + cflt);
        if  (cflt == null) {
            new_state.breadcrumbs = [];
        } else {
            var foundit = false,
                inhistory = seq(cbc, filter(function(x) {
                    if (foundit == false && x.id == cflt) {
                        foundit = true; return foundit;
                    } else return !foundit}));
            if (foundit) {
                new_state.breadcrumbs = inhistory;
            }
            else {
                let newname = seq(this.state.tiles,
                    compose(
                        filter(x => x.Id == cflt),
                        map(x => x.Name)
                    ))[0]
                new_state.breadcrumbs = this.state.breadcrumbs.concat({id: cflt, name: newname});
            }
        }
        console.log ('TileList handleNavClick, setState : ' + new_state);
        this.setState(new_state);
    }

    render () {
        let df = DynamicForm.instance,
        metaview = df.getForm ();
        //let cflt = this.state.filter; // this.getParams().flt;
        console.log ('TileList render : ' + metaview.length);

        return (
            <ul className="slds-grid slds-wrap slds-grid--align-spread slds-grid--pull-padded-large">

                  {metaview.map(function(row, i) { return (
                      <Tile key={row._id} meta={row}/>
                  );})}

            </ul>
        )
    }
}
