'use strict;'

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';

import Router from './router.jsx';

import ProgressBar from 'progressbar.js'
import { SvgIcon } from './utils.jsx';
import t from 'transducers.js';
const { range, seq, compose, map, filter } = t;
import DynamicForm from '../services/dynamicForm.es6';

/*
export class ChildForm extends Component {
  render() {
    console.log ('ChildForm render fields: ' +
        JSON.stringify(seq(this.props.form.fields, map(x => x.name))) +
        '. records: ' + JSON.stringify(this.props.value));

    var self = this;
    return (
          <div className="col-xs-12">
            <div className="box">
              <div className="box-body no-padding">
                <ul className="nav nav-pills nav-stacked">
                {self.props.value && self.props.value.map(function(record, i) { return (
                  <li>
                    {self.props.form.fields.map(function(fld, i) { return (
                      <Field key={fld._id} fielddef={fld} value={record[fld.name]} />
                    );})}
                  </li>
                );})}
              </ul>
              </div>
              <div className="box-footer">
                <button type="submit" className="btn btn-primary">New</button>
              </div>
            </div>
          </div>
        );
  }
}
*/

export class Field extends Component {

  constructor(props) {
    super(props);
    let state = {
      picupload:0, picselectexisting:false, picFileList: {state: "wait", records: []},
      lookup: { visible: false, values: [], create: false, offercreate: false},
      date: {visible: false, montharray: [] }
    };

    if (props.fielddef.type === "reference") {
      let df = DynamicForm.instance;
      state.search_form = df.getForm(props.fielddef.search_form);
      state.value = this._formatReferenceValue(state.search_form, props.value);
    } else {
      state.value = props.value
    }
    console.log ("Field constructor " + props.fielddef.name + "["+props.fielddef.type+"] = " + JSON.stringify(state.value));
    this.state = state;
    this._selectedFile = this._selectedFile.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value != this.props.value) {
      console.log ('the field value has been updated by the form, update the field (this will override the field state)');
      if (this.props.fielddef.type === "reference") {
        this.setState({value: this._formatReferenceValue(this.state.search_form, nextProps.value)});
      } else {
        this.setState({value: nextProps.value});
      }
    }
  }

  _formatReferenceValue(search_form, value) {
    console.log ("Field _formatReferenceValue, form: " + search_form.name + "["+search_form.type+"], value: "+ value);
    if (search_form.type === "metadata") {
      if (!value)  return null;
      // client needs to do it
     let search_ref = search_form.data.find(i => i.key === value);
     return {key: value, search_ref: search_ref};
    } else {
      // done by the server
      return value;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log ('Field shouldComponentupdate props: ' + JSON.stringify(nextProps));
    console.log ('Field shouldComponentupdate state: ' + JSON.stringify(nextState));
    if (nextState) {
      return true;
    } else {
      if (this.props.fielddef.type === "reference") {
        if (nextProps.value && this.props.edit) {
          console.log ('Field shouldComponentupdate : NO');
          return false;
        }
      } else if (nextProps.value && nextProps.value === this.props.value) {
        console.log ('Field shouldComponentupdate : NO');
        return false;
      }
    }
    return true;
  }

  componentDidMount() {
      var self = this,
        df = DynamicForm.instance;
      if (this.props.fielddef.type === 'image' && this.props.edit) {
        this.line = new ProgressBar.Line(React.findDOMNode(this.refs.progressline), {color: '#FCB03C'})
      }
  }

  componentWillUnmount () {
      if (this.line) this.line.destroy();
  }

  /********************/
  /* Lookup Functions */
  /********************/
  _handleLookupKeypress(e) {
    let df = DynamicForm.instance,
        sform = this.state.search_form,
        inval = e.target.value;
    if (sform.type === "metadata") {
      console.log ("its from meta : " + JSON.stringify(sform.data));
      this.setState({lookup: {visible: true, fields: sform.fields, values: sform.data, offercreate: false}});
    } else {
      console.log ('_handleLookupKeypress: ' + inval);
      this.setState({lookup: {visible: true, values:[], create: false}}, () => {
        df.search(this.props.fielddef.search_form, inval).then(succVal => {
          this.setState({lookup: {visible: true, fields: sform.fields, values: succVal, offercreate: true}});
        })
      });
    }
  }


  _handleLookupSelectOption (data) {
    let lookupval,
        sform = this.state.search_form,
        resetLookup = {visible: false, values: [] };

    React.findDOMNode(this.refs.lookupinput).value = "";

    if (!data) {
      this.setState ({value: null, lookup: resetLookup}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: null});
      });
    } else {
      if (sform.type === "metadata")
        lookupval = {key: data.key, search_ref: data};
      else
        lookupval ={_id: data._id, search_ref: data} ;

      console.log ('Field _handleLookupSelectOption : ' + JSON.stringify(lookupval));
      this.setState ({value: lookupval, lookup: resetLookup}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: lookupval});
      });
    }
  }

  _openCreate() {
    this.setState({lookup: {create: true, visible: true}})
  }

  _newLookupRecord(row) {
    console.log ("Field _newLookupRecord got new lookup record : " + JSON.stringify (row));
    React.findDOMNode(this.refs.lookupinput).value = "";
    this.setState({value: row, lookup: {create: false, visible: false, values:[]}}, () => {
      if (this.props.onChange)
        this.props.onChange ({[this.props.fielddef.name]: row});
    });
  }

  /*******************/
  /* Image Functions */
  /*******************/
  _clickFile() {
    React.findDOMNode(this.refs.imageinput).click();
  }

  _fileuploadhtml5(e) {
    var self = this,
        df = DynamicForm.instance,
        file = e.currentTarget.files[0];

    console.log('Field _fileuploadhtml5 : ' + file.name);
    df.uploadFile(file, progressEvt => {
      console.log ('progress ' + progressEvt.loaded);
      if (progressEvt.lengthComputable) {
        //this.setState({picupload: Math.round(progressEvt.loaded * 100 / progressEvt.total)});
        this.line.animate(Math.round(progressEvt.loaded / progressEvt.total));
      } else {
        //this.setState({picupload: 50});
        this.line.animate(0.5);
      }
    }).then (succVal => {

      this.line.animate(1, () => this.line.set(0));
      console.log ('got :' + JSON.stringify (succVal));

      this.setState({value: succVal._id}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: succVal._id});
        });
     //data.documents[field.name] = evt.target.responseText;
   }, errEvt => {
     console.log ("There was an error attempting to upload the file:" + JSON.stringify(errEvt));
     this.setState({servererr: 'Upload failed'});
   });
   return false;
  }

  _selectExisting() {
    let df = DynamicForm.instance;
    this.setState({picselectexisting: true}, () => {
      df.listFiles().then(succVal => {
        this.setState({picFileList: {state: "wait", records: succVal}});
      });
    });
  }
  _selectedFile(filename) {
    let fileid = filename  || this.state.value;
    console.log ('called _selectedFile with:' + JSON.stringify(filename));
    this.setState({value: fileid, picselectexisting: false}, () => {
      if (this.props.onChange)
        this.props.onChange ({[this.props.fielddef.name]: fileid});
      });
  }
  /*******************/
  /* Date  Functions */
  /*******************/
  _showDate() {

    let now = new Date(),
        montharray = [],
        daycnt = 0,
        today = new Date().getDate(),
        firstDoW = new Date(now.getFullYear(), now.getMonth(), 1).getDay(), // day of week [0-6]
        lastDoM = new Date(now.getFullYear(), now.getMonth(), 0).getDate(); // day of month [1-31]

    for (let wkidx of [0,1,2,3,4,5]) {
      montharray[wkidx] = [];
      for (let dayidx of [0,1,2,3,4,5,6]) {
        if (wkidx == 0 && dayidx == firstDoW) daycnt = 1; // found 1st day of month, start the count up
        montharray[wkidx][dayidx] = "";
        if (daycnt >0 && daycnt < lastDoM)  montharray[wkidx][dayidx] = daycnt++;
      }
      if (daycnt >= lastDoM)  break;
    }
    this.setState ({date: {visible: true, today: today, montharray: montharray }})
  }

  _doneDate(yr,mth,day) {
    if (yr) {
      console.log ("Field _doneDate :"  + yr + ":" + mth + ":" + day);
      this.setState ({value: new Date(yr,mth,day), date: {visible: false }}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: this.state.value});
      });
    } else {
      this.setState ({date: {visible: false }});
    }
  }
  /**************************/
  /* inline Data  Functions */
  /**************************/
  _inlineDataChange(val) {
    console.log ("Field: _inlineDataChange : got update from List : " + JSON.stringify(val));
    if (this.props.onChange)
      this.props.onChange ({[this.props.fielddef.name]: val});
  }
  /****************************/



  handleValueChange(event) {
    let newval = event.target.value;
    console.log ('Field handleValueChange : ' + newval);
    this.setState ({value: newval}, () => {
      if (this.props.onChange)
        this.props.onChange ({[this.props.fielddef.name]: newval});
    });
  }

  render() {

    console.log ('Field render: ' + this.props.fielddef.name + '<'+this.props.fielddef.type+'> state.value : ' + JSON.stringify(this.state.value));

    let field, img_src,
        self = this,
        df = DynamicForm.instance;

    if (this.props.fielddef.type === 'image') {
      img_src = this.state.value && df.host+"/dform/file/"+this.state.value || "http://placehold.it/120x120";
      console.log ('Field img_src: ' + img_src);
    }

    if (!this.props.edit) switch (this.props.fielddef.type) {
        case 'text':
        case 'email':
        case 'textarea':
          field = (<span>{this.props.value}</span>);
          break;
        case 'jsonarea':
          field = (<span>{JSON.stringify(this.props.value, null, 4)}</span>);
          break;
        case 'dropdown':
          let ddopt = this.props.value &&  this.props.fielddef.dropdown_options.filter(f => f.key === this.props.value)[0];
          field = (<span>{ddopt && ddopt.name || (this.props.value && 'Unknown option <' + this.props.value +'>' || '')}</span>);
          break;
        case "reference":
          if (this.state.value) {
            let inner = this.state.search_form.fields.map(function(fld, fldidx) { return (
                          <Field fielddef={fld} value={self.state.value.search_ref[fld.name]}/>
                        );});
            if (this.props.fielddef.createnew_form)
              field = (<span className="slds-pill">
                          <a href={Router.URLfor("RecordPage", this.props.fielddef.createnew_form, this.state.value._id)} className="slds-pill__label">{ inner }</a>
                        </span>);
            else
              field = (<span className="slds-pill">
                          <span className="slds-pill__label">{ inner }</span>
                        </span>);
          } else  {
            field = (<span/>);
          }
          break;
        case "dropdown_options":
          field = (<ListMain view={this.props.fielddef.child_form} value={{state: "ready", records: this.props.value}} parent={{field: this.props.fielddef}}/>);
          break;
        case "datetime":
          field = (<span>{this.props.value && new Date(this.props.value).toLocaleDateString() || ""}</span>);
          break;
        case 'childform':
          //let cform = MetaStore.getForm (this.props.fielddef.child_form);
          //field = <ChildForm form={cform} value={this.props.value}/>;
          field = (<span>childform not supported here</span>);
          break;
        case "icon":
          if (this.props.value) {
            //let df = DynamicForm.instance,
            //    search_ref = df.getForm(this.props.fielddef.search_form).data.find(r => r.key == this.props.value);
            //if (search_ref)
              field = (<span><SvgIcon spriteType={this.props.value.type} spriteName={this.props.value.name} small={true} classOverride=" "/></span>);
            //} else {
          //    field = (<span className="slds-form-element__static">cannot find {this.props.value}</span>);
          //  }
          }  else  {
            field = (<span/>);
          }
          break;
        case 'image':
          field = (<div className="pictureAndText">
                    <img style={{height: "200px"}}  src={img_src} alt="message user image"/>
                  </div>);
          break;
        default:
          field = <span>Unknown fieldtype {this.props.fielddef.type}</span>;
          break;
    } else {


      switch (this.props.fielddef.type) {
        case 'text':
        case 'email':
          field =  <input type="text" className="slds-input" placeholder={this.props.fielddef.placeholder} value={this.state.value} onChange={this.handleValueChange.bind(this)}/>;
          break;
        case 'textarea':
          field = <textarea className="slds-input" rows="3" placeholder={this.props.fielddef.placeholder} value={this.state.value} onChange={this.handleValueChange.bind(this)}></textarea>;
            break;
        case 'jsonarea':
            field = <textarea className="slds-input" rows="3" placeholder={this.props.fielddef.placeholder} value={this.state.value} onChange={this.handleValueChange.bind(this)}></textarea>;
            break;
        case 'dropdown':
          field = <select className="slds-input" value={this.state.value} onChange={this.handleValueChange.bind(this)}>
                        <option value="">-- select --</option>
                        {this.props.fielddef.dropdown_options.map (function(opt, i) { return (
                        <option value={opt.key}>{opt.name}</option>
                        );})}
                      </select>;
            break;
        case "icon":
        case "reference":
            field = <span>
                      <div className="slds-lookup__control slds-input-has-icon slds-input-has-icon--right">
                        <a onClick={this._openCreate.bind(this)}><SvgIcon spriteType="utility" spriteName="search" small={true} classOverride="slds-input__icon"/></a>

                        { this.state.value &&
                        <span className="slds-pill">
                          <a href={Router.URLfor("RecordPage", this.props.fielddef.createnew_form, this.state.value._id)} className="slds-pill__label">
                            { self.state.search_form.fields.map(function(fld, fldidx) { return (
                              <Field fielddef={fld} value={self.state.value.search_ref[fld.name]}/>
                            );})}
                          </a>
                          <button onClick={self._handleLookupSelectOption.bind (self, null)} className="slds-button slds-button--icon-bare">
                            <SvgIcon spriteType="utility" spriteName="close" small={true} classOverride="slds-button__icon"/>
                            <span className="slds-assistive-text">Remove</span>
                          </button>
                        </span>
                        }
                        <input className="slds-input--bare" type="text" ref="lookupinput" onChange={this._handleLookupKeypress.bind(this)}  disabled={this.state.value && "disabled" || ""}/>
                      </div>

                      <div className="slds-lookup__menu" style={{visibility: this.state.lookup.visible && 'visible' || 'hidden'}}>
                        { this.state.lookup.create &&
                          <Modal>
                            <PageHeader formname={"Create new " + this.props.fielddef.name}/>
                            <FormMain key={"model-"+this.props.fielddef.name} view={this.props.fielddef.createnew_form} crud="c" onComplete={this._newLookupRecord.bind(this)}/>
                          </Modal>
                        }
                        { !this.state.lookup.create &&
                        <ul className="slds-lookup__list" role="presentation">

                          {this.state.lookup.values.map(function(row, i) { return (
                          <li className="slds-lookup__item" role="presentation">
                              <a onClick={self._handleLookupSelectOption.bind (self, row)} role="option">
                                { self.state.search_form.fields.map(function(fld, fldidx) { return (
                                  <Field fielddef={fld} value={row[fld.name]}/>
                                );})}
                              </a>
                          </li>
                          );})}

                          { this.state.lookup.offercreate && this.props.fielddef.createnew_form &&
                          <li className="slds-lookup__item" role="presentation">
                             <a onClick={this._openCreate.bind(this)} role="option">
                               <SvgIcon spriteType="utility" spriteName="add" small={true} classOverride=" "/>Create {df.getForm(this.props.fielddef.createnew_form).name + '"' + React.findDOMNode(this.refs.lookupinput).value + '"'}</a>
                           </li>
                          }
                        </ul>
                        }
                      </div>
                    </span>;
            break;
        case "datetime":
          field = <span>
                  <div className="slds-form-element__control">
                    <div className="slds-input-has-icon slds-input-has-icon--right">
                      <SvgIcon spriteType="utility" spriteName="event" small={true} classOverride="slds-input__icon" />
                      <input className="slds-input" type="text" placeholder="Pick a Date" value={this.state.value && new Date(this.state.value).toLocaleDateString() || ""} onFocus={this._showDate.bind(this)} />
                    </div>
                  </div>

                  { this.state.date.visible &&
                  <div className="slds-dropdown slds-dropdown--left slds-datepicker">
                    <div className="slds-datepicker__filter slds-grid">
                      <div className="slds-datepicker__filter--month slds-grid slds-grid--align-spread slds-size--3-of-4">
                        <div className="slds-align-middle">
                          <button className="slds-button slds-button--icon-container">
                            <SvgIcon spriteType="utility" spriteName="left" small={true} classOverride="slds-input__icon" small={true}/>
                            <span className="slds-assistive-text">Previous Month</span>
                          </button>
                        </div>
                        <h2 id="month" className="slds-align-middle" aria-live="assertive" aria-atomic="true">June</h2>
                        <div className="slds-align-middle">
                          <button className="slds-button slds-button--icon-container">
                            <SvgIcon spriteType="utility" spriteName="right" small={true} small={true}/>
                            <span className="slds-assistive-text">Next Month</span>
                          </button>
                        </div>
                      </div>
                      <div className="slds-picklist datepicker__filter--year slds-shrink-none">
                        <button id="year" className="slds-button slds-button--neutral slds-picklist__label" aria-haspopup="true">2015
                          <SvgIcon spriteType="utility" spriteName="down" small={true} classOverride="slds-input__icon" small={true}/>
                        </button>
                      </div>
                    </div>
                    <table className="datepicker__month" role="grid" aria-labelledby="month">
                      <thead>
                        <tr id="weekdays">
                          { ["S", "M", "T", "W", "T", "F", "S"].map((day, i) =>{ return (
                            <th ><abbr>{day}</abbr></th>
                        )})}
                        </tr>
                      </thead>
                      <tbody>
                        { this.state.date.montharray.map((wkarray, i) =>{ return (
                            <tr>
                            { wkarray.map((day, i) =>{ return (
                              <td className={day.length == 0 &&  "slds-disabled-text" || (day == this.state.date.today && "slds-is-today" || "")}>
                                <span className="slds-day" onClick={self._doneDate.bind(self, 2015, 6, day)}>{day}</span>
                              </td>
                            )})}
                            </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                  }
                </span>;
          break;
        case 'childform':
            field = <div></div>;
            break;
        case 'image':
            let picview = df.getFormByName('FileMeta')._id;
            field = <div>
                      <input type="file" ref="imageinput" name="file" style={{display: "none"}} accept="image/*" onChange={this._fileuploadhtml5.bind(this)} />
                      <div className="pic-with-text" style={{backgroundImage: "url("+img_src+")"}}>
                        <header>
                          <div style={{margin: "8px 30px"}}>
                            <a onClick={this._clickFile.bind(this)}>upload new picture</a> |
                            <a onClick={this._selectExisting.bind(this)}> select existing picture</a>
                          </div>
                          <div ref="progressline"></div>
                        </header>

                      </div>
                      { this.state.picselectexisting &&
                        <Modal>
                              <PageHeader formname="Select File"/>
                              <ListMain view={picview} value={this.state.picFileList} selected={this._selectedFile}/>
                        </Modal>
                      }

                    </div>;
            break;
        case 'dropdown_options':
          field = (<ListMain view={this.props.fielddef.child_form} value={{state: "ready", records: this.state.value }} parent={{field: this.props.fielddef}} onDataChange={this._inlineDataChange.bind(this)}/>);
          break;
        default:
            field = <div>Unknown fieldtype {this.props.fielddef.type}</div>;
            break;
      };
    }

    return field;
  }
}

export class Modal extends Component {
  render() {
    return (
    <div>
      <div aria-hidden="false" role="dialog" className="slds-modal slds-modal--large slds-fade-in-open">
        <div className="slds-modal__container">
          <div className="slds-modal__content" style={{padding: "0"}}>
            {this.props.children}
          </div>
        </div>
      </div>
      <div className="slds-modal-backdrop slds-modal-backdrop--open"></div>
    </div>
    );
  }
}

// Called from Form Route (top), or within List (embedded), for lookup (create new)
export class FormMain extends Component {
  constructor(props) {
    super(props);
    let df = DynamicForm.instance,
        metaview = df.getForm (props.view),
        nonchildformfields = metaview.fields.filter(m => m.type !== 'childform'),
        value = props.crud == "c" && {state: "ready",  record: {}} || (props.value || {state: "wait",  record: {}});

    this.state =  {
      metaview: metaview,
      nonchildformfields: nonchildformfields,
      value: value, // this is the original data from the props
      changedata: {}, // keep all data changes in the state
      formcontrol: this._formControlState (nonchildformfields, value.record),  // keep form control (visibility and validity)
      edit: props.crud == "c" || props.crud == "u", // edit mode if props.edit or value has no _id (new record),
      errors: null};
    console.log ('FormMain constructor setState : ' + JSON.stringify(this.state));
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log ("FormMain shouldComponentUpdate");
    if (nextProps.value != this.props.value ||
        nextState.formcontrol && nextState.formcontrol.change) {
        console.log ("FormMain shouldComponentUpdate: yes");
        return true;
    }
    return false;
  }

  // form control - visibility and validity
  // TODO : Needs to be MUCH better, not calling eval many times!
  _formControlState (fields, val, currentState) {
    console.log ("FormMain _formControlState currentState : " + JSON.stringify(currentState));
    let cnrt = {flds:{},invalid: false, change: false};
    for (let fld of fields) {
      let record = val,
          visible = true;

      if (fld.show_when) {
          console.log ("evaluating: " + fld.show_when)
          visible = eval(fld.show_when);
      }

      let fctrl = {
              invalid: fld.required && !record[fld.name],
              visible: visible
              };

      // check to see if form control state has changed from last time, if so, it will re-render the whole form!
      if (currentState && currentState.flds[fld.name]) {
        if (!Object.is(currentState.flds[fld.name].invalid, fctrl.invalid) ||
            !Object.is(currentState.flds[fld.name].visible, fctrl.visible))
              cnrt.change = true;
      } else if (fctrl.invalid || !fctrl.visible) {
        // no current state, so much be change
        cnrt.change = true;
      }

      if (fctrl.invalid) cnrt.invalid = true;
      cnrt.flds[fld.name] = fctrl;
    }
    console.log ("FormMain _formControlState result : " + JSON.stringify(cnrt));
    return cnrt;
  }

  // form data is ready from parent
  componentWillReceiveProps (nextProps) {
    if (nextProps.value) {
      this.setState ({value: nextProps.value, formcontrol: this._formControlState (this.state.nonchildformfields, nextProps.value.record)});
    }
  }

  // Called form the Field
  _fieldChange(d) {
    let changedata = Object.assign({}, this.state.changedata, d),
        fullobject = Object.assign({}, this.state.value.record , changedata),
        newState  = {changedata: changedata, formcontrol: this._formControlState (this.state.nonchildformfields, fullobject, this.state.formcontrol)};
    console.log ('FormMain _fieldChange setState: ' + JSON.stringify(newState));
    this.setState(newState);

  }

  _save(succfn) {
    let self = this,
        df = DynamicForm.instance,
        saveopt = {
          form: this.props.view,
          body: this.state.value.record._id && Object.assign(this.state.value.record, this.state.changedata) || this.state.changedata
        };
    // if its a childform - add parent details to the save for mongo & nav back to parent
    if (this.props.parent) {
      let {view, recordid, field} = this.props.parent;
      saveopt.parent = {
        parentid: recordid,
        parentfieldid: field._id
      };
    }
    console.log ('FormMain _save : '+ JSON.stringify(saveopt));
    df.save (saveopt).then(succval => {
      console.log ('FormMain _save, response from server : ' + JSON.stringify(succval));
      return succfn (succval);
    }, errval => {
        self.setState({formcontrol: Object.assign (this.state.formcontrol, {serverError: JSON.stringify(errval), change: true })});
    });
  }

  _delete(succfn) {
    var self = this,
        df = DynamicForm.instance,
        saveopt = {
          form: this.props.view,
          id: this.state.value.record._id
        };

    if (this.props.parent) {
      let {view, recordid, field} = this.props.parent;
      saveopt.parent = {
        parentid: recordid,
        parentfieldid: field._id
      };
    }

    console.log ('FormMain _delete : '+ JSON.stringify(saveopt));
    df.delete (saveopt).then(succval => {
      return succfn (succval);
    });
  }

  render() {

    var self = this,
        {state, record} = this.state.value,
        metaview = this.state.metaview,
        nonchildformfields = this.state.nonchildformfields,
        formcontrol = this.state.formcontrol,
        buttons = {};

    if (this.props.onComplete) {
      buttons.cancelButton = () => this.props.onComplete(null);
      //notify parent screen
      if (this.state.edit) {
        // form in edit mode
        buttons.saveButton = this._save.bind(this, succval => {
          this.props.onComplete({_id: succval._id, search_ref: this.state.changedata});
        });
      } else {
        buttons.editButton = () =>  this.setState ({edit: true});
        buttons.deleteButton= this._delete.bind(this,  () =>  self.props.onFinished('delete', succVal));
      }
    } else {
      if (this.state.edit) {
        buttons.cancelButton = () => Router.navTo("RecordPage", metaview._id, record._id && record._id || null, null, true);
        buttons.saveButton = this._save.bind(this, succval => {
          Router.navTo("RecordPage", metaview._id, succval._id, false, true);
        });
      } else {
        buttons.deleteButton = this._delete.bind(this, () =>   Router.navTo("ListPage", metaview._id));
        buttons.editButton = () => Router.navTo("RecordPage", metaview._id, record._id, {e: true});
      }
    }

    console.log ('FormMain render ' + metaview.name + ', state : ' + JSON.stringify(this.state));
    return (
    <section>
        <div className="slds-form--stacked" style={{padding: "0.5em"}}>
          <div className="slds-grid slds-wrap">
            { React.createElement (SectionHeader, Object.assign ({formName: metaview.name}, buttons)) }
            {nonchildformfields.map(function(field, i) {
              let fc = formcontrol.flds[field.name];
              if (fc.visible) return (
              <div className="slds-col slds-col--padded slds-size--1-of-2 slds-medium-size--1-of-2 slds-x-small-size--1-of-1">
                <div className={"slds-form-element " + (self.state.edit && "  " || " field-seperator ") + (field.required && " slds-is-required" || "") + (fc.invalid && " slds-has-error" || "")}>
                    <label className="slds-form-element__label">{field.title}</label>
                    <div className="slds-form-element__control"  style={{marginLeft: self.state.edit && '0' || "15px"}}>
                      <span className={self.state.edit && "" || " slds-form-element__static"}>
                        <Field fielddef={field} value={record[field.name]} edit={self.state.edit} onChange={self._fieldChange.bind(self)}/>
                      </span>
                    </div>
                </div>
              </div>
            );})}
          </div>
      </div>
      { this.state.formcontrol.serverError &&
        <div className="slds-notify slds-notify--alert slds-theme--error " >
          <span className="slds-assistive-text">Error</span>
          <h2>
            <SvgIcon spriteType="utility" spriteName="ban"/>
            <span >{this.state.formcontrol.serverError}</span>
          </h2>
        </div>
      }
    </section>
    );
  }
}
FormMain.propTypes = {
  // Core
  crud: React.PropTypes.string.isRequired,
  view: React.PropTypes.string.isRequired,
  value: React.PropTypes.shape({
    status: React.PropTypes.string.isRequired,
    record: React.PropTypes.object
  }),
  // used by childform
  parent: React.PropTypes.shape({
    view: React.PropTypes.string.isRequired,
    field: React.PropTypes.string.isRequired,
    recordid: React.PropTypes.string
  }),
  // used by lookup and childform (if no onComplete, assume top)
  onComplete: React.PropTypes.func,
};


// RecordList - list of records, supports inline editing of embedded docs.
export class ListPage extends Component {

    constructor(props) {
      super(props);
      let df = DynamicForm.instance,
            metaview = df.getForm (props.urlparam.view);

      this.state = {
        metaview: metaview,
        value: {status: "wait", records: []}
      };
      console.log ('ListPage constructor setState : ' + JSON.stringify(this.state));
    }

    componentDidMount() {
      this._dataChanged();
    }

    _dataChanged() {
      let df = DynamicForm.instance;
      console.log ('ListPage componentDidMount, running query : ' + JSON.stringify(this.state.metaview._id));
      if (this.state.metaview.collection)
        df.query (this.state.metaview._id).then(succRes =>
          this.setState({value: {status: "ready", records: succRes}})
        );
      else if (this.state.metaview.url)
        df._callServer(this.state.metaview.url).then(succRes =>
          this.setState({value: {status: "ready", records: succRes}})
        );
    }

    render() {
      return (
        <div className="slds-grid slds-wrap">
          <div className="slds-col slds-size--1-of-1">
          { this.props.urlparam && <PageHeader formName={this.state.metaview.name}/> }
          </div>
          <div className="slds-col slds-size--1-of-1">
            <ListMain value={this.state.value} view={this.state.metaview._id} onDataChange={this._dataChanged.bind(this)}/>
          </div>
        </div>
      );
    }
}


export class ListMain extends Component {
  constructor(props) {
    super(props);
    console.log ('ListMain InitialState : ' + JSON.stringify(props.value));
    let df = DynamicForm.instance,
        metaview = df.getForm (props.view);
    this.state = {
      metaview: metaview,
      nonchildformfields: metaview.fields.filter(m => m.type !== 'childform' && m.type !== 'dropdown_options'),
      inline: {enabled: props.parent && props.parent.field.type === "dropdown_options" || false, editidx: null, editval: {}},
      value: props.value,
      editrow: false,

    };
  }

  _ActionDelete (rowidx) {
    if (this.state.inline.enabled) {
      let newarray = this.state.value.records.slice(0);
      newarray.splice(rowidx, 1);
      console.log ("ListMain _delete rowidx:" + rowidx + ", result : " + JSON.stringify(newarray));
      this.setState({value: {status: "ready", records: newarray}, inline: {enabled: true, editidx: null, editval: {}, currentval: null}}, () => {
        if (this.props.onDataChange) {
          this.props.onDataChange(newarray);
        }});
    } else {
      let row = this.state.value.records[rowidx];
      if (window.confirm("Sure?")) {
        let df = DynamicForm.instance,
            saveopt = {
              form: this.props.view,
              id: row._id
            };
        if (this.props.parent) {
          let {view, recordid, field} = this.props.parent;
          saveopt.parent = {
            parentid: recordid,
            parentfieldid: field._id
          };
        }
        console.log ('ListMain _delete : '+ JSON.stringify(saveopt));
        df.delete (saveopt).then(succVal => {
          if (this.props.onDataChange) {
            // this will re-load the data at the parent, and in turn send new props
            this.props.onDataChange();
          }
        });
      }
    }
  }

  _ActionEdit (rowidx, view = false) {
    console.log ("ListMain _ActionEdit rowidx :" + rowidx + ", view : " + view);
    if (this.state.inline.enabled)
      if (rowidx >= 0)
        this.setState({inline: Object.assign(this.state.inline, {editidx: rowidx, currentval: this.state.value.records[rowidx]})});
      else {
        let newarray = this.state.value.records.slice(0);
        newarray.push({});
        this.setState({value: {status: "ready", records: newarray}, inline: Object.assign(this.state.inline, {editidx: newarray.length-1, currentval: null})});
      }
    else if (this.props.parent)
      if (rowidx >= 0)
        this.setState({editrow: {value: {status: "ready", record: this.state.value.records[rowidx]}, crud: view && "r" || "u"}});
      else
        this.setState({editrow: {value: {status: "ready", record: {}}, crud: "c"}});
    else
      Router.navTo("RecordPage", this.props.view, rowidx >= 0 && this.state.value.records[rowidx]._id,  !view && {"e": true} || {});
  }

  _inLinefieldChange(val) {
    console.log ("_inLinefieldChange : " + JSON.stringify(val));
    this.setState({inline: Object.assign(this.state.inline, {editval: Object.assign(this.state.inline.editval, val)})});
  }
  _inLineSave(saveit) {
    console.log ("ListMain _inLineSave : saveit:"+saveit+" ["+ this.state.inline.editidx + "] : " + JSON.stringify(this.state.inline.editval));
    if (saveit) {
      let newarray = this.state.value.records.slice(0);
      if (this.state.inline.currentval) {
        // edit existing val, so join the current val with the changes to get the full record
        newarray[this.state.inline.editidx] = Object.assign(this.state.inline.currentval, this.state.inline.editval);
      } else {
        newarray[this.state.inline.editidx] = this.state.inline.editval;
      }
      this.setState({value: {status: "ready", records: newarray}, inline: {enabled: true, editidx: null, editval: {}, currentval: null}}, () => {
        if (this.props.onDataChange) {
          this.props.onDataChange(newarray);
        }});
      } else {
        //we are cancelling.
        let newarray;
        if (this.state.inline.currentval) {
          // its a existing row so do nothing
          this.setState({inline: {enabled: true, editidx: null, editval: {}, currentval: null}});
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
/*
      console.log ('ListMain _formDone() update of row ' + JSON.stringify(this.state.editrow));
      if (operation === 'save') {

        if (this.state.editrow.crud === "u") {
          var newVals = seq(this.state.value.records,
            map(x => x._id === this.state.editrow.value.records._id && res || x));
        } else if (this.state.editrow.crud === "c") { {
          this.state.value.records.push(res);
          var newVals = this.state.value.records;
        }

      } else if (operation === 'delete') {
        var newVals = this.state.value.records.filter (r => r._id !== this.state.editrow.value.records._id);
      }
      this.setState ({value: newVals, editrow: false});
*/
    } else {
      console.log ('ListMain _formDone() no data, must be cancel');
      this.setState ({editrow: false});
    }
  }

  componentWillReceiveProps (nextProps) {
    console.log ('ListMain componentWillReceiveProps : '+ JSON.stringify(nextProps.value));
    if (nextProps.value) {
      this.setState ({value: nextProps.value, editrow: false});
    }
  }

  // When used to select from a list
  _handleSelect(id) {
    this.props.selected(id);
  }

  render() {
    console.log ('ListMain render, inline: ' + JSON.stringify(this.state.inline) + ", editrow: " + JSON.stringify(this.state.editrow));
    let self = this,
        {status, records} = this.state.value,
        {metaview, nonchildformfields} = this.state;

    let header = React.createElement (SectionHeader, Object.assign ({key: +metaview._id, formName: metaview.name}, this.props.selected && {
          closeButton: this._handleSelect.bind(this, null)
        } || {
          newButton: this._ActionEdit.bind(this, -1, false)
        }));

    return (
      <div className="">
          { !this.state.editrow && header }
          <div className="box-body table-responsive no-padding">
            <div className="slds-scrollable--x">
              <table className="slds-table slds-table--bordered">
                <thead>
                  <tr className="slds-text-heading--label">
                    <th className="slds-row-select" scope="col">
                      <span className="slds-truncate">Actions</span>
                    </th>
                    {nonchildformfields.map(function(field, i) { return (
                      <th scope="col">
                        <span className="slds-truncate">{field.title}</span>
                      </th>
                    );})}
                  </tr>
                </thead>
                <tbody>
                  { records.map(function(row, i) { return (
                    <tr className="slds-hint-parent">
                        <td className="slds-row-select">

                          { self.props.selected &&
                          <button className="slds-button slds-button--brand" onClick={self._handleSelect.bind(self,row._id)}>select </button>
                          || (self.state.inline.enabled && self.state.inline.editidx == i) &&
                              <div className="slds-button-group">
                              <button className="slds-button slds-button--brand" onClick={self._inLineSave.bind(self, true)}>save </button>
                              <button className="slds-button slds-button--brand" onClick={self._inLineSave.bind(self, false)}>cancel </button>
                              </div>
                               ||
                               <div className="slds-button-group">
                              <button className="slds-button slds-button--brand" onClick={self._ActionEdit.bind(self, i, false)} disabled={self.state.inline.editidx}>edit </button>
                              <button className="slds-button slds-button--brand" onClick={self._ActionDelete.bind(self, i)}>del </button>
                              </div>

                          }
                        </td>
                        {nonchildformfields.map(function(field) {
                            let listfield =  <Field key={metaview._id+"RL"+field._id} fielddef={field} value={row[field.name]} edit={i == self.state.inline.editidx} onChange={self._inLinefieldChange.bind(self)}/>;
                            if (field.name === "name" && !self.state.inline.enabled) {
                              if (self.props.parent )
                                return (
                                <td><a style={{color: "#0070d2", cursor: "pointer"}} onClick={self._ActionEdit.bind(self, i, true)}>{listfield}</a></td>);
                              else
                                return (
                                <td><a href={Router.URLfor("RecordPage", metaview._id, row._id)}>{listfield}</a></td>);
                            } else {
                              return (<td>{listfield}</td>);
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
              <FormMain  value={this.state.editrow.value} view={metaview._id} crud={this.state.editrow.crud} parent={this.props.parent} onComplete={this._onFinished.bind(this)}/>
            </Modal>
          }
      </div>
    )
  }
}
ListMain.propTypes = {
  // Core
  view: React.PropTypes.string.isRequired,
  value: React.PropTypes.shape({
    status: React.PropTypes.string.isRequired,
    records: React.PropTypes.object
  }),
  // used by childform, to inform data operations
  parent: React.PropTypes.shape({
    view: React.PropTypes.string.isRequired,
    field: React.PropTypes.string.isRequired,
    recordid: React.PropTypes.string
  }),
  // used by inline edit dropdown, and child forms to inform parent component of data change (parent handles that event)
  onDataChange: React.PropTypes.func,
  //used by select picture, when user need to select a item from a list, _id of the item is returned.
  selected: React.PropTypes.func
};

// Top level Form, with FormMan & Related Lists. (called from Router - props much reflect URL params)
export class RecordPage extends Component {

  constructor(props) {
    super(props);

    let df = DynamicForm.instance,
          metaview = df.getForm (props.urlparam.view);

    this.state = {
      crud: !props.urlparam.id && "c" || props.urlparam.e && "u" || "r",
      metaview: metaview,
      childformfields: metaview.fields.filter(m => m.type === 'childform'),
      value: {status: "wait", record: {}}
    };
    console.log ('RecordPage constructor setState : ' + JSON.stringify(this.state));
  }

  componentDidMount() {
    this._dataChanged();
  }

  _dataChanged() {
    console.log ('RecordPage componentDidMount query database : ');
    let df = DynamicForm.instance;
    if (this.state.crud == 'u' || this.state.crud == 'r') {
      if (this.state.metaview.collection)
        df.get (this.state.metaview._id, this.props.urlparam.id).then(succVal => {
            this.setState({ value: {status: "ready", record: succVal}});
        });
      else if (this.state.metaview.url)
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
    let self = this,
        {status, record} = this.state.value;

    console.log ("Form: rendering state");
  /* Removed prop from FormMain - parent={this.props.urlparam.parent}  - will never happen?? */
    return (
        <div className="slds-grid slds-wrap">
          <div className="slds-col slds-size--1-of-1">
          { this.props.urlparam && <PageHeader formName={this.state.metaview.name}/> }
          <button onClick={this._importMeta.bind(this)}>import</button>
          </div>
          <div className="slds-col slds-size--1-of-1 slds-medium-size--1-of-2">

              <FormMain key={this.state.metaview._id} value={this.state.value} view={this.state.metaview._id}  crud={this.state.crud}/>

          </div>
          <div className="slds-col slds-size--1-of-1 slds-medium-size--1-of-2">
            {this.state.crud === "r"  && this.state.childformfields.map(function(field, i) { return (
              <div style={{padding: "0.5em"}}>
                <ListMain parent={{view: self.state.metaview._id, recordid: status == 'ready' && record._id || "new", field: field }} view={field.child_form} value={{status: status, records: status === "ready" && record[field.name] || []}} onDataChange={self._dataChanged.bind(self)}/>
              </div>
            );})}
          </div>
        </div>
      );
    }
}

export class PageHeader extends Component {
  render() {
    return (
      <div className="slds-page-header ">
        <div className="slds-grid">
          <div className="slds-col slds-has-flexi-truncate">

            <div className="slds-media">
              <div className="slds-media__figure">
                <SvgIcon classOverride="slds-icon" spriteType="utility" spriteName="people"/>
              </div>
              <div className="slds-media__body">
                <p className="slds-text-heading--label">Record Type</p>
                <div className="slds-grid">
                  <h1 className="slds-text-heading--medium slds-m-right--small slds-truncate slds-align-middle">{this.props.formName}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="slds-col slds-no-flex slds-align-bottom">
            <div className="slds-grid">

              <div className="slds-button-group">
                { typeof this.props.newButton !== "undefined" &&
                <button onClick={this.props.newButton}  className="slds-button slds-button--inverse" >
                  new
                </button>
                }
                { typeof this.props.editButton !== "undefined" &&
                <button onClick={this.props.editButton}  className="slds-button slds-button--inverse" >
                  edit
                </button>
                }
                { typeof this.props.deleteButton !== "undefined" &&
                <button onClick={this.props.deleteButton}  className="slds-button slds-button--inverse" >
                  delete
                </button>
                }
                { typeof this.props.cancelButton !== "undefined" &&
                <button onClick={this.props.cancelButton}  className="slds-button slds-button--inverse" >
                  cancel
                </button>
                }
                { typeof this.props.saveButton !== "undefined" &&
                <button onClick={this.props.saveButton}  className="slds-button slds-button--inverse" >
                  save
                </button>
                }
                { typeof this.props.closeButton !== "undefined" &&
                <button onClick={this.props.closeButton}  className="slds-button slds-button--inverse" >
                  close
                </button>
                }
              </div>

            </div>
          </div>
        </div>
        <p className="slds-text-body--small slds-m-top--x-small">10 items, sorted by name</p>
      </div>
    );
  }
}

export class SectionHeader extends Component {
  render() {
    return (
      <div className="slds-col slds-col--padded slds-size--1-of-1 ">
          <div className="slds-grid form-seperator">
            <div className="slds-col slds-col--padded slds-has-flexi-truncate">
              <h3 className="slds-text-heading--small" style={{marginTop: "8px"}}>{this.props.formName}</h3>
            </div>
            <div className="slds-col slds-col--padded slds-no-flex slds-align-bottom">

              <div className="slds-button-group" style={{marginBottom: "3px"}}>
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
                { typeof this.props.deleteButton !== "undefined" &&
                <button onClick={this.props.deleteButton}  className="slds-button slds-button--small slds-button--brand" >
                  delete
                </button>
                }
                { typeof this.props.cancelButton !== "undefined" &&
                <button onClick={this.props.cancelButton}  className="slds-button slds-button--small slds-button--brand" >
                  cancel
                </button>
                }
                { typeof this.props.saveButton !== "undefined" &&
                <button onClick={this.props.saveButton}  className="slds-button slds-button--small slds-button--brand" >
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
      </div>
    );
  }
}
