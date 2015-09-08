'use strict;'

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';

import Router from './router.jsx';

import ProgressBar from 'progressbar.js'
import { SvgIcon } from './utils.jsx';
import t from 'transducers.js';
const { range, seq, compose, map, filter } = t;
import DynamicForm from '../services/dynamicForm.es6';

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


export class Field extends Component {

  constructor(props) {
    console.log ('Field constructor');
    super(props);
    this.state = { picupload:0, picselectexisting:false, picFileList: {state: "wait", records: []},  lookup: { visible: false, values: [], create: false, offercreate: false}, value: props.value};
    this._selectedFile = this._selectedFile.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value != this.props.value) {
      console.log ('the field value has been updated by the form, update the field (this will override the field state)');
      this.setState({value: nextProps.value});
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log ('Field shouldComponentupdate props: ' + JSON.stringify(nextProps));
    console.log ('Field shouldComponentupdate state: ' + JSON.stringify(nextState));
    if (nextState) {
      return true;
    } else {
      if (this.props.fielddef.type === 'lookup') {
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
        inval = e.target.value;
    console.log ('_handleLookupKeypress: ' + inval);
    this.setState({lookup: {visible: true, values:[], create: false}}, () => {
      df.search(this.props.fielddef.search_form, inval).then(succVal => {
        this.setState({lookup: {visible: true, values: succVal, offercreate: true}});
      })
    });
  }


  _handleLookupSelectOption (data) {
    let lookupval = data && {_id: data._id, primary: data.name} || null;
    React.findDOMNode(this.refs.lookupinput).value = "";
    console.log ('Field _handleLookupSelectOption : ' + lookupval);
    this.setState ({value: lookupval, lookup: {visible: false, values: [] }}, () => {
      if (this.props.onChange)
        this.props.onChange ({[this.props.fielddef.name]: lookupval});
    });
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
          field = (<span className="slds-form-element__static">{this.props.value}</span>);
          break;
        case 'jsonarea':
          field = (<span className="slds-form-element__static">{JSON.stringify(this.props.value, null, 4)}</span>);
          break;
        case 'dropdown':
          let ddopt = this.props.value &&  this.props.fielddef.dropdown_options.filter(f => f.value === this.props.value)[0];
          field = (<span className="slds-form-element__static">{ddopt && ddopt.name || (this.props.value && 'Unknown option <' + this.props.value +'>' || '')}</span>);
          break;
        case 'lookup':
          if (this.props.value) {
            field = (<span className="slds-form-element__static">
                      <a href={"#RecordPage?gid="+this.props.fielddef.search_form+":"+this.props.value._id}>
                        {this.props.value.primary}
                      </a>
                    </span>);
          } else  {
            field = (<span className="slds-form-element__static"/>);
          }
          break;
        case 'childform':
          let cform = MetaStore.getForm (this.props.fielddef.child_form);
          field = <ChildForm form={cform} value={this.props.value}/>;
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
                        <option value={opt.value}>{opt.name}</option>
                        );})}
                      </select>;
            break;
        case 'lookup':
            field = <span>
                      <div className="slds-lookup__control slds-input-has-icon slds-input-has-icon--right">
                        <a onClick={this._openCreate.bind(this)}><SvgIcon spriteType="utility" spriteName="search" small={true} classOverride="slds-input__icon"/></a>

                        { this.state.value &&
                        <span className="slds-pill">
                          <a href="#" className="slds-pill__label">
                            <SvgIcon spriteType="standard" spriteName="account" small={true} classOverride=" "/>
                            <span>{this.state.value.primary}</span>
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
                              <SvgIcon spriteType="standard" spriteName="account" small={true} classOverride=" "/>
                              {row.name}
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
            field = <div>
                    </div>;
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
        value = props.crud == "c" && {state: "ready",  records: {}} || (props.value || {state: "wait",  records: {}});

    this.state =  {
      metaview: metaview,
      nonchildformfields: nonchildformfields,
      value: value, // this is the original data from the props
      changedata: {}, // keep all data changes in the state
      formcontrol: this._formControlState (nonchildformfields, value.records),  // keep form control (visibility and validity)
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
      this.setState ({value: nextProps.value, formcontrol: this._formControlState (this.state.nonchildformfields, nextProps.value.records)});
    }
  }

  // Called form the Field
  _fieldChange(d) {
    let changedata = Object.assign({}, this.state.changedata, d),
        fullobject = Object.assign({}, this.state.value.records , changedata),
        newState  = {changedata: changedata, formcontrol: this._formControlState (this.state.nonchildformfields, fullobject, this.state.formcontrol)};
    console.log ('FormMain _fieldChange setState: ' + JSON.stringify(newState));
    this.setState(newState);

  }

  _save() {
    var self = this,
        df = DynamicForm.instance,
        saveopt = {
          form: this.props.view,
          body: this.state.value.records._id && Object.assign(this.state.value.records, this.state.changedata) || this.state.changedata
        };

    // if its a childform - add parent details to the save for mongo & nav back to parent
    if (this.props.parent) {
      var [viewid, recordid, fieldid] = this.props.parent.split(":");
      saveopt.parent = {
        parentid: recordid,
        parentfieldid: fieldid
      };
    }

    console.log ('FormMain _save : '+ JSON.stringify(saveopt));
    df.save (saveopt).then(succVal => {
      console.log ('FormMain _save, response from server : ' + JSON.stringify(succVal));
      if (succVal._id) {
        console.log ('FormMain successful save ' + succVal._id);
        if (this.props.onComplete) {
          // create new via Lookup+
          this.props.onComplete({_id: succVal._id, primary: this.state.changedata['name']});
        } else if (saveopt.parent) {
          // inform Parent RecordList to update record and close edit window.
          this.props.onFinished('save', succVal);
        } else {
          Router.navBack("#RecordPage?gid=" + saveopt.form+":"+succVal._id);
        }
      } else {
        console.log ('save error: ' + JSON.stringify(succVal));
        self.setState({formcontrol: {serverError: JSON.stringify(succVal.data) }});
      }
    }, errVal => {
        self.setState({formcontrol: Object.assign (this.state.formcontrol, {serverError: JSON.stringify(errVal), change: true })});
    });
  }

  _delete() {
    var self = this,
        df = DynamicForm.instance,
        saveopt = {
          form: this.props.view,
          id: this.state.value.records._id
        };

    if (this.props.parent) {
      var [viewid, recordid, fieldid] = this.props.parent.split(":");
      saveopt.parent = {
        parentid: recordid,
        parentfieldid: fieldid
      };
    }

    console.log ('FormMain _delete : '+ JSON.stringify(saveopt));
    df.delete (saveopt).then(succVal => {
      if (this.props.parent) {
        self.props.onFinished('delete', succVal);
      } else {
        window.location.href = "#ListPage?gid="+this.props.view;
      }
    });
  }

  render() {

    var self = this,
        state = this.state.value.state,
        record = this.state.value.records,
        df = DynamicForm.instance,
        metaview = this.state.metaview,
        nonchildformfields = this.state.nonchildformfields,
        formcontrol = this.state.formcontrol;

    let header = React.createElement (SectionHeader, Object.assign ({key: +metaview._id+":"+(state === "ready" && record._id || "new"), formName: metaview.name}, this.state.edit && {
      saveButton: this._save.bind(this),
      cancelButton: () => {
        if (this.props.onComplete) {
          // create new via Lookup+
          this.props.onComplete();
        } else if (this.props.parent) {
          this.props.onFinished('cancel');
        } else {
          if (record._id) {
            // edit an existing record, go to view using url (keep history)
            window.location.href = "#RecordPage?gid="+this.props.view+":"+record._id;
          } else {
            // creating a new record, goto list
            window.location.href = "#ListPage?gid="+this.props.view;
          }
      }
    }} || {
      deleteButton: this._delete.bind(this),
      editButton: () =>  {
        if (this.props.parent)
          this.setState ({edit: true});
        else
          window.location.href = "#RecordPage?gid="+this.props.view+":"+record._id+"&e=1";
      }
    }));

    console.log ('FormMain render ' + metaview.name + ', state : ' + JSON.stringify(this.state));
    return (
    <section>
        <div className="slds-form--stacked" style={{padding: "0.5em"}}>
          <div className="slds-grid slds-wrap">
              { header}



            {nonchildformfields.map(function(field, i) {
              let fc = formcontrol.flds[field.name];
              if (fc.visible) return (
              <div className="slds-col slds-col--padded slds-size--1-of-2 slds-medium-size--1-of-2 slds-x-small-size--1-of-1">
                <div className={"slds-form-element " + (self.state.edit && "  " || " field-seperator ") + (field.required && " slds-is-required" || "") + (fc.invalid && " slds-has-error" || "")}>
                    <label className="slds-form-element__label">{field.title}</label>
                    <div className="slds-form-element__control"  style={{marginLeft: self.state.edit && '0' || "15px"}}>
                      <Field fielddef={field} value={record[field.name]} edit={self.state.edit} onChange={self._fieldChange.bind(self)}/>
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
FormMain.propTypes = {  crud: React.PropTypes.string, value: React.PropTypes.object  };
FormMain.defaultProps = { crud: "r", value: {} };

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
            <ListMain value={this.state.value} view={this.state.metaview._id}/>
          </div>
        </div>
      );
    }
}


export class ListMain extends Component {
  constructor(props) {
    super(props);
    console.log ('ListMain InitialState : ' + JSON.stringify(props.value));
    this.state = {
      value: props.value,
      editrow: false
    };
  }


  _delete (e) {
  }

  _edit (row, crud) {
    console.log ('_edit row: ' + JSON.stringify (row) + ': edit: ' + crud);
    if (this.props.parent) {
      console.log ('ListMain : want to edit a imbedded doc');
      this.setState({editrow: {value: row, crud: crud}});
    } else  {

      let edit_id = row.records._id && ":" + row.records._id || "",
          edit_url = (crud === "c" || crud ==="u") && "&e=true" || "",
          nurl = "#RecordPage?gid=" + this.props.view + edit_id + edit_url;
      console.log ("ListMain : _edit: " + nurl);
      window.location.href = nurl;
    }
  }


  _onFinished (operation, res) {
    console.log ('ListMain _onFinished() ' + JSON.stringify(res));
    if (res) {
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
    console.log ('ListMain rendering ' + JSON.stringify(this.state.editrow));
    var self = this,
        state = this.state.value.state,
        records = this.state.value.records,
        df = DynamicForm.instance,
        metaview = df.getForm (this.props.view),
        nonchildformfields = metaview.fields.filter(m => m.type !== 'childform');

    let header = React.createElement (SectionHeader, Object.assign ({key: +metaview._id, formName: metaview.name}, this.props.selected && {
          closeButton: this._handleSelect.bind(this, null)
        } || {
          newButton: this._edit.bind(this, {state: "ready", records: {}}, "c")
        }));

    return (
      <div className="">
          { !this.state.editrow && header }
          <div className="box-body table-responsive no-padding">
          { this.state.editrow &&
            <FormMain  value={this.state.editrow.value} view={metaview._id} crud={this.state.editrow.crud} parent={this.props.parent} onFinished={this._onFinished.bind(this)}/>
          ||
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
                          ||
                          <a className="slds-button slds-button--brand" onClick={self._edit.bind(self, {state: "ready", records: row}, "u")}>edit </a>
                          }
                          {  !self.props.selected &&
                          <a className="slds-button slds-button--brand" onClick={self._edit.bind(self, {state: "ready", records: row}, "r")}>view </a>
                          }
                        </td>
                        {nonchildformfields.map(function(field, i) { return (
                          <td><Field key={metaview._id+"RL"+field._id} fielddef={field} value={row[field.name]}/></td>
                        );})}
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          }
          </div>
      </div>
    )
  }
}

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
      value: {status: "wait", records: {}}
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
            this.setState({ value: {status: "ready", records: succVal}});
        });
      else if (this.state.metaview.url)
        df._callServer(this.state.metaview.url+"?_id="+this.props.urlparam.id).then(succRes =>
          this.setState({value: {status: "ready", records: succRes}})
        );
    }
  }

  _importMeta() {
    let df = DynamicForm.instance,
        p,
        appmeta = this.state.value.records;


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
    var self = this,
        status = self.state.value.status,
        records = self.state.value.records;

    console.log ('Form: rendering state');
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
                <ListMain parent={self.state.metaview._id+":"+(status === 'ready' && records._id || "new")+":"+field._id} view={field.child_form} value={{status: status, records: status === "ready" && records[field.name] || []}} onDataChange={self._dataChanged.bind(self)}/>
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
