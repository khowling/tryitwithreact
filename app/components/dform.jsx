'use strict;'

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';
import jexl from 'jexl';
import Router from './router.jsx';
import {Field} from './dform_fields.jsx';
import {RecordHeader, FormHeader} from './headers.jsx';
import {Modal, SvgIcon, IconField, Alert, UpdatedBy } from './utils.jsx';
import t from 'transducers.js';
const { range, seq, compose, map, filter } = t;
import DynamicForm from '../services/dynamicForm.es6';
import async from '../../shared/async.es6';

/*****************************************************************************
  ** Called from Form Route (top), or within List (embedded),
  ** Responsibilities: Render form fields, save record, delete record
  ***************************************************************************/
export class FormMain extends Component {
  constructor(props) {
    super(props);
    this.state =  {
      edit: props.crud == "c" || props.crud == "u",
      manageData: false,
      changedata:  props.crud == "c" && props.value.record || {}, // keep all data changes in the state
      errors: null};
    console.log ('FormMain constructor setState : ' + JSON.stringify(this.state));
  }

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = false;
    if (nextProps.value != this.props.value ||
        nextState.formcontrol && nextState.formcontrol.change) {
        shouldUpdate =  true;
    }
    console.log ("FormMain shouldComponentUpdate (only if props.value or state.formcontrol changes) : " + shouldUpdate);
    return shouldUpdate;
  }

  // form control - visibility and validity
  // TODO : Needs to be MUCH better, not calling eval many times!
  _formControlState(edit, fields, val, currentState) {

    return async(function *(edit, fields, val, currentState) {
      //console.log ("FormMain _formControlState currentState : " + JSON.stringify(currentState));
      let cnrt = {flds:{},invalid: false, change: currentState && false || true};

      for (let fld of fields.filter(f => f.type !== 'childform' && f.type !== 'relatedlist')) {

        let visible = {val: true};
        //console.log (`field ${fld.name}, show_when ${fld.show_when}, val ${JSON.stringify(val)}`);
        if (fld.show_when)
          visible = yield jexl.eval(fld.show_when, {rec: val, appMeta: DynamicForm.instance.appMeta});

        let fctrl = {
          invalid: edit && fld.required && !val[fld.name],
          visible: visible,
          dynamic_fields: null
        };

        if (fld.type === 'dynamic') {
          //console.log ('eval dynamic_fields')
          fctrl.dynamic_fields = yield jexl.eval(fld.fieldmeta_el, {rec: val, appMeta: DynamicForm.instance.appMeta}) || [];
          //console.log (`eval dynamic_fields ${fld.fieldmeta_el}, res: ${fctrl.dynamic_fields}`);
        }

        //console.log (`fctrl ${fld.name}, show_when ${JSON.stringify(fctrl)}`);
        // check to see if form control state has changed from last time, if so, it will re-render the whole form!
        if (currentState && currentState.flds[fld.name]) {
          if (!Object.is(currentState.flds[fld.name].invalid, fctrl.invalid) ||
              !Object.is(currentState.flds[fld.name].visible, fctrl.visible) ||
              !Object.is(currentState.flds[fld.name].dynamic_fields, fctrl.dynamic_fields))
                cnrt.change = true;
        } else if (fctrl.invalid || !fctrl.visible) {
          // no current state, so much be change
          cnrt.change = true;
        }

        if (fctrl.invalid) cnrt.invalid = true;
        cnrt.flds[fld.name] = fctrl;
      }
      //console.log ("FormMain _formControlState result : " + JSON.stringify(cnrt));
      return cnrt;
    })(edit, fields, val, currentState);
  }

  componentWillMount() {
    this._formControlState (this.state.edit, this.props.form.fields, this.props.value.record).then(succval => {
      this.setState ({
        formcontrol: succval
      });
    });
  }
  // form data is ready from parent
  componentWillReceiveProps (nextProps) {
    console.log ("FormMain componentWillReceiveProps");
    if (nextProps.value) {
      this._formControlState (this.state.edit, this.props.form.fields, nextProps.value.record).then(succval => {
        this.setState ({
          changedata: {}, // wipe out any changes???
          formcontrol: succval,
          manageData: false, // ensure the inline modal closes when parent updates from save
        });
      });
    }
  }

  // Called form the Field
  _fieldChange(dynamicFieldName, d) {
    console.log (`--------- FormMain _fieldChange got field update, [${dynamicFieldName}] ${JSON.stringify(d)}`);
    if (dynamicFieldName) {
      //d = {[dynamicFieldName]: Object.assign({}, this.props.value.record[dynamicFieldName], d)};
      d = {[dynamicFieldName]: Object.assign(this.state.changedata[dynamicFieldName] || {}, d)};
    }

    let changedata = Object.assign({}, this.state.changedata, d);
    console.log (`--------- FormMain _fieldChange full changedata ${JSON.stringify(changedata)}`);
    this._formControlState (this.state.edit, this.props.form.fields, Object.assign({}, this.props.value.record , changedata), this.state.formcontrol).then(succval => {
      this.setState({
        changedata: changedata,
        formcontrol: succval
      });
    });
  }

  _save(succfn) {
    let self = this,
        df = DynamicForm.instance,
        body =  this.props.value.record._id && Object.assign({_id: this.props.value.record._id}, this.state.changedata) || this.state.changedata;
/*
    // if its a childform - add parent details to the save for mongo & nav back to parent
    if (this.props.parent) {
      let {view, recordid, field} = this.props.parent;
      saveopt.parent = {
        form_id: view,
        query: {_id: recordid},
        field_id: field
      };
    }
    console.log ('FormMain _save : '+ JSON.stringify(saveopt));
*/
    df.save (this.props.form._id, body, this.props.parent).then(succval => {
      console.log ('FormMain _save, response from server : ' + JSON.stringify(succval));
      return succfn (succval);
    }, errval => {
        self.setState({formcontrol: Object.assign (this.state.formcontrol, {serverError: JSON.stringify(errval), change: true })});
    });
  }

  _delete(succfn) {
    if (window.confirm("Sure?")) {
      var self = this,
          df = DynamicForm.instance;

      /*
          saveopt = {
            form: this.props.form._id,
            id: this.props.value.record._id
          };

      if (this.props.parent) {
        let {view, recordid, field} = this.props.parent;
        saveopt.parent = {
          form_id: view,
          query: {_id: recordid},
          field_id: field
        };
      }

      console.log ('FormMain _delete : '+ JSON.stringify(saveopt));
      */
      df.delete (this.props.form._id, this.props.value.record._id, this.props.parent).then(succval => {
        return succfn (succval);
      });
    }
  }

  /************************/
  /*  manage inline data  */
  /************************/
  _manageData() {
    this.setState({manageData: true,  inlineData:  this.props.value.record._data || []});
  }

  _inlineDataChange(val) {
    console.log ("FormMain: _inlineDataChange : got update from List : " + JSON.stringify(val));
    if ('data' in val) {
      this._saveInlineData = val.data;
    }
    if ('disableSave' in val) {
      this.setState({inlineDataDisbleSave: val.disableSave});
    }
  }
  _inlineDataFinished(save) {
    let updateState = {changedata: {}, manageData: false,  inlineData: null, serverError: null};
    if (save) {
      let df = DynamicForm.instance;
      df.save (this.props.form._id, Object.assign({_id: this.props.value.record._id}, {"_data": this._saveInlineData})).then(succval => {
        console.log ('FormMain _save, response from server : ' + JSON.stringify(succval));
        if (this.props.onDataChange) {
          // this will re-load the data at the parent, and in turn send new props
          this.props.onDataChange();
        }
      }, errval => {
        this.setState({serverError: JSON.stringify(errval)});
      });
    } else {
      this.setState(updateState);
    }
  }

  render() {

    let self = this,
        edit = this.state.edit,
        {state, record} = this.props.value,
        offerdata = !edit && this.props.form._id == "303030303030303030313030" && record.store === "metadata",
        formcontrol = this.state.formcontrol;


    let headerButtons  = {}, saveButton, cancelButton;
    if (this.props.onComplete) {
      cancelButton = () => this.props.onComplete(null);
      //notify parent screen
      if (edit) {
        // form in edit mode
        saveButton = this._save.bind(this, succval => {
          this.props.onComplete({_id: succval._id}); // , search_ref: this.state.changedata});
        });
      } else {
        headerButtons.cancelButton = cancelButton;
        headerButtons.editButton = () =>  this.setState ({edit: true});
        headerButtons.deleteButton= this._delete.bind(this,  () =>  self.props.onFinished('delete', succVal));
      }
    } else {
      if (edit) {
        cancelButton = () => Router.navTo(true, record._id && "RecordPage" || "ListPage", this.props.form._id, record._id && record._id || null, null, true);
        saveButton = this._save.bind(this, succval => {
          Router.navTo(true, "RecordPage", this.props.form._id, succval._id, false, true);
        });
      } else {
        headerButtons.deleteButton = this._delete.bind(this, () =>   Router.navTo(true, "ListPage", this.props.form._id));
        headerButtons.editButton = () => Router.navTo(true,"RecordPage", this.props.form._id, record._id, {e: true});
      }
    }

    let getFieldDOM = (key, field, value, edit, fc, dynamicFieldName) => {
      console.log (`getFieldDOM ${field.name}`);
      return (
        <div key={key} className="slds-col slds-col--padded slds-size--1-of-2 slds-medium-size--1-of-2 slds-x-small-size--1-of-1">
          <div className={"slds-form-element " + (edit && "  " || " field-seperator ") + (field.required && " slds-is-required" || "") + (fc.invalid && " slds-has-error" || "")}>
              <label className="slds-form-element__label form-element__label--small">{field.title}</label>
              <div className="slds-form-element__control"  style={{marginLeft: edit && '0' || "15px"}}>
                <span className={(edit || field.type =="dropdown_options") && " " || " slds-form-element__static"}>
                    { (!edit && offerdata && field.name === "store") &&
                     <button className="slds-button slds-button--neutral slds-button--brand" onClick={self._manageData.bind(self)}>edit data ({record._data.length})</button>
                    ||
                    <Field fielddef={field} value={value} edit={edit} onChange={self._fieldChange.bind(self, dynamicFieldName)}/>
                    }
                </span>
              </div>
          </div>
        </div>
      );
    }

    console.log (`FormMain render ${this.props.form.name} `); //, state : ' + JSON.stringify(this.state));
    return (
      <div className={this.props.inModal && "slds-modal__container w95"} >

        <div style={{padding: "0.5em", background: "white"}}>
          { React.createElement (SectionHeader, Object.assign ({title: this.props.form.name}, headerButtons)) }
        </div>

        <div className={this.props.inModal && "slds-modal__content" || "" + " slds-form--stacked"} style={{padding: "0.5em", minHeight: this.props.inModal && "400px" || "auto"}}>
          <div className="slds-grid slds-wrap">

            { formcontrol && this.props.form.fields.map(function(field, i) {
              if (field.type !== 'childform' && field.type !== 'relatedlist' && field.type !== 'dynamic') {
                let fc = formcontrol.flds[field.name] || {visible: {val: true}, invalid: false};
                if (fc.visible.error)
                  return (<Alert message={`dynamic field expression error ${dflds.error}`}/>);
                else if (fc.visible) return getFieldDOM(i, field, record[field.name], edit, fc);
              } else if (field.type === 'dynamic') {
                let dflds = formcontrol.flds[field.name].dynamic_fields;
                console.log (`dynamic field ${field.name}, dflds : ${JSON.stringify(dflds)}`);
                if (dflds) {
                  if (dflds.error)
                    return (<Alert message={`dynamic field expression error ${dflds.error}`}/>);
                  else if (dflds)
                    return dflds.map(function(dfield, i) {
                      let fc = {visible: {val: true}, invalid: false};
                      if (fc.visible) return  getFieldDOM(i, dfield, record[field.name] && record[field.name][dfield.name], edit, fc, field.name);
                    })
                }
              }
            })}

            {(record._updatedBy && !edit) &&
              <div  className="slds-col slds-col--padded slds-size--2-of-2 slds-medium-size--2-of-2 slds-x-small-size--1-of-1">
                <div className="slds-form-element field-seperator ">
                  <label className="slds-form-element__label form-element__label--small">Last Updated</label>
                  <div className="slds-form-element__control"  style={{marginLeft: "15px"}}>
                    <UpdatedBy user={record._updatedBy} date={record._updateDate}/>
                  </div>
                </div>
              </div>
            }

            { this.state.formcontrol && this.state.formcontrol.serverError &&
              <div className="slds-col slds-col--padded slds-size--1-of-1"  style={{marginTop: "15px"}}>
                <Alert type="error" message={this.state.formcontrol.serverError}/>
              </div>
            }

            { this.state.manageData &&
              <Modal>
                <div className="slds-modal__container w95">
                  <div style={{padding: "0.5em", background: "white"}}>
                    <SectionHeader title={this.props.value.record.name} saveButton={this._inlineDataFinished.bind(this, true)} saveButtonDisable={this.state.inlineDataDisbleSave} cancelButton={this._inlineDataFinished.bind(this, null)}/>
                  </div>
                  <div className="slds-modal__content" style={{padding: "0.5em", minHeight: "400px"}}>
                    <ListMain inline={true} form={this.props.value.record} value={{status: "ready", records: this.state.inlineData}}  onDataChange={this._inlineDataChange.bind(this)}/>
                    { this.state.serverError  &&
                      <div className="slds-col slds-col--padded slds-size--1-of-1"  style={{marginTop: "15px"}}>
                        <Alert type="error" message={this.state.serverError}/>
                      </div>
                    }
                  </div>
                  <div className="slds-modal__footer"></div>
                </div>
              </Modal>
            }

          </div>
        </div>

        <div className={this.props.inModal && "slds-modal__footer" || "slds-col slds-col--padded slds-size--1-of-1"} style={{padding: "0.5em", textAlign: "right"}}>
          { edit &&
              <button className="slds-button slds-button--neutral" onClick={cancelButton}>Cancel</button>
          }
          { edit &&
              <button className="slds-button slds-button--neutral slds-button--brand" onClick={saveButton}>Save</button>
          }
        </div>

      </div>
    );
  }
}
FormMain.propTypes = {
  // Core
  crud: React.PropTypes.string.isRequired,
  view: React.PropTypes.shape({
    store: React.PropTypes.string.isRequired,
    fields: React.PropTypes.array.isRequired
  }),
  value: React.PropTypes.shape({
    status: React.PropTypes.string.isRequired,
    record: React.PropTypes.object
  }),
  // used by childform
  parent: React.PropTypes.shape({
    form_id: React.PropTypes.string.isRequired,
    field_id: React.PropTypes.string.isRequired,
    record_id: React.PropTypes.string
  }),
  // used by lookup and childform (if no onComplete, assume top)
  onComplete: React.PropTypes.func,
  inModal: React.PropTypes.bool
};
FormMain.defaultProps = { inModal: false};

// RecordList - list of records, supports inline editing of embedded docs.
export class ListPage extends Component {

    constructor(props) {
      super(props);
      let df = DynamicForm.instance;
      this.state = {
        metaview: df.getForm (props.form._id),
        value: {status: "wait", records: []}
      };
      console.log ('ListPage constructor: '+ props.form._id);
    }

    componentDidMount() {
      this._dataChanged();
    }

    _dataChanged() {
      let df = DynamicForm.instance;
      console.log ('ListPage componentDidMount, running query : ' + JSON.stringify(this.props.form._id));
      if (this.state.metaview.store === "mongo")
        df.query (this.props.form._id, this.props.query && JSON.parse(this.props.query) || {}).then(
          succRes => this.setState({value: {status: "ready", records: succRes}}),
          errRes  => this.setState({value: {status: "error", message: errRes }})
        );
      else if (this.state.metaview.store === "rest")
        df._callServer(this.state.metaview.url).then(succRes =>
          this.setState({value: {status: "ready", records: succRes}})
        );
    }

    render() {
      return (
        <div className="slds-grid slds-wrap">
          <div className="slds-col slds-size--1-of-1">
          { <FormHeader form={this.state.metaview}/>
          }
          </div>
          { this.state.value.status === "error" &&
            <div className="slds-col slds-size--1-of-1">
              <Alert message={this.state.value.message}/>
            </div>
          }
          { this.state.value.status != "error" &&
          <div className="slds-col slds-size--1-of-1">
            <ListMain value={this.state.value} form={this.state.metaview} onDataChange={this._dataChanged.bind(this)}/>
          </div>
          }
        </div>
      );
    }
}
/*ListPage.propTypes = {
  // Core
  urlparam: React.PropTypes.shape({
    view: React.PropTypes.string.isRequired,
    q: React.PropTypes.object
  })
}*/

export class ListMain extends Component {
  constructor(props) {
    super(props);
    console.log ('ListMain InitialState : ' + JSON.stringify(props.value));
    this.state = {
      inline: {enabled: props.inline, editidx: null, editval: {}},
      inlineData: props.inline && props.value,  // inline data is locally mutable, so save in state
      editrow: false,
    };
  }

  _ActionDelete (rowidx) {
    let row = this.props.value.records[rowidx];
    if (window.confirm("Sure?")) {
      let df = DynamicForm.instance;
      /*
          saveopt = {
            form: this.props.form._id,
            id: row._id
          };
      if (this.props.parent) {
        let {view, recordid, field} = this.props.parent;
        saveopt.parent = {
          parentid: recordid,
          query: {_id: recordid},
          parentfieldid: field
        };
      }
      console.log ('ListMain _delete : '+ JSON.stringify(saveopt));
      */
      df.delete (this.props.form._id, row._id, this.props.parent).then(succVal => {
        if (this.props.onDataChange) {
          // this will re-load the data at the parent, and in turn send new props
          this.props.onDataChange();
        }
      });
    }
  }

  _ActionEdit (rowidx, view = false) {
    let records = this.props.value.records;
    console.log ("ListMain _ActionEdit rowidx :" + rowidx + ", view : " + view);
    if (this.props.parent)
      if (rowidx >= 0)
        this.setState({editrow: {value: {status: "ready", record: records[rowidx]}, crud: view && "r" || "u"}});
      else
        this.setState({editrow: {value: {status: "ready", record: {}}, crud: "c"}});
    else
      Router.navTo(true, "RecordPage", this.props.form._id, rowidx >= 0 && records[rowidx]._id,  !view && {"e": true} || {});
  }

  /***************/
  /** inline  ****/
  _inLinefieldChange(val) {
    console.log ("ListMain _inLinefieldChange : " + JSON.stringify(val));
    this.setState({inline: Object.assign(this.state.inline, {editval: Object.assign(this.state.inline.editval, val)})});
  }
  _inLineDelete(rowidx) {
    let newarray = this.state.inlineData.records.slice(0);
    newarray.splice(rowidx, 1);
    console.log ("ListMain _delete rowidx:" + rowidx + ", result : " + JSON.stringify(newarray));
    this.setState({inlineData: {status: "ready", records: newarray}, inline: {enabled: true, editidx: null, editval: {}, currentval: null}}, () => {
      if (this.props.onDataChange) {
        this.props.onDataChange(newarray);
      }});
  }
  _inLineEdit(rowidx) {
    let records = this.state.inlineData.records;
    if (rowidx >= 0)
      this.setState({inline: Object.assign(this.state.inline, {editidx: rowidx, currentval: records[rowidx]})}, () =>
        this.props.onDataChange({disableSave : true}));
    else {
      let newarray = records && records.slice(0) || [];
      newarray.push({});
      this.setState({inlineData: {status: "ready", records: newarray}, inline: Object.assign(this.state.inline, {editidx: newarray.length-1, currentval: null})}, () =>
        this.props.onDataChange({disableSave : true}));
    }
  }
  _inLineSave(saveit) {
    console.log ("ListMain _inLineSave : saveit:"+saveit+" ["+ this.state.inline.editidx + "] : " + JSON.stringify(this.state.inline.editval));
    if (saveit) {
      let newarray = this.state.inlineData.records.slice(0);
      if (this.state.inline.currentval) {
        // edit existing val, so join the current val with the changes to get the full record
        newarray[this.state.inline.editidx] = Object.assign(this.state.inline.currentval, this.state.inline.editval);
      } else {
        newarray[this.state.inline.editidx] = this.state.inline.editval;
      }
      console.log ("ListMain _inLineSave : inform parent of new data, newarray:" +JSON.stringify(newarray));
      this.setState({inlineData: {status: "ready", records: newarray}, inline: {enabled: true, editidx: null, editval: {}, currentval: null}}, () => {
        if (this.props.onDataChange) {
          this.props.onDataChange({data: newarray, disableSave: false});
        }});
      } else {
        //we are cancelling.
        let newarray;
        if (this.state.inline.currentval) {
          // its a existing row so do nothing
          this.setState({inline: {enabled: true, editidx: null, editval: {}, currentval: null}}, () =>
            this.props.onDataChange({disableSave: false}));
        } else {
          // its a new row, so delete it!
          this._ActionDelete(this.state.inline.editidx);
        }
      }
  }


  _onFinished (val) {
    console.log ('ListMain _onFinished() ' + JSON.stringify(val));
    if (val) {
      if (this.props.onDataChange) {
        // this will re-load the data at the parent, and in turn send new props
        this.props.onDataChange();
      }
    } else {
      console.log ("ListMain _formDone() no data, must be cancel");
      this.setState ({editrow: false});
    }
  }

  componentWillReceiveProps (nextProps) {
    console.log ("ListMain componentWillReceiveProps");
    if (nextProps.value) {
      this.setState ({editrow: false});
    }
  }

  // When used to select from a list
  _handleSelect(id) {
    this.props.selected(id);
  }

  render() {
    console.log ('ListMain render, inline: ' + JSON.stringify(this.state.inline) + ", editrow: " + JSON.stringify(this.state.editrow));
    let self = this,
        {status, records} = this.state.inline && this.state.inlineData || this.props.value,
        nonchildformfields = this.props.form.fields.filter(m => m.type !== 'childform' && m.type !== 'dropdown_options' && m.type !== 'relatedlist' && m.type !== 'dynamic');

    let header = React.createElement (SectionHeader, Object.assign ({key: +this.props.form._id, title: this.props.title || this.props.form.name}, this.props.selected && {
          closeButton: this._handleSelect.bind(this, null)
        } || {
          newButton: this._ActionEdit.bind(this, -1, false)
        }));

    return (
      <div className="">
          { !self.state.inline.enabled && header }
          <div className="box-body table-responsive no-padding">
            <div className="slds-scrollable--x">
              <table className="slds-table slds-table--bordered">
                <thead>
                  <tr className="slds-text-heading--label">
                    { !self.props.viewonly &&
                    <th className="slds-row-select" scope="col">
                      { self.state.inline.enabled &&
                      <span className="slds-truncate">
                        <a onClick={this._inLineEdit.bind(this, -1)} style={{marginRight: "5px"}}>
                          <SvgIcon spriteType="utility" spriteName="new" small={true}/>
                        </a>add
                      </span>
                      ||
                      <span className="slds-truncate">del edit</span>
                      }
                    </th>
                    }
                    {nonchildformfields.map(function(field, i) { return (
                      <th key={i} scope="col">
                        <span  className="slds-truncate">{field.title}</span>
                      </th>
                    );})}
                  </tr>
                </thead>
                <tbody>
                  { records && records.map(function(row, i) { return (
                    <tr key={i} className="slds-hint-parent">
                        { !self.props.viewonly &&
                        <td className="slds-row-select">

                          { self.props.selected &&
                            <button className="slds-button slds-button--brand" onClick={self._handleSelect.bind(self,row._id)}>select </button>
                          ||  self.state.inline.editidx == i &&
                            <div className="slds-button-group">
                              <button className="slds-button slds-button--brand" onClick={self._inLineSave.bind(self, true)}>save </button>
                              <button className="slds-button slds-button--brand" onClick={self._inLineSave.bind(self, false)}>cancel </button>
                            </div>
                          || self.state.inline.enabled &&
                            <div className="slds-button-group">
                              <a onClick={self._inLineDelete.bind(self, i)} style={{marginRight: "15px"}}><SvgIcon spriteType="utility" spriteName="clear" small={true}/>  </a>
                              <a onClick={self._inLineEdit.bind(self, i, false)} disabled={self.state.inline.editidx} ><SvgIcon spriteType="utility" spriteName="edit" small={true}/>  </a>
                           </div>
                          ||
                             <div className="slds-button-group">
                               <a onClick={self._ActionDelete.bind(self, i)} style={{marginRight: "15px"}}><SvgIcon spriteType="utility" spriteName="clear" small={true}/>  </a>
                               <a onClick={self._ActionEdit.bind(self, i, false)} ><SvgIcon spriteType="utility" spriteName="edit" small={true}/>  </a>
                            </div>
                          }

                        </td>
                        }
                        {nonchildformfields.map(function(field, fidx) {
                            let listfield =  <Field fielddef={field} value={row[field.name]} edit={i == self.state.inline.editidx} onChange={self._inLinefieldChange.bind(self)} inlist={true}/>;
                            if (field.name === "name" && !self.state.inline.enabled) {
                              if (self.props.parent )
                                return (
                                <td key={fidx}><a style={{color: "#0070d2", cursor: "pointer"}} onClick={self._ActionEdit.bind(self, i, true)}>{listfield}</a></td>);
                              else
                                return (
                                <td key={fidx}><a href={Router.URLfor(true, "RecordPage", self.props.form._id, row._id)}>{listfield}</a></td>);
                            } else {
                              return (<td key={fidx}>{listfield}</td>);
                            }
                        })}
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </div>
          { this.state.editrow &&
            <Modal>
                <FormMain  value={this.state.editrow.value} form={this.props.form} crud={this.state.editrow.crud} parent={this.props.parent} onComplete={this._onFinished.bind(this)} inModal={true}/>
            </Modal>
          }
      </div>
    )
  }
}
ListMain.propTypes = {
  // Core
  view: React.PropTypes.shape({
    store: React.PropTypes.string.isRequired,
    fields: React.PropTypes.array.isRequired
  }),
  value: React.PropTypes.shape({
    status: React.PropTypes.string.isRequired,
    records: React.PropTypes.array.isRequired
  }),
  // used by childform, to inform data operations
  parent: React.PropTypes.shape({
    form_id: React.PropTypes.string.isRequired,
    field_id: React.PropTypes.string.isRequired,
    record_id: React.PropTypes.string
  }),
  // used by inline edit dropdown, and child forms to inform parent component of data change (parent handles that event)
  onDataChange: React.PropTypes.func,
  //used by select picture, when user need to select a item from a list, _id of the item is returned.
  selected: React.PropTypes.func,
  // disable actions
  viewonly: React.PropTypes.bool
};
ListMain.defaultProps = { value: {status: "waiting", records: []}, viewonly: false };

// Top level Form, with FormMan & Related Lists. (called from Router - props much reflect URL params)
export class RecordPage extends Component {

  constructor(props) {
    super(props);

    let df = DynamicForm.instance,
//          metaview = df.getForm (props.urlparam.view);
        metaview = df.getForm (props.form._id);
    console.log ('RecordPage constructor props: ' + JSON.stringify(props));
    this.state = {
      //crud: !props.urlparam.id && "c" || props.urlparam.e && "u" || "r",
      crud: !this.props.xid && "c" || (props.e) &&  "u" || "r",
      metaview: metaview,
      childformfields: metaview.fields.filter(m => m.type === 'childform'),
      relatedlistfields: metaview.fields.filter(m => m.type === 'relatedlist'),
      value: {status: "wait", record: {}}
    };
    console.log ('RecordPage constructor setState : ' + JSON.stringify(this.state));
  }

  componentDidMount() {
    this._dataChanged();
  }

  _dataChanged() {
    console.log ('RecordPage _dataChanged');
    let df = DynamicForm.instance;
    if (this.state.crud == 'u' || this.state.crud == 'r') {
      if (this.state.metaview.collection) {
        //df.get (this.state.metaview._id, this.props.urlparam.id).then(succVal => {
        var exp_st = `${this.props.xid}|get("${this.state.metaview.name}")`;
        console.log (`RecordPage _dataChanged jexl : ${exp_st}`);
        jexl.eval(exp_st, {user: df.user, app: df.app, appUserData: df.appUserData}).then(succVal => {
            this.setState({ value: {status: "ready", record: succVal}});
        }, errval => {
          console.log ('RecordPage _dataChanged jexl error ' + errval);
          this.setState({ value: {status: "error", message: `${errval}`}});
        });
      } else if (this.state.metaview.url)
        df._callServer(this.state.metaview.url+"?_id="+this.props.urlparam.id).then(succRes =>
          this.setState({value: {status: "ready", record: succRes}})
        );
    }
  }

  _importMeta() {
    let df = DynamicForm.instance,
        p,
        appmeta = this.state.value.record;

    for (let meta of appmeta.metadata) {
      if (!p) {
        p = df.save ({form: meta.form._id, body: meta.load});
      } else {
        p = p.then(() => {
          // some progress update
          df.save ({form: meta.form._id, body: meta.load});
        });
      }
    }
    if (p) {
      // some progress update
      p.then (() => {
        console.log ('ok');
        // all done!!
      });
    }
  }

  render() {
    let df = DynamicForm.instance,
        self = this,
        {status, record} = this.state.value;

    console.log ("Form: rendering state: "); // + JSON.stringify(this.state.value));
  /* Removed prop from FormMain - parent={this.props.urlparam.parent}  - will never happen?? */
    return (
        <div className="slds-grid slds-wrap">
            <div className="slds-col slds-size--1-of-1">
              { <RecordHeader form={this.state.metaview}/>
              }
            </div>

          { this.state.value.status === "error" &&
            <div className="slds-col slds-size--1-of-1">
              <Alert message={this.state.value.message}/>
            </div>
          }
          { this.state.value.status !== "error" &&
            <div className="slds-col slds-size--1-of-1 slds-medium-size--1-of-2">
                <FormMain key={this.state.metaview._id} value={this.state.value} form={this.state.metaview}  crud={this.state.crud} onDataChange={self._dataChanged.bind(self)}/>
            </div>
          }
          { this.state.value.status !== "error" &&
            <div className="slds-col slds-size--1-of-1 slds-medium-size--1-of-2">
              {this.state.crud === "r"  && this.state.childformfields.map(function(field, i) {
                let cform = field.child_form && df.getForm(field.child_form._id);
                if (cform) return (
                  <div key={`${cform._id}${i}`} style={{padding: "0.5em"}}>
                    <ListMain title={field.title} parent={{form_id: self.state.metaview._id, record_id: status == 'ready' && record._id || "new", field_id: field._id }} form={cform} value={{status: status, records: status === "ready" && record[field.name] || []}} onDataChange={self._dataChanged.bind(self)}/>
                  </div>
                  );
                else return (
                  <Alert key={`err${field.name}`} message={`RecordPage: no childform found in application : ${field.name}`}/>
                );})}
            </div>
          }
          { this.state.value.status !== "error" &&
            <div className="slds-col slds-size--1-of-1 slds-medium-size--1-of-2">
              {this.state.crud === "r"  && this.state.value.status === "ready" && this.state.relatedlistfields.map(function(field, i) {
                return (
                <div key={`${field.child_form._id}${i}`} style={{padding: "0.5em"}}>
                  <ListPage  urlparam={{view: field.child_form._id, q: {[field.name]: record._id}}} />
                </div>
              );})}
            </div>
          }

        </div>
      );
    }
}


export class SectionHeader extends Component {
  render() {
    return (
      <div className="slds- col slds-col-- padded slds -size--1-of-1 ">
          <div className="slds-grid form-seperator">
            <div className="slds-col slds-col--padded slds-has-flexi-truncate">
              <h3 className="slds-text-heading--small" style={{marginTop: "8px"}}>{this.props.title}</h3>
            </div>
            <div className="slds-col slds-col--padded slds-no-flex slds-align-top" style={{marginBottom: "4px"}}>

              { typeof this.props.deleteButton !== "undefined" &&
              <button onClick={this.props.deleteButton}  className="slds-button slds-button--small slds-button--neutral" >
                delete
              </button>
              }
              { typeof this.props.newButton !== "undefined" &&
              <button onClick={this.props.newButton}  className="slds-button slds-button--small slds-button--brand" >
                new
              </button>
              }
              { typeof this.props.editButton !== "undefined" &&
              <button onClick={this.props.editButton}  className="slds-button slds-button--small slds-button--brand" >
                edit
              </button>
              }
              { typeof this.props.cancelButton !== "undefined" &&
              <button onClick={this.props.cancelButton}  className="slds-button slds-button--small slds-button--brand" >
                cancel
              </button>
              }
              { typeof this.props.saveButton !== "undefined" &&
              <button onClick={this.props.saveButton}  disabled={this.props.saveButtonDisable} className="slds-button slds-button--small slds-button--brand" >
                save
              </button>
              }
              { typeof this.props.closeButton !== "undefined" &&
              <button onClick={this.props.closeButton}  className="slds-button slds-button--small slds-button--brand" >
                close
              </button>
              }
            </div>
          </div>
      </div>
    );
  }
}
SectionHeader.propTypes = {
  saveButtonDisable: React.PropTypes.bool
};
SectionHeader.defaultProps = { saveButtonDisable: false };
