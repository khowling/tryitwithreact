'use strict;'

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';

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
  //mixins: [React.addons.LinkedStateMixin],
  constructor(props) {
    super(props);
    // ES6 Computed Propery names
    //let initState = {[this.props.fielddef.name]: this.props.value || this.props.fielddef.default_value, picupload:0};
    //console.log ('Field getInitialState: ' + this.props.fielddef.name);
    this.state = { picupload:0, lookup: { visible: false, values: [], create: false, offercreate: false}};
  }

  componentWillReceiveProps(nextProps) {
    console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    //if (nextProps.value) this.setState ({[this.props.fielddef.name]: nextProps.value});
    /*
    if (this.props.fielddef.type === 'lookup' && this.props.edit) {
      if (nextProps.value) {
        let loopupinput = this.getDOMNode().querySelector('input.tt-input');
        console.log ('Field componentWillReceiveProps update typeahead value: ' + nextProps.value.primary);
        $(loopupinput).typeahead('val', nextProps.value.primary);
      }
    }
    */
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
        this.setState({picupload: Math.round(progressEvt.loaded * 100 / progressEvt.total)});
      } else {
        this.setState({picupload: 50});
      }
    }).then (loadEvt => {
      this.setState({picupload : 0});
      console.log ('got :' + JSON.stringify (loadEvt.target));
      this.handleChange (loadEvt.target.responseText);
     //data.documents[field.name] = evt.target.responseText;
   }, errEvt => {
     console.log ("There was an error attempting to upload the file:" + JSON.stringify(errEvt));
     this.setState({servererr: 'Upload failed'});
   });
   return false;
  }

  handleChange(newValue) {
    console.log ('Field handleChange ['+this.props.fielddef.name+'] = ' + JSON.stringify(newValue));
    let newState = {[this.props.fielddef.name]: newValue};
    if (this.props.onChange)
      this.props.onChange (newState);
    else
      // not really needed as the change handler is at the form level, that will update props on this child!
      this.setState(newState);
  }
  componentDidMount() {
      var self = this,
        df = DynamicForm.instance;
      if (this.props.fielddef.type === 'lookup' && this.props.edit) {
        React.findDOMNode(this.refs.lookupinput).addEventListener("keypress", this._handleLookupKeypress.bind(this), false);
      }
  }
  _handleLookupKeypress() {
    let df = DynamicForm.instance;
    console.log ('_handleLookupKeypress: ' + this.refs.listbox);
    this.setState({lookup: {visible: true, values:[], create: false}}, () => {
      df.query({form: this.props.fielddef.search_form}).then(succVal => {
        this.setState({lookup: {visible: true, values: succVal, offercreate: true}});
      })
    });
  }
  _handleLookupSelectOption (data) {
    React.findDOMNode(this.refs.lookupinput).value = "";
    this.setState({lookup: {visible: false, values: [] }});
    this.handleChange(data && {_id: data._id, primary: data.name} || data);
  }

  _openCreate() {
    //$(ReactDOM.findDOMNode(this.refs.typeaheadModal)).modal({show:true});
    //this.setState ({lookupcreate: true});
    this.setState({lookup: {create: true, visible: true}})
  }

  render() {

    console.log ('Field render: ' + this.props.fielddef.name + '<'+this.props.fielddef.type+'> props.value : ' + JSON.stringify(this.props.value));

    let field, img_src,
        self = this,
        df = DynamicForm.instance;

    if (this.props.fielddef.type === 'image') {
      img_src = this.props.value && df.host+"/dform/file/"+this.props.value || "http://placehold.it/120x120";
      console.log ('Field img_src: ' + img_src);
    }

    if (!this.props.edit) switch (this.props.fielddef.type) {
        case 'text':
        case 'email':
        case 'textarea':
          field = (<span className="slds-form-element__static">{this.props.value}</span>);
          break;
        case 'dropdown':
          let ddopt = this.props.value &&  this.props.fielddef.dropdown_options.filter(f => f.value === this.props.value)[0];
          field = (<span className="slds-form-element__static">{ddopt && ddopt.name || (this.props.value && 'Unknown option <' + this.props.value +'>' || '')}</span>);
          break;
        case 'lookup':
          if (this.props.value) {
            field = (<span className="slds-form-element__static">
                      <a href={"#Form?gid="+this.props.fielddef.createnew_form+":"+this.props.value._id}>
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
                    <img height="120"  src={img_src} alt="message user image"/>
                  </div>);
          break;
        default:
          field = <span>Unknown fieldtype {this.props.fielddef.type}</span>;
          break;
    } else {

      var valueLink = {
        //value: this.state[this.props.fielddef.name],
        value: this.props.value,
        requestChange: this.handleChange.bind(this)
      };
      //console.log ('Field render valueLink: ' + JSON.stringify(valueLink));



      switch (this.props.fielddef.type) {
        case 'text':
        case 'email':
          field =  <input type="text" className="slds-input" placeholder={this.props.fielddef.placeholder} valueLink={valueLink}/>;
          break;
        case 'textarea':
          field = <textarea className="slds-input" rows="3" placeholder={this.props.fielddef.placeholder} valueLink={valueLink}></textarea>;
            break;
        case 'dropdown':
          field = <select className="slds-input" valueLink={valueLink}>
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

                        { this.props.value &&
                        <span className="slds-pill">
                          <a href="#" className="slds-pill__label">
                            <SvgIcon spriteType="standard" spriteName="account" small={true} classOverride=" "/>
                            <span>{this.props.value.primary}</span>
                          </a>
                          <button onClick={self._handleLookupSelectOption.bind (self, null)} className="slds-button slds-button--icon-bare">
                            <SvgIcon spriteType="utility" spriteName="close" small={true} classOverride="slds-button__icon"/>
                            <span className="slds-assistive-text">Remove</span>
                          </button>
                        </span>
                        }
                        <input id="lookup" className="slds-input--bare" type="text" ref="lookupinput" disabled={this.props.value && "disabled" || ""}/>
                      </div>

                      <div className="slds-lookup__menu" style={{visibility: this.state.lookup.visible && 'visible' || 'hidden'}}>
                        { this.state.lookup.create &&
                          <FormMain view={this.props.fielddef.createnew_form} crud="c"/>
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
            field =  <div className="pictureAndText">
                        <input type="file" ref="imageinput" name="file" style={{display: "none"}} accept="image/*" onChange={this._fileuploadhtml5.bind(this)} />
                        <img height="120" src={img_src} alt="message user image"/>
                        {this.state.picupload == 0 &&
                        <a className="imglable" onClick={this._clickFile.bind(this)}>Upload Picture <i className="fa fa-arrow-circle-right"></i></a>
                        ||
                        <div className="imglable progress"><div className="progress-bar" style={{"width": this.state.picupload+"%"}}></div></div>
                        }

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

// Top level Form, with FormMan & Related Lists.
export class Form extends Component {

  constructor(props) {
    super(props);

    let df = DynamicForm.instance,
          metaview = df.getForm (props.urlparam.view);

    this.state = {
      crud: !props.urlparam.id && "c" || props.urlparam.e && "u" || "r",
      metaview: metaview,
      childformfields: metaview.fields.filter(m => m.type === 'childform')
    };
  }

  componentDidMount() {
    let df = DynamicForm.instance;
    if (this.state.crud == 'u' || this.state.crud == 'r') {
      df.query ({form: this.props.urlparam.view, q: {_id: this.props.urlparam.id}}).then(succVal => {
          this.setState({ value: succVal[0]});
      });
    }
  }

  render() {
    var self = this;
    console.log ('Form: render state : ' + JSON.stringify(this.state));
    return (
        <div className="slds-grid">
          <div className="slds-col--padded slds-size--1-of-1 slds-large-size--1-of-2">
            <div className="grid-card" style={{padding: "0px"}}>
              <FormMain key={this.state.metaview._id} value={this.state.value} view={this.state.metaview._id} parent={this.props.urlparam.parent} crud={this.state.crud}/>
            </div>
          </div>
          <div className="slds-col--padded slds-size--1-of-1 slds-large-size--1-of-2">
            {this.state.crud === "r"  && this.state.childformfields.map(function(field, i) { return (
              <RecordList parent={self.state.metaview._id+":"+(self.state.value && self.state.value._id || "new")+":"+field._id} view={field.child_form} value={self.state.value && self.state.value[field.name]}/>
            );})}
          </div>
        </div>
      );
    }
}

// Called from Form Route (top), or within List (embedded), for lookup (create new)
export class FormMain extends Component {
  constructor(props) {
    super(props);
    console.log ('FormMain constructor : ' + JSON.stringify(this.props));
    this.state =  {
      value: props.value,
      changeddata: {},
      edit: props.crud === "c" || props.crud === "u", // edit mode if props.edit or value has no _id (new record)
      errors: null};
    console.log ('FormMain constructor setState : ' + JSON.stringify(this.state));
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.value) {
      this.setState ({value: nextProps.value});
    }
  }
  _fieldChange(d) { // Called form the Field
    let newState = {
        value: Object.assign(this.state.value, d),
        changeddata: Object.assign(this.state.changeddata, d)};
    console.log ('FormMain _fieldChange setState : '+ JSON.stringify(newState));
    this.setState(newState);
  }
  _save() {
    var self = this,
        df = DynamicForm.instance,
        saveopt = {
          form: this.props.view,
          body: this.state.value._id && Object.assign(this.state.value, this.state.changeddata) || this.state.changeddata
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
        console.log ('successful save');
        if (saveopt.parent) {
          // inform Parent RecordList to update record and close edit window.
          this.props.navTo('save', succVal);
        } else {
          var navto = "#Form?gid=" + saveopt.form+":"+succVal._id;
          window.location.href = navto;
        }
      } else {
        console.log ('save error: ' + JSON.stringify(succVal));
        self.setState({errors: JSON.stringify(succVal.data)});
      }
    });
  }

  _delete() {
    var self = this,
        df = DynamicForm.instance,
        saveopt = {
          form: this.props.view,
          id: this.state.value._id
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
        self.props.navTo('delete', succVal);
      } else {
        window.location.href = "#RecordList?gid="+this.props.view;
      }
    });
  }

  render() {

    var self = this,
        df = DynamicForm.instance,
        metaview = df.getForm (this.props.view),
        nonchildformfields = metaview.fields.filter(m => m.type !== 'childform');

    let header = React.createElement (ListHeader, Object.assign ({key: +metaview._id+":"+(self.state.value && self.state.value._id || "new"), formName: metaview.name}, this.state.edit && {
      saveButton: this._save.bind(this),
      cancelButton: () => {
        if (this.props.parent) {
          this.props.navTo('cancel');
        } else {
          if (this.state.value._id) {
            // edit an existing record, go to view using url (keep history)
            window.location.href = "#Form?gid="+this.props.view+":"+this.props.value._id;
          } else {
            // creating a new record, goto list
            window.location.href = "#RecordList?gid="+this.props.view;
          }
      }
    }} || {
      deleteButton: this._delete.bind(this),
      editButton: () =>  {
        if (this.props.parent)
          this.setState ({edit: true});
        else
          window.location.href = "#Form?gid="+this.props.view+":"+this.props.value._id+"&e=1";
      }
    }));

    console.log ('FormMain render ' + metaview.name + ', state : ' + JSON.stringify(this.state));
    return (
    <section>
      { header}
      <div className="slds-form--stacked slds-grid slds-wrap" style={{padding: "1em"}}>
        <div className="slds-col--padded slds-size--1-of-2 slds-medium-size--1-of-2">
          {nonchildformfields.map(function(field, i) {
            let record = self.state.value;
            if (!field.show_when || eval(field.show_when)) return (
            <div className={"slds-form-element" + (field.required && " slds-is-required" || "") + ((field.required && !self.state.value[field.name]) && " slds-has-error" || "")}>

                <label className="slds-form-element__label">{field.title}</label>
                <div className="slds-form-element__control"  style={{marginLeft: self.state.edit && '0' || "15px"}}>
                  <Field fielddef={field} value={self.state.value[field.name]} edit={self.state.edit} onChange={self._fieldChange.bind(self)}/>
                </div>

            </div>
          );})}
        </div>
      </div>
    </section>
    );
  }
}
FormMain.propTypes = {  crud: React.PropTypes.string, value: React.PropTypes.object  };
FormMain.defaultProps = { crud: "r", value: {} };

// RecordList - list of records, supports inline editing of embedded docs.
export class RecordList extends Component {
  constructor(props) {
    super(props);
    console.log ('RecordList InitialState : ' + JSON.stringify(this.props.value));
    this.state = { value: this.props.value || [], editrow: false };
  }
  componentDidMount() {
    let df = DynamicForm.instance;
    if (!this.props.value && this.props.urlparam && this.props.urlparam.view) {
      console.log ('RecordList componentDidMount, got url para so running query : ' + JSON.stringify(this.props.urlparam.view));
      df.query ({form: this.props.urlparam.view}).then(succRes => this.setState({ value: succRes}));
    }
  }

  _delete (e) {

  }
  _edit (id, edit) {

    if (this.props.parent) {
      console.log ('RecordList : want to edit a imbedded doc : ' + id);
      this.setState({editrow: {id: id, crud: !id && "c" || edit && "u" || "r"}});
    } else if (this.props.urlparam) {
      //this.props.navTo(
      let nurl = "#Form?gid=" + this.props.urlparam.view + (id && ":" + id || "") + (edit && "&e=true" || "");
      console.log ("RecordList : _edit: " + nurl);
      window.location.href = nurl;
    }
  }
  _formDoneNavTo (operation, res) {
    console.log ('RecordList _formDone() ' + JSON.stringify(res));
    if (res) {
      console.log ('RecordList _formDone() update of row ' + JSON.stringify(this.state.editrow));
      if (operation === 'save') {

        if (this.state.editrow.id) {
          var newVals = seq(this.state.value,
            map(x => x._id === this.state.editrow.id && res || x));
        } else {
          this.state.value.push(res);
          var newVals = this.state.value;
        }

      } else if (operation === 'delete') {
        var newVals = this.state.value.filter (r => r._id !== this.state.editrow.id);
      }
      this.setState ({value: newVals, editrow: false});
    } else {
      console.log ('RecordList _formDone() no data, must be cancel');
      this.setState ({editrow: false});
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.value) {
      console.log ('RecordList componentWillReceiveProps : got data from parent prop: ' + JSON.stringify(nextProps.value));
      this.setState ({value: nextProps.value});
    }
  }

  render() {
    console.log ('RecordList rendering ' + JSON.stringify(this.state.editrow));
    var self = this,
        df = DynamicForm.instance,
        metaview = df.getForm (this.props.urlparam && this.props.urlparam.view || this.props.view),
        nonchildformfields = metaview.fields && metaview.fields.filter(m => m.type !== 'childform') || [];

    return (
      <div className="slds-grid">
        <div className="slds-col--padded slds-size--1-of-2 slds-large-size--1-of-4">
        <div className="grid-card" style={{padding: "0px"}}>
        { !this.state.editrow &&
      <ListHeader key={metaview._id} formName={metaview.name} newButton={self._edit.bind(this, null, true)}/>
        }
      <div className="box-body table-responsive no-padding">
        { this.state.editrow &&
        <FormMain  value={this.state.editrow.id && self.state.value.filter(r => r._id === this.state.editrow.id)[0] || {}} view={metaview._id} crud={this.state.editrow.crud} parent={this.props.parent} navTo={this._formDoneNavTo.bind(this)}/>
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
                  <span className="slds-truncate">{field.name}</span>
                </th>
              );})}
            </tr>
          </thead>
          <tbody>
            { self.state.value.map(function(row, i) { return (
              <tr className="slds-hint-parent">
                  <td className="slds-row-select">
                    <a className="slds-button slds-button--brand" onClick={self._edit.bind(self, row._id, true)}>edit </a>
                    { !self.props.parent &&
                    <a className="slds-button slds-button--brand" onClick={self._edit.bind(self, row._id, false)}>view </a>
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
  </div>
</div>
    )
  }
}

export class ListHeader extends Component {
  render() {
    return (
      <div className="slds-page-header">
        <div className="slds-grid">
          <div className="slds-col slds-has-flexi-truncate">

            <div className="slds-media">
              <div className="slds-media__figure">
                <SvgIcon spriteType="utility" spriteName="add"/>
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
                <button onClick={this.props.newButton}  className="slds-button slds-button--brand" >
                  new
                </button>
                }
                { typeof this.props.editButton !== "undefined" &&
                <button onClick={this.props.editButton}  className="slds-button slds-button--brand" >
                  edit
                </button>
                }
                { typeof this.props.deleteButton !== "undefined" &&
                <button onClick={this.props.deleteButton}  className="slds-button slds-button--brand" >
                  delete
                </button>
                }
                { typeof this.props.cancelButton !== "undefined" &&
                <button onClick={this.props.cancelButton}  className="slds-button slds-button--brand" >
                  cancel
                </button>
                }
                { typeof this.props.saveButton !== "undefined" &&
                <button onClick={this.props.saveButton}  className="slds-button slds-button--brand" >
                  save
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
