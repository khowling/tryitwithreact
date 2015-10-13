'use strict;'

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';
import jexl from 'jexl';

import Router from './router.jsx';

import ProgressBar from 'progressbar.js'
import {Modal, SvgIcon, IconField, Alert, UpdatedBy } from './utils.jsx';
import {PageHeader, ListMain, FormMain, RecordMain}       from './dform.jsx';

import DynamicForm from '../services/dynamicForm.es6';

export class FieldImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value, // needs to be mutatable
      picselectexisting: false,
      picFileList: {state: "wait", records: []}
    };
    this._selectedFile = this._selectedFile.bind(this);
  }

  /*******************/
  /* Common          */
  /*******************/
  componentWillReceiveProps(nextProps) {
    console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value != this.props.value) {
      console.log ('the field value has been updated by the form, update the field (this will override the field state)');
      this.setState({value: nextProps.value});
    }
  }

  /*******************/
  /* Image Functions */
  /*******************/
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
        this.line.animate(Math.round(progressEvt.loaded / progressEvt.total));
      } else {
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
    // console.log ("There was an error attempting to upload the file:" + JSON.stringify(errEvt));
     alert (`Upload failed: ${errEvt}`);
     this.line.set(0);
   });
   return false;
  }

  _selectExisting() {
    let df = DynamicForm.instance,
        filemeta = df.getFormByName('FileMeta');
    if (filemeta) {
      this.setState({picselectexisting: true, filemeta: filemeta}, () => {
        df.listFiles().then(succVal => {
          this.setState({picFileList: {state: "wait", records: succVal}});
        });
      });
    } else {
      alert ("'FileMeta' not part of the application");
    }
  }
  _selectedFile(filename) {
    let fileid = filename  || this.state.value;
    console.log ('called _selectedFile with:' + JSON.stringify(filename));
    this.setState({value: fileid, picselectexisting: false, filemeta: null}, () => {
      if (this.props.onChange)
        this.props.onChange ({[this.props.fielddef.name]: fileid});
      });
  }

  render() {
    let df = DynamicForm.instance,
        img_src = this.state.value && df.host+"/dform/file/"+this.state.value || "http://placehold.it/120x120";

    if (!this.props.edit) {
      let marginBott = !this.props.inlist && {marginBottom: "4px"} || {};
      return (
        <div className={this.props.inlist && "slds-avatar slds-avatar--circle slds-avatar--x-small"} style={marginBott}>
          <img style={{maxHeight: "150px"}} src={img_src} alt="message user image"/>
        </div>);

    } else {

      return (
        <div>
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
              <div className="slds-modal__container w95">
                <div style={{padding: "0.5em", background: "white"}}>
                  <PageHeader view={this.state.filemeta}/>
                </div>
                <div className="slds-modal__content" style={{padding: "0.5em", minHeight: "400px"}}>
                  <ListMain view={this.state.filemeta} value={this.state.picFileList} selected={this._selectedFile}/>
                </div>
                <div className="slds-modal__footer"></div>
              </div>
            </Modal>
          }
        </div>
      );
    }
  }
}

export class FieldReference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lookup: { visible: false, values: [], create: false, offercreate: false},
      value: props.value // needs to be mutatable
    };
  }

  /*******************/
  /* Common          */
  /*******************/
  componentWillReceiveProps(nextProps) {
    console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value != this.props.value) {
      console.log ('the field value has been updated by the form, update the field (this will override the field state)');
      this.setState({value: nextProps.value});
    }
  }

  /********************/
  /* Lookup Functions */
  /********************/

  _openCreate(val) {

    this.setState({lookup: {create: true, visible: false, values: [], createValue: {status: "ready", record: {name: val}}}});
  }

  _handleLookupKeypress(e) {
    let inval = e.target.value,
        df = DynamicForm.instance,
        sform = this.props.fielddef.search_form && df.getForm(this.props.fielddef.search_form._id);

    if (!inval)
      this.setState({lookup: {visible: false, fields: null, values: [], offercreate: false}});
    else if (sform.store === "metadata") {
      console.log ("its from meta : " + JSON.stringify(sform._data));
      // TODO : need text search logic here
      this.setState({lookup: {visible: true, fields: sform.fields, values: sform._data, offercreate: false}});
    } else {
      console.log ('_handleLookupKeypress: ' + inval);
      let setLookupVals = () => {
        df.search(sform._id, inval).then(succVal => {
          if (this.props.fielddef.search_form._id === "303030303030303030343030") { //'metaSearch'
            succVal = succVal.concat( df.appMeta) ;
          }
          this.setState({lookup: {visible: true, fields: sform.fields, values: succVal, offercreate: true}});
        });
      };
      if (this.state.lookup.visible == false)
        this.setState({lookup: {visible: true, values:[], create: false}}, setLookupVals );
      else
        setLookupVals();
    }
  }


  _handleLookupSelectOption (data) {
    let lookupval,
        resetLookup = {visible: false, values: [] };

    //React.findDOMNode(this.refs.lookupinput).value = "";

    if (!data) {
      console.log ('Field _handleLookupSelectOption, clear field state, then update parent ['+this.props.fielddef.name+']');
      this.setState ({value: null, lookup: resetLookup}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: null});
      });
    } else {
      lookupval ={_id: data._id, search_ref: data} ;
      console.log ('Field _handleLookupSelectOption, set field state, then update parent ['+this.props.fielddef.name+'] : ' + JSON.stringify(data));
      this.setState ({value: lookupval, lookup: resetLookup}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: lookupval}); // {_id: data._id}}); (this is so dynamic data works!!!)
      });
    }
  }

  _newLookupRecord(row) {
    console.log ("Field _newLookupRecord got new lookup record : " + JSON.stringify (row));
    React.findDOMNode(this.refs.lookupinput).value = "";
    this.setState({value: row, lookup: {create: false, visible: false, values:[]}}, () => {
      if (this.props.onChange)
        this.props.onChange ({[this.props.fielddef.name]: row});
    });
  }


  render() {
    let df = DynamicForm.instance,
        self = this,
        field;
    console.log ('FieldReference render: ' + this.props.fielddef.name + ', state.value : ' + JSON.stringify(this.state.value));

    // function to generate reference search form (for seleced value in edit and view modes, and list values)
    let referenceForm = (sform, rec) => {
      if (typeof rec === "undefined") {
        return  <span style={{color: "red"}}><IconField value={sform.icon} small={true}/>no search_ref</span>;
      } else if (rec.error) {
        return  <span key={rec._id} style={{color: "red"}}><IconField value={sform.icon} small={true}/>{rec.error}</span>;
      } else {
        let gotimageicon = false,
            retform = sform.fields.map(function(fld, fldidx) {

              let genField = function() {
                let fldval = rec[fld.name];
                if (fld.name === "_id") ;
                else if (fld.type === "reference" && fld.search_form._id === df.getFormByName("iconSearch")._id ) {
                  if (fldval) {
                    gotimageicon = true;
                    return (<IconField key={fldidx} value={fldval} small={true}/>);
                  }
                } else if (fld.type !== "reference" && fld.type !== "childform" && fld.type !== "relatedlist") {
                  if (fld.type === "image") gotimageicon = true;
                  return (<Field key={fldidx} fielddef={fld} value={fldval} inlist={true}/>);
                } else
                  return <Alert key={fldidx} message={'"'+fld.type+'" not supported on search form'}/>
              }

              if (fld.show_when) {
                jexl.eval(fld.show_when, {"$rec": rec}, (err, visible) => { //eval(fld.show_when);
                  if (visible) return genField();
                });
              } else
                return genField();
            });

        if (!gotimageicon && sform.icon)
          retform = <span key={rec._id}><IconField value={sform.icon} small={true}/>{retform}</span>;
        return <span key={rec._id}>{retform}</span>;
      }
    }

    if (!this.props.edit) {
      if (this.state.value) {
        let sform = this.props.fielddef.search_form && df.getForm (this.props.fielddef.search_form._id);
        if (sform) {
          // this is here for the "metadata" - inline edit screen!
          if (this.state.value._id && sform.store === "metadata") {
            this.state.value.search_ref = sform._data.find(x => x._id === this.state.value._id);
          }

          if (this.props.fielddef.createnew_form)
            field = (<span className="slds-pill">
                        <a href={Router.URLfor(true,"RecordPage", this.props.fielddef.createnew_form._id, this.state.value._id)} className="slds-pill__label">
                          { referenceForm(sform, self.state.value.search_ref) }
                        </a>
                      </span>);
          else
            field = (<span className="slds-pill">
                        <span className="slds-pill__label">{ referenceForm(sform, self.state.value.search_ref) }</span>
                      </span>);
        } else
          field = <Alert type="error" message={"Missing Metadata: " + this.props.fielddef.search_form}/>;

      } else  {
        field = (<span/>);
      }
    } else {

      let sform = this.props.fielddef.search_form && df.getForm (this.props.fielddef.search_form._id),
          cform = this.props.fielddef.createnew_form && df.getForm (this.props.fielddef.createnew_form._id);
      if (sform) {
        field = <span>
                <div className="slds-pill-container slds-input-has-icon slds-input-has-icon--right" style={{padding: "0"}}>

                  <a onClick={this._handleLookupKeypress.bind(this, {target: {value: true}})}><SvgIcon spriteType="utility" spriteName="search" small={true} classOverride="slds-input__icon"/></a>

                  { this.state.value &&
                  <span className="slds-pill" style={{padding: "0.15rem", margin: "0.18rem"}}>
                    <a href={cform && Router.URLfor(true, "RecordPage", cform._id, this.state.value._id)} className="slds-pill__label">
                      { referenceForm(sform, self.state.value.search_ref) }
                    </a>
                    <button onClick={self._handleLookupSelectOption.bind (self, null)} className="slds-button slds-button--icon-bare">
                      <SvgIcon spriteType="utility" spriteName="close" small={true} classOverride="slds-button__icon icon-utility"/>
                      <span className="slds-assistive-text">Remove</span>
                    </button>
                  </span>
                  ||
                  <input className="slds-input" style={{border: "none"}} type="text" ref="lookupinput" onChange={this._handleLookupKeypress.bind(this)}  disabled={this.state.value && "disabled" || ""}></input>
                  }
              </div>
              { this.state.lookup.create &&
                <Modal>
                  <div className="slds-modal__container w95">
                    <div style={{padding: "0.5em", background: "white"}}>
                      <PageHeader view={cform}/>
                    </div>
                    <div className="slds-modal__content" style={{padding: "0", minHeight: "350px"}}>
                      <FormMain key={"model-"+this.props.fielddef.name} view={cform} value={this.state.lookup.createValue} crud="c" onComplete={this._newLookupRecord.bind(this)}/>
                    </div>
                    <div className="slds-modal__footer">
                    </div>
                  </div>
                </Modal>
              ||
                <div className="slds-lookup__menu" style={{visibility: this.state.lookup.visible && 'visible' || 'hidden'}}>
                  <ul className="slds-lookup__list" role="presentation">

                    {this.state.lookup.values.map(function(row, i) { return (
                    <li key={i} className="slds-lookup__item">
                        <a onClick={self._handleLookupSelectOption.bind (self, row)} role="option">
                          { referenceForm(sform, row) }
                        </a>
                    </li>
                    );})}

                    { this.state.lookup.offercreate && cform &&
                    <li className="slds-lookup__item ">
                       <a onClick={this._openCreate.bind(this, React.findDOMNode(this.refs.lookupinput).value)} role="option">
                         <SvgIcon spriteType="utility" spriteName="add" small={true} classOverride="icon-utility"/>
                         Create {cform.name + ' "' + React.findDOMNode(this.refs.lookupinput).value + '"'}
                       </a>
                     </li>
                    }
                    </ul>
                  </div>
                }
              </span>;
      } else {
        field = <Alert type="error" message={"no search_form " + this.props.fielddef.search_form}/>;
      }
    }
    return field;
  }

}

export class Field extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value, // needs to be mutatable
      lookup: { visible: false, values: [], create: false, offercreate: false},
      date: {visible: false, montharray: [] }
    };
    //console.log ("Field constructor " + props.fielddef.name + "["+props.fielddef.type+"] = " + JSON.stringify(state.value));
  }

  componentWillReceiveProps(nextProps) {
    console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value != this.props.value) {
      console.log ('the field value has been updated by the form, update the field (this will override the field state)');
      this.setState({value: nextProps.value});
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = true;
    //console.log ('Field shouldComponentupdate props: ' + JSON.stringify(nextProps));
     // state: ' + JSON.stringify(nextState));

      // Field is updating itsself, always update
    if (!nextState) {
      if (this.props.fielddef.type === "reference") {
        if (nextProps.value && this.props.edit) {
          shouldUpdate =  false;
        }
      } else if (nextProps.value && nextProps.value === this.props.value) {
        shouldUpdate =  false;
      }
    }
    console.log ('Field shouldComponentupdate : ' + shouldUpdate);
    return shouldUpdate;
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

    let field,
        self = this,
        df = DynamicForm.instance;

    if (this.props.fielddef.type === "image") {
      field = (<FieldImage fielddef={this.props.fielddef} value={this.props.value} edit={this.props.edit} onChange={this.props.onChange} inlist={this.props.inlist}/>);
    } else if (this.props.fielddef.type === "reference") {
      field = (<FieldReference fielddef={this.props.fielddef} value={this.props.value} edit={this.props.edit} onChange={this.props.onChange} inlist={this.props.inlist}/>);
    } else if (!this.props.edit) switch (this.props.fielddef.type) {
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
        case "dropdown_options":
          let cform = this.props.fielddef.child_form && df.getForm(this.props.fielddef.child_form._id);
          field = (<ListMain view={cform} value={{status: "ready", records: this.props.value}} parent={{field: this.props.fielddef}} viewonly={true}/>);
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
          if (this.props.value)
              field = (<span><SvgIcon spriteType={this.props.value.type} spriteName={this.props.value.name} small={true}/></span>);
          else
            field = (<span/>);
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
                        <option key={i} value={opt.key}>{opt.name}</option>
                        );})}
                      </select>;
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
                            <th key={day}><abbr>{day}</abbr></th>
                        )})}
                        </tr>
                      </thead>
                      <tbody>
                        { this.state.date.montharray.map((wkarray, i) =>{ return (
                            <tr key={i}>
                            { wkarray.map((day, i) =>{ return (
                              <td key={i} className={day.length == 0 &&  "slds-disabled-text" || (day == this.state.date.today && "slds-is-today" || "")}>
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
        case 'dropdown_options':
          let cform1 = this.props.fielddef.child_form && df.getForm(this.props.fielddef.child_form._id);
          field = <div></div>; // (<ListMain view={cform1} value={{status: "ready", records: this.state.value }} parent={{field: this.props.fielddef}} onDataChange={this._inlineDataChange.bind(this)}/>);
          break;
        default:
            field = <div>Unknown fieldtype {this.props.fielddef.type}</div>;
            break;
      };
    }

    return field;
  }
}
Field.propTypes = {
  // Core
  fielddef: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired
  }),
  value: React.PropTypes.any,
  // used by lookup and childform (if no onComplete, assume top)
  onChange: React.PropTypes.func,
  edit: React.PropTypes.bool
};
Field.defaultProps = { edit: false};
