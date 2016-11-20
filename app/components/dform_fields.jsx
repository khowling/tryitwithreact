'use strict;'

import React, {Component} from 'react';
//import ReactDOM from 'react-dom';
import jexl from 'jexl';

import Router from './router.jsx';

import ProgressBar from 'progressbar.js'
import {Modal, SvgIcon, IconField, Alert, UpdatedBy } from './utils.jsx';
import {ListMain, FormMain, RecordMain}       from './dform.jsx';
import {FormHeader}       from './headers.jsx';

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
    //console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value != this.props.value) {
      //console.log ('the field value has been updated by the form, update the field (this will override the field state)');
      this.setState({value: nextProps.value});
    }
  }

  /*******************/
  /* Image Functions */
  /*******************/
  componentDidMount() {
    if (this.props.edit) {
      this.line = new ProgressBar.Line(this.refs.progressline, {color: '#FCB03C'})
    }
  }

  componentWillUnmount () {
    if (this.line) this.line.destroy();
  }

  _clickFile() {
    this.refs.imageinput.click();
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
                  <FormHeader form={this.state.filemeta}/>
                </div>
                <div className="slds-modal__content" style={{padding: "0.5em", minHeight: "400px"}}>
                  <ListMain form={this.state.filemeta} value={this.state.picFileList} selected={this._selectedFile}/>
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
    let resetLookup = {visible: false, values: [] };


    if (!data) {
      console.log ('Field _handleLookupSelectOption, clear field state, then update parent ['+this.props.fielddef.name+']');
      this.setState ({value: null, lookup: resetLookup}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: null});
      });
    } else {
      //lookupval ={_id: data._id, search_ref: data} ;
      console.log ('Field _handleLookupSelectOption, set field state, then update parent ['+this.props.fielddef.name+'] : ' + JSON.stringify(data));
      this.setState ({value: data, lookup: resetLookup}, () => {
        if (this.props.onChange)
          this.props.onChange ({[this.props.fielddef.name]: data});   // {_id: data._id}});  IMPORTANT: This is so primary fields work!!!
      });
    }
  }

  _newLookupRecord(row) {
    console.log ("Field _newLookupRecord got new lookup record : " + JSON.stringify (row));
    this.refs.lookupinput.value = "";
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
      console.log (`referenceForm called ${sform.name} ${JSON.stringify(rec)}`);
      if (!rec) {
        return  <span style={{color: "red"}}><IconField value={sform.icon} small={true}/>no data</span>;
      } else if (rec.error) {
        return  <span key={rec._id} style={{color: "red"}}><IconField value={sform.icon} small={true}/>{rec.error}</span>;
      } else {
        let priimage = <span>no image</span>, pritext = <span>no text</span>;
        for (let fld of sform.fields) {
          if (fld.display === 'primary') {
            console.log (`referenceForm ${fld.type} ${JSON.stringify(rec[fld.name])}`);
            if (fld.type === 'icon' || fld.type === 'image')
              priimage = <Field fielddef={fld}  value={rec[fld.name]} inlist={true} />;
            else if (fld.type === "reference" && fld.search_form._id === df.getFormByName("iconSearch")._id )
              priimage = <IconField value={rec[fld.name]} small={true}/>;
            else
              pritext = <Field fielddef={fld} value={rec[fld.name]}/>;
          }
        }
        if (!priimage)
          priimage = <IconField value={sform.icon} small={true}/>;

        return <span key={rec._id}>{priimage}<span style={{marginLeft: "5px"}}/>{pritext}</span>;

      }
    }

    if (!this.props.edit) {
      if (this.state.value) {
        let sform = this.props.fielddef.search_form && df.getForm (this.props.fielddef.search_form._id);
        if (sform) {
          // this is here for the "metadata" - inline edit screen!
          if (this.state.value._id && sform.store === "metadata") {
            this.state.value = sform._data.find(x => x._id === this.state.value._id) || { error: `missing id ${this.state.value._id}`};
          }

          if (this.props.fielddef.createnew_form)
            field = (<span className="slds-pill">
                        <a href={Router.URLfor(true,"RecordPage", this.props.fielddef.createnew_form._id, this.state.value._id)} className="slds-pill__label">
                          { referenceForm(sform, self.state.value) }
                        </a>
                      </span>);
          else
            field = (<span className="slds-pill__label">{ referenceForm(sform, self.state.value) }</span>);
        } else
          field = <Alert type="error" message={"Missing Metadata: " + this.props.fielddef.search_form}/>;

      } else  {
        field = (<span/>);
      }
    } else {
      console.log ('referencefield get search_form : ' + JSON.stringify(this.props.fielddef.search_form));
      let sform = this.props.fielddef.search_form && df.getForm (this.props.fielddef.search_form._id),
          cform = this.props.fielddef.createnew_form && df.getForm (this.props.fielddef.createnew_form._id);
      if (sform) {
        field = <div className={`slds-lookup ${this.state.lookup.visible && 'slds-is-open' || ''}`}>
                <div className={`${this.state.value && 'slds-pill-container' || 'slds-input-has-icon slds-input-has-icon--right'}`}>


                  { this.state.value &&
                  <span className="slds-pill slds-size--1-of-1">
                    <a href={cform && Router.URLfor(true, "RecordPage", cform._id, this.state.value._id)} className="slds-pill__label">
                      { referenceForm(sform, self.state.value) }
                    </a>
                    <button onClick={self._handleLookupSelectOption.bind (self, null)} className="slds-button slds-button--icon-bare">
                      <SvgIcon spriteType="utility" spriteName="close" small={true} classOverride="slds-button__icon icon-utility"/>
                      <span className="slds-assistive-text">Remove</span>
                    </button>
                  </span>
                  ||
                  <span>
                  <a onClick={this._handleLookupKeypress.bind(this, {target: {value: true}})}><SvgIcon spriteType="utility" spriteName="search" small={true} classOverride="slds-input__icon"/></a>

                  <input className="slds-lookup__search-input slds-input"  type="text" ref="lookupinput" onChange={this._handleLookupKeypress.bind(this)}  disabled={this.state.value && "disabled" || ""}></input>
                  </span>
                  }
              </div>
              { this.state.lookup.create &&
                <Modal>
                  <div className="slds-modal__container w95">
                    <div style={{padding: "0.5em", background: "white"}}>
                      <FormHeader form={cform}/>
                    </div>
                    <div className="slds-modal__content" style={{padding: "0", minHeight: "350px"}}>
                      <FormMain key={"model-"+this.props.fielddef.name} form={cform} value={this.state.lookup.createValue} crud="c" onComplete={this._newLookupRecord.bind(this)}/>
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
                       <a onClick={this._openCreate.bind(this, this.refs.lookupinput.value)} role="option">
                         <SvgIcon spriteType="utility" spriteName="add" small={true} classOverride="icon-utility"/>
                         Create {cform.name + ' "' + this.refs.lookupinput.value + '"'}
                       </a>
                     </li>
                    }
                    </ul>
                  </div>
                }
              </div>;
      } else {
        field = <Alert type="error" message={"no search_form found in app " + (this.props.fielddef.search_form && this.props.fielddef.search_form._id)}/>;
      }
    }
    return field;
  }

}

export class FieldDate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      date: {date: new Date(props.value), visible: false, montharray: [] },
      time: {visible: false},
    };
  }

  _display_date(indate) {
    if (indate) {
      let outDate;
      if (typeof indate === "object") {
        outDate = indate;
      } else if (indate.length < 10 || isNaN(Date.parse(indate))) {
        return {date_str: indate, time_str: 'error'};
      } else {
        outDate =  new Date(Date.parse(indate));
      }
      return {date_str: outDate.toLocaleDateString(), time_str: outDate.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', hour12: true})};
    } else
      return {date_str: '', time_str: ''};
  }

  _construct_date(date_str, time_str) {
    if (date_str) {
      let date_arr;
      if (typeof date_str === 'string') {
        date_arr = date_str.split('/');
      } else if (typeof date_str === 'object') {
        date_arr = [ date_str.getDate(), date_str.getMonth()+1, date_str.getFullYear()];
      }
      if (date_arr.length === 3) {
        let time_arr = time_str ? time_str.replace(/ [ap]m/,'').split(':') : [12,0];

        if ((time_str && time_str.indexOf('am') > -1) === true && parseInt(time_arr[0])  == 12)
          time_arr[0] = 0;
        else if (parseInt(time_arr[0]) < 12 ) {
          time_arr[0] = parseInt(time_arr[0]) + 12;
        }
        let date_candidate = new Date(date_arr[2], date_arr[1]-1, date_arr[0], time_arr[0] || 12, time_arr[1] || 0);
        if (!isNaN( date_candidate))
          return date_candidate;
      }
    }
    return null;
  }

  _update_date(existingdate_str, date_str, time_str) {
    let new_date = this._construct_date(date_str, time_str),
        new_date_str = new_date ? new_date.toISOString() : date_str;

    console.log (`change : [new ${new_date_str}] [existing: ${existingdate_str}]`);
    if (new_date_str != existingdate_str && this.props.onChange) {
        this.props.onChange ({[this.props.fielddef.name]: new_date_str});
    }
  }

  /*******************/
  /* Common          */
  /*******************/

  componentWillReceiveProps(nextProps) {
    if (this.props.edit) {
      console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
      if (nextProps.value != this.props.value) {
        console.log ('the field value has been updated by the form, update the field (this will override the field state)');
        let {date_str, time_str} = this._display_date(nextProps.value);
        this.refs.input_date.value = date_str;
        this.refs.input_time.value = time_str;
        //this.setState({display_date: this._display_date(nextProps.value)});
      }
    }
  }
  componentDidMount() {
    if (this.props.edit) {
      let {date_str, time_str} = this._display_date(this.props.value);
      this.refs.input_date.value = date_str;
      this.refs.input_time.value = time_str;
    }
  }

  /*******************/
  /* Date  Functions */
  /*******************/
  _manualDateChange(e) {
    this._update_date(this.props.value, e.target.value, this.refs.input_time.value);
  }
  _manualTimeChange(e) {
    this._update_date(this.props.value, this.refs.input_date.value, e.target.value);
  }
  _pickTimeChange(time) {
    this.setState({time: {visible: false}}, () => {
      this._update_date(this.props.value, this.refs.input_date.value, time);
    });
  }

  _changeYear(e) {
    console.log (`year : ${e.target.value}`);
    this._showDate(null, null, e.target.value);
  }
  _showDate(selectday, chmnth, chyear) {
    if (this.state.date.visible && (!selectday) && (!chmnth) && (!chyear)) {
      this.setState ({date: {visible: false}});
    } else {
      if (selectday) {
        console.log (`_showDate selectday ${selectday}`);
        let newDate = new Date(this.state.date.year, this.state.date.month, selectday, 0,0,0);
        this.setState ({date: {visible: false}}, () => {
          this._update_date(this.props.value, newDate, this.refs.input_time.value);
        });
      } else {

        let start_date = this.state.date.visible ? new Date(this.state.date.year, this.state.date.month, 1) : this._construct_date(this.refs.input_date.value) || new Date();
        console.log (`_showDate chmnth ${chmnth} chyear ${chyear}`);
        if (chmnth)
          start_date.setMonth(start_date.getMonth() + chmnth);
        else if (chyear)
          start_date.setFullYear(chyear);


        let montharray = [],
            daycnt = 0,
            today = start_date.getDate(),
            firstDoW = new Date(start_date.getFullYear(), start_date.getMonth(), 1).getDay(), // day of week [0-6]
            lastDoM = new Date(start_date.getFullYear(), start_date.getMonth(), 0).getDate(); // day of month [1-31]

        for (let wkidx of [0,1,2,3,4,5]) {
          montharray[wkidx] = [];
          for (let dayidx of [0,1,2,3,4,5,6]) {
            if (wkidx == 0 && dayidx == firstDoW) daycnt = 1; // found 1st day of month, start the count up
            montharray[wkidx][dayidx] = "";
            if (daycnt >0 && daycnt <= lastDoM)  montharray[wkidx][dayidx] = daycnt++;
          }
          if (daycnt > lastDoM)  break;
        }
        this.setState ({date: {visible: true, today: today, month: start_date.getMonth(), year: start_date.getFullYear(), montharray: montharray }})
      }
    }
  }
  _showTime() {
    if (this.state.time.visible) {
      this.setState ({time: {visible: false}});
    } else {
      this.setState ({time: {visible: true}});
    }
  }

  render() {
    if (!this.props.edit) {
      return (
         <span>{this.props.value && new Date(this.props.value).toLocaleString() || ""}</span>
       );
    } else {
      let self = this;
      return (
        <div className="form-element__group slds-form--compound">
        <div className="slds-form-element__row">

          <div className="slds-form-element__control slds-size--6-of-12">
            <div className="slds-input-has-icon slds-input-has-icon--right">
              <a onClick={this._showDate.bind(this,null,null,null)}><SvgIcon spriteType="utility" spriteName="event" small={true} classOverride="slds-input__icon" /></a>
              <input ref="input_date" className="slds-input" type="text" placeholder="Pick a Date"  onBlur={this._manualDateChange.bind(this)}/>
            </div>
          </div>



          { this.state.date.visible &&
          <div className="slds-dropdown slds-dropdown--left slds-datepicker">
            <div className="slds-datepicker__filter slds-grid">
              <div className="slds-datepicker__filter--month slds-grid slds-grid--align-spread slds-size--3-of-4">
                <div className="slds-align-middle">
                  <button onClick={this._showDate.bind(this,null,-1,null)} className="slds-button slds-button--icon-container">
                    <SvgIcon spriteType="utility" spriteName="left" small={true}/>
                    <span className="slds-assistive-text">Previous Month</span>
                  </button>
                </div>
                <h2 id="month" className="slds-align-middle" aria-live="assertive" aria-atomic="true">{["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
][this.state.date.month]}</h2>
                <div className="slds-align-middle">
                  <button onClick={self._showDate.bind(self,null,1,null)} className="slds-button slds-button--icon-container">
                    <SvgIcon spriteType="utility" spriteName="right" small={true}/>
                    <span className="slds-assistive-text">Next Month</span>
                  </button>
                </div>
              </div>
              <div className="slds-picklist slds-picklist--fluid slds-shrink-none">
                <select className="slds-select" onChange={this._changeYear.bind(this)} defaultValue={this.state.date.year} style={{paddingRight: "1rem", paddingRight: "5px", paddingLeft: "10px", fontSize: "0.75rem", font: '100% / 1.5 "Salesforce Sans", Arial, sans-serif'}}>
                  <option value="2014">2014</option>
                  <option value="2015">2015</option>
                  <option value="2016">2016</option>
                  <option value="2017">2017</option>
                  <option value="2018">2018</option>
                  <option value="2019">2019</option>
                </select>
              </div>
            </div>
            <table className="datepicker__month" role="grid" aria-labelledby="month">
              <thead>
                <tr id="weekdays">
                  { ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) =>{ return (
                    <th key={i}><abbr>{day}</abbr></th>
                )})}
                </tr>
              </thead>
              <tbody>
                { this.state.date.montharray.map((wkarray, i) =>{ return (
                    <tr key={i}>
                    { wkarray.map((day, i) =>{ return (
                      <td key={i} className={day.length == 0 &&  "slds-disabled-text" || (day == this.state.date.today && "slds-is-today" || "")}>
                        <span className="slds-day" onClick={self._showDate.bind(self, day)}>{day}</span>
                      </td>
                    )})}
                    </tr>
                )})}
              </tbody>
            </table>
          </div>
          }


          <div className="slds-form-element__control slds-size--6-of-12">
            <div className="slds-input-has-icon slds-input-has-icon--right">
              <a onClick={this._showTime.bind(this)}><SvgIcon spriteType="utility" spriteName="clock" small={true} classOverride="slds-input__icon" /></a>
              <input ref="input_time" className="slds-input" type="text" placeholder="Time" onBlur={this._manualTimeChange.bind(this)}/>
            </div>
          </div>
          { this.state.time.visible &&
          <div className="slds-lookup__menu" role="listbox" style={{right: "0px", width: "52%"}}>
           <ul className="slds-lookup__list" role="presentation">
             { ["9:00 am", "9:30 am", "10:00 am", "10:30 am", "11:00 am", "11.30 am", "8:00 pm"].map((time, i) =>{ return (
             <li className="slds-lookup__item">
               <a id="s01" onClick={this._pickTimeChange.bind(this, time)} role="option">{time}</a>
             </li>
             )})}
            </ul>
           </div>
           }
          </div>
        </div>
      );
    }
  }
}

export const Field = ({fielddef, value, edit, inlist, onChange}) => {

  /**************************/
  /* inline Data  Functions */
  /**************************/
  let _inlineDataChange = function(val) {
    //console.log ("Field: _inlineDataChange : got update from List : " + JSON.stringify(val));
    if (onChange)
      onChange ({[fielddef.name]: val.data});
  };
  /****************************/

  let _handleValueChange = function(event) {
    let newval = event.target.value;
    if (fielddef.type === "boolean") {
      newval = event.target.checked;
    }
    //console.log (`Field handleValueChange <${typeof newval}>:  ${newval}`);
    onChange ({[fielddef.name]: newval});
  };


  //console.log (`Field ${fielddef.name} : ${JSON.stringify(value)}`);
  let field,
      self = this,
      df = DynamicForm.instance;

  if (fielddef.type === "image") {
    field = (<FieldImage fielddef={fielddef} value={value} edit={edit} onChange={onChange} inlist={inlist}/>);
  } else if (fielddef.type === "reference") {
    field = (<FieldReference fielddef={fielddef} value={value} edit={edit} onChange={onChange} inlist={inlist}/>);
  } else if (fielddef.type === "datetime") {
    field = (<FieldDate fielddef={fielddef} value={value} edit={edit} onChange={onChange} inlist={inlist}/>);
  } else if (!edit) switch (fielddef.type) {
      case 'text':
      case 'email':
      case 'textarea':
      case 'formula':
        field = (<span>{value}</span>);
        break;
      case 'boolean':
        field = (<input name="checkbox" type="checkbox" checked={value} disabled="1" />);
        break;
      case 'jsonarea':
        field = (<span>{JSON.stringify(value, null, 4)}</span>);
        break;
      case 'dropdown':
        let ddopt = value &&  fielddef.dropdown_options.filter(f => f.key === value)[0];
        field = (<span>{ddopt && ddopt.name || (value && 'Unknown option <' + value +'>' || '')}</span>);
        break;
      case "dropdown_options":
        let cform = fielddef.child_form && df.getForm(fielddef.child_form._id);
        if (cform)
          field = (<ListMain form={cform} inline={true} value={{status: "ready", records: value}} viewonly={true}/>);
        else
          field = (<div>{fielddef.child_form} not part of applicatiohn</div>);
        break;
      case 'childform':
        //let cform = MetaStore.getForm (fielddef.child_form);
        //field = <ChildForm form={cform} value={value}/>;
        field = (<span>childform not supported here</span>);
        break;
      case "icon":
        if (value)
            field = (<span><SvgIcon spriteType={value.type} spriteName={value.name} small={true}/></span>);
        else
          field = (<span/>);
        break;
      default:
        field = <span>Unknown fieldtype {fielddef.type}</span>;
        break;
  } else switch (fielddef.type) {
    case 'text':
    case 'email':
      field =  <input type="text" className="slds-input" placeholder={fielddef.placeholder} value={value} onChange={_handleValueChange}/>;
      break;
    case 'textarea':
    case 'formula':
      field = <textarea className="slds-input" rows="3" placeholder={fielddef.placeholder} value={value} onChange={_handleValueChange}></textarea>;
        break;
    case 'boolean':
      field = (<input type="checkbox" checked={value} onChange={_handleValueChange} />);
      break;
    case 'jsonarea':
        field = <textarea className="slds-input" rows="3" placeholder={fielddef.placeholder} value={value} onChange={_handleValueChange}></textarea>;
        break;
    case 'dropdown':
      field = <select className="slds-input" value={value} onChange={_handleValueChange}>
                    <option value="">-- select --</option>
                    {fielddef.dropdown_options.map (function(opt, i) { return (
                    <option key={i} value={opt.key}>{opt.name}</option>
                    );})}
                  </select>;
      break;
    case 'childform':
      field = <div></div>;
      break;
    case 'dropdown_options':
      let cform = fielddef.child_form && df.getForm(fielddef.child_form._id);
      if (cform)
        field = (<ListMain form={cform} inline={true} value={{status: "ready", records: value || [] }}  onDataChange={_inlineDataChange}/>);
      else
        field = (<div>{fielddef.child_form} not part of applicatiohn</div>);
      break;
    default:
      field = <div>Unknown fieldtype {fielddef.type}</div>;
      break;
  };
  return field;
}
