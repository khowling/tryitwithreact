const React = require('react/addons');
const { Element, Elements } = require('../lib/util');
const { displayDate } = require("../lib/date");
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const { Link, State } = require("react-router");
const xhr = require('../lib/xhr');
const MetaStore = require('../stores/MetaStore');

var Report = React.createClass({
    getInitialState: function(){
        console.log ('TileList InitialState : ');
        return { open: false, quickview: []};
    },
    handleCollapse: function (event) {
        console.log ('handleCollapse event');
        //Find the box parent
        var box = $(event.currentTarget).parents(".box").first();
        //Find the body and the footer
        var bf = box.find(".box-body, .box-footer");
        if (!box.hasClass("collapsed-box")) {
            box.addClass("collapsed-box");
            //Convert minus into plus
            $(event.currentTarget).children(".fa-minus").removeClass("fa-minus").addClass("fa-plus");
            bf.slideUp();
        } else {
            box.removeClass("collapsed-box");
            //Convert plus into minus
            $(event.currentTarget).children(".fa-plus").removeClass("fa-plus").addClass("fa-minus");
            bf.slideDown();

            console.log ('handleCollapse event, update state: ');

            // get new data!!!
            var rdata = this.props.data.Report__r;
            console.log ('get Quickview for report : ' + rdata.Id);
            var self = this;
            var qsttr = "select Id, Name, Actual__c, Target__c from QuickView__c where Report__c = '"+rdata.Id+"'",
                xhr_opts = {
                    url: _sfdccreds.sf_host_url + _sfdccreds.sfdc_api_version + '/query.json?q=' + qsttr,
                    headers: {  "Authorization": "OAuth " + _sfdccreds.session_api}
                }

            let ch = xhr(xhr_opts, chan(1, t.map(x => x.json)));
            self.setState({ loading: true });
            csp.takeAsync (ch, function(i) {
                self.setState({quickview:  i.records});
            });
        }
    },
    componentWillUpdate( nextProps,  nextState) {
        console.log ('Report componentWillUpdate : ');
        //Use this as an opportunity to perform preparation before an update occurs
        // You cannot use this.setState() in this method

    },
    componentDidMount: function(){
        console.log ('Report componentDidMount: ');
    },
    navToReport: function(id) {
        console.log ('navToReport event : ' + id);
        try {
            console.log ('navToReport got sforce');
            sforce.one.navigateToSObject( id);
        }  catch (e) {
            window.location =  '/apex/OVReport?id=' + id;
        }
    },
    render: function() {
        console.log ('Report render : ');
        var rdata = this.props.data.Report__r;

        var divStyleHidden =  this.state.open == false && { display: 'none' } || {};
        var cx = React.addons.classSet,
            boxclass = cx({
                "box": true,
                "collapsed-box": this.state.open == false,
                "box-success": rdata.Actual__c >= rdata.Target__c,
                "box-warning": rdata.Actual__c < rdata.Target__c}),
            buttongoodbad = cx({
                "btn-kh btn-sm ": true,
                "btn-success": rdata.Actual__c >= rdata.Target__c,
                "btn-warning": rdata.Actual__c < rdata.Target__c}),
            styleupdown = cx({
                "fa": true,
                "fa-arrow-up text-green": rdata.Actual__c >= rdata.Target__c,
                "fa-arrow-down text-red": rdata.Actual__c < rdata.Target__c});

        var chatp = {width: "55%"};

        return (
            <div className="col-xs-12 col-sm-6 col-md-4 col-lg-3">

                <div className={boxclass}>
                    <div className="box-header" data-toggle="tooltip" title="" data-original-title="Header tooltip">
                        <h3 className="box-title">{rdata.Name} <br/>
                            <small>Actual: <code>{rdata.Actual__c}</code></small>
                            <small>Target: <code>{rdata.Target__c}</code></small>
                            <i className={styleupdown}></i></h3>

                        <div className="box-tools pull-right">
                            <button onClick={this.handleCollapse} className={buttongoodbad} data-widget="collapse"><i className="fa fa-plus"></i></button>
                        </div>
                    </div>
                    <div className="box-body" style={divStyleHidden}>
                        <p>{rdata.Summary__c}
                        </p><br/>
                        <div className="box-body no-padding">
                            <table className="table table-striped">
                                <tbody>
                                    <tr>
                                        <th className="wdth-l">QuickView</th>
                                        <th className="wdth-m">Progress</th>
                                        <th className="wdth-s">%</th>
                                    </tr>
                                    {this.state.quickview.map(function(row, i) { return (
                                    <tr>
                                        <td>{row.Name}</td>
                                        <td>
                                            <div className="progress xs">
                                                <div className={React.addons.classSet({"progress-bar": true, "progress-bar-danger": row.Actual__c < row.Target__c, "progress-bar-success":row.Actual__c >= row.Target__c})} style={{width: (row.Actual__c/row.Target__c*100).toFixed(2)+"%"}}></div>
                                            </div>
                                        </td>
                                        <td><span className="badge bg-red">{(row.Actual__c/row.Target__c*100).toFixed(2)} %</span></td>
                                    </tr>
                                    );})}
                                </tbody></table>
                        </div><br/>
                    </div>
                    <div className="box-footer" style={divStyleHidden}>

                        <a className="btn-kh  btn-block btn-success" onClick={this.navToReport.bind(this, rdata.Id)}>
                            <i className="fa fa-play"></i> Open
                        </a>
                    </div>
                </div>
            </div>
        );
    }
});

var ChildForm = React.createClass({
  render: function() {
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
                      <Field fielddef={fld} value={record[fld.name]} />
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
});


var Field = React.createClass({
  //mixins: [React.addons.LinkedStateMixin],
  getInitialState: function() {
    // ES6 Computed Propery names
    return {[this.props.fielddef.name]: this.props.fielddef.default_value, picupload:0 };
  },
  componentWillReceiveProps(nextProps) {
    //console.log ('Field componentWillReceiveProps ' + JSON.stringify(nextProps));
    if (nextProps.value) this.setState ({[this.props.fielddef.name]: nextProps.value});
  },
  handleChange: function(newValue) {
    let newState = {[this.props.fielddef.name]: newValue};
  //  this.setState(newState); // not needed as the change handler is at the form level, that will update props on this child!
    if (this.props.onChange) this.props.onChange (newState);
  },
  _clickFile: function(e) {
    //console.log ('Field _clickFile');
    $(e.currentTarget).siblings("input:file").click();
  },
  _fileuploadhtml5: function(e) {

    var self = this,
        file = e.currentTarget.files[0];


    console.log('Field _fileuploadhtml5 : ' + file.name);
    //var formData = new FormData();   formData.append('file', file);

    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress",  function (evt) {
      console.log ('progress ' + evt.loaded);
      if (evt.lengthComputable) {
        self.setState({picupload: Math.round(evt.loaded * 100 / evt.total)});
      } else {
        self.setState({picupload: 50});
      }
    }, false);

    xhr.addEventListener("load", function (evt) {
       // This event is raised when the server send back a response
       self.setState({picupload : 0});
       console.log ('got :' + JSON.stringify (evt.target));
       self.handleChange (evt.target.responseText);
      //data.documents[field.name] = evt.target.responseText;
     }, false);

     xhr.addEventListener("error", function (evt) {
         console.log ("There was an error attempting to upload the file:" + JSON.stringify(evt));
         picupload.servererr = 'Upload failed';
     }, false);

     xhr.addEventListener("abort", function (evt) {
       picupload.progressVisible = true;
       picupload.servererr = 'Upload aborted';
       console.log ("The upload has been canceled by the user or the browser dropped the connection.");
     }, false);

     xhr.addEventListener("loadstart", function (evt) {
       console.log ('got loadstart:');
     });


     xhr.open("PUT", "/dform/file/"+file.name, true);
     xhr.send(file);
     self.setState({picupload : 5});
     return false;
  },
  render: function() {
    //console.log ('Field render');

    let field;
    if (!this.props.edit) switch (this.props.fielddef.type) {
        case 'text':
        case 'email':
        case 'textarea':
          field = <span>{this.props.value}</span>
          break;
        case 'dropdown':
          let option = this.props.fielddef.dropdown_options.filter(f => f.value === this.props.value)[0];

          field = <span>{option && option.name || 'Unknown option <' + this.props.value +'>'}</span>
          break;
        case 'lookup':
          field = <a  href={"#Form?gid="+this.props.fielddef.createnew_form+":"+this.props.value.id}>{this.props.value.primary}</a>;
          break;
        case 'childform':
          let cform = MetaStore.getForm (this.props.fielddef.child_form);
          field = <ChildForm form={cform} value={this.props.value}/>;
          break;
        case 'image':
          field = <div className="pictureAndText">
                    <img height="120"  src={this.props.value && "/dform/file/"+this.props.value || "http://placehold.it/120x120"} alt="message user image"/>
                  </div>
          break;
        default:
          field = <span>Unknown fieldtype {this.props.fielddef.type}</span>;
          break;
    } else {

      var valueLink = {
        value: this.state[this.props.fielddef.name],
        requestChange: this.handleChange
      };

      switch (this.props.fielddef.type) {
        case 'text':
        case 'email':
          field =  <input type="text" className="form-control" placeholder={this.props.fielddef.placeholder} valueLink={valueLink}/>;
          break;
        case 'textarea':
          field = <textarea className="form-control" rows="3" placeholder={this.props.fielddef.placeholder} valueLink={valueLink}></textarea>;
            break;
        case 'dropdown':
          field = <select className="form-control" valueLink={valueLink}>
                        {this.props.fielddef.dropdown_options.map (function(opt, i) { return (
                        <option value={opt.value}>{opt.name}</option>
                        );})}
                      </select>;
            break;
        case 'lookup':
            field = <div className="input-group">
                        <input type="text" className="form-control"/>
                        <span className="input-group-addon"><i className="fa fa-search"></i></span>
                      </div>;
            break;
        case 'childform':
            field = <div></div>;
            break;
        case 'image':
            field =  <div className="pictureAndText">
                        <input type="file"  name="file" style={{display: "none"}} accept="image/*" onChange={this._fileuploadhtml5} />
                        <img height="120" src={this.props.value && "/dform/file/"+this.props.value || "http://placehold.it/120x120"} alt="message user image"/>
                        {this.state.picupload == 0 &&
                        <a className="imglable" onClick={this._clickFile}>Upload Picture <i className="fa fa-arrow-circle-right"></i></a>
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
});

var Form = React.createClass({
  getInitialState: function(){
      console.log ('Form InitialState : ' + JSON.stringify(this.props.urlparam));
      return { recorddata: {}, changeddata: {}, edit: this.props.urlparam.e && true || false};
  },
  componentDidMount: function() {
    if (this.props.urlparam.id) {
      MetaStore.dataReq ({opt: 'dform', form: this.props.urlparam.view, q: {_id: this.props.urlparam.id}, finished: this._gotServerData});
    } else {
      this.setState({ recorddata: {}, edit: true});
    }
  },
  _gotServerData: function(req) {
    console.log ('Form _gotServerData');
    if (this.isMounted()) {
      if (req.opt === 'dform') {
        this.setState({ recorddata: req.data[0]});
        console.log ('Form _gotServerData : '+ JSON.stringify(this.state.recorddata));
      }
    }
  },
  _fieldChange: function(d) {
    console.log ('Form _fieldChange : '+ JSON.stringify(d));
    this.setState(
      { recorddata: Object.assign(this.state.recorddata, d),
         changeddata: Object.assign(this.state.changeddata, d)});
  },
  _save: function() {
    var self = this,
        savechanges = this.state.recorddata._id && Object.assign({_id: this.state.recorddata._id}, this.state.changeddata) || this.state.changeddata;

    console.log ('Form _save : '+ JSON.stringify(savechanges));
    MetaStore.save ({opt: 'dform', form: this.props.urlparam.view, body: savechanges, finished: function(d) {
      console.log ('Form _save, response from server : ' + JSON.stringify(d));
      self.props.navTo('Form?gid='+self.props.urlparam.view+':'+d.data._id);
      }});
  },
  _delete: function() {
    var self = this;
    MetaStore.delete ({opt: 'dform', form: this.props.urlparam.view, id: this.state.recorddata._id, finished: function(d) {
      console.log ('Form _delete, response from server : ' + JSON.stringify(d));
      self.props.navTo('RecordList?gid='+self.props.urlparam.view);
      }});
  },
  render: function() {
    console.log ('Form render ' + JSON.stringify(this.props.urlparam));
    var self = this,
        metaview = MetaStore.getForm (this.props.urlparam.view),
        nonchildformfields = metaview.fields.filter(m => m.type !== 'childform'),
        childformfields = metaview.fields.filter(m => m.type === 'childform');
    var cx = React.addons.classSet;

    return (
        <div className="row">
          <div className="col-xs-12">
            <div className="box">
              <div className="box-header">
                <h3 className="box-title">{metaview.name}</h3>
                <div className="box-tools">
                  {!this.state.edit &&
                    <div className="margin">
                      <div className="input-group">
                        <a className="btn btn-primary pull-right" href={"#Form?gid="+metaview._id+":"+self.state.recorddata._id+"&e=true"}>edit</a>
                        <button onClick={this._delete} className="btn btn-primary">Delete</button>
                      </div>
                    </div>
                  ||
                    <div className="margin">
                      <button onClick={this._save} className="btn btn-primary pull-right">Save</button>
                      <a href={"#Form?gid="+metaview._id+":"+self.state.recorddata._id} onClick={this.props.navTo} className="btn btn-primary pull-right">Cancel</a>
                    </div>
                  }
                </div>
              </div>
              <div className="box-body">
                <div className="row">
                  {nonchildformfields.map(function(field, i) { return (
                    <div className="col-xs-6 col-md-6">
                      <div className="form-group">
                        <label>{field.title}</label>
                        <div className={cx({"rofield": !self.props.urlparam.e && field.type !== 'image'})}>
                          <Field fielddef={field} value={self.state.recorddata[field.name]} edit={self.state.edit} onChange={self._fieldChange}/>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              </div>

                <div className="box-footer">
                </div>

            </div>
          </div>
          {this.state.edit  || childformfields.map(function(field, i) { return (
            <RecordList view={field.child_form} value={self.state.recorddata[field.name]}/>
          );})}
        </div>

        );
  }
});


var RecordList = React.createClass({
  getInitialState: function(){
      console.log ('RecordList InitialState : ' + JSON.stringify(this.props.value));
      return { value: this.props.value || [] };
  },
  componentDidMount: function() {
    if (this.props.urlparam && this.props.urlparam.view) {
      console.log ('RecordList componentDidMount, got url para so running query : ' + JSON.stringify(this.props.urlparam.view));
      MetaStore.dataReq ({opt: 'dform', form: this.props.urlparam.view, finished: this._onChange});
    }
  },
  _onChange: function(req) {
    if (this.isMounted()) {
      if (req.opt === 'dform') {
        console.log ('RecordList _onChange : got data from query');
        this.setState({ value: req.data});
      }
    }
  },
  _delete: function (e) {

  },
  componentWillReceiveProps(nextProps) {
    if (nextProps.value) {
      console.log ('RecordList componentWillReceiveProps : got data from parent prop: ' + JSON.stringify(nextProps.value));
      this.setState ({value: nextProps.value});
    }
  },
  render: function() {
    var self = this,
        metaview = MetaStore.getForm (this.props.urlparam && this.props.urlparam.view || this.props.view),
        nonchildformfields = metaview.fields.filter(m => m.type !== 'childform');

    return (
          <div className="col-xs-12">
              <div className="box">
                <div className="box-header">
                  <h3 className="box-title">{metaview.name}</h3>
                  <div className="box-tools">

                    <a href={"#Form?gid="+metaview._id} onClick={this.props.navTo} className="btn btn-primary pull-right">New</a>

                    <div className="input-group">
                      <input type="text" name="table_search" className="form-control input-sm pull-right" style={{width: '150px'}} placeholder="Search"/>
                      <div className="input-group-btn">
                        <button className="btn btn-sm btn-default"><i className="fa fa-search"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="box-body table-responsive no-padding">
                  <table className="table table-hover">
                    <tbody><tr>
                      <th>actions</th>
                      {nonchildformfields.map(function(field, i) { return (
                      <th>{field.name}</th>
                      );})}

                    </tr>
                    {self.state.value.map(function(row, i) { return (
                      <tr>
                          <td>
                            <a href={"#Form?gid="+metaview._id+":"+row._id+"&e=true"} onClick={self.props.navTo}>edit</a>
                            <a href={"#Form?gid="+metaview._id+":"+row._id} onClick={self.props.navTo}>view</a>
                          </td>
                          {nonchildformfields.map(function(field, i) { return (
                            <td><Field fielddef={field} value={row[field.name]}/></td>
                          );})}

                      </tr>
                    );})}
                  </tbody></table>
                </div>
              </div>
            </div>
    )
  }
})


var Tile = React.createClass({

    // This component doesn't hold any state - it simply transforms
    // whatever was passed as attributes into HTML that represents a picture.
    setFilter: function(id){

        // When the component is clicked, trigger the onClick handler that
        // was passed as an attribute when it was constructed:
        this.props.onTileClick(id);
    },

    render: function(){
        var tdata = this.props.meta,
            boxclass = "small-box " + 'bg-aqua',
            iclass = "ion " + 'ion-stats-bars';

        return (
            <div className="col-xs-12 col-sm-4 col-md-3 col-lg-2">
                <a className={boxclass} href={"#RecordList?gid="+tdata._id} onClick={this.props.navTo}>
                    <div className="inner">
                        <h4>{tdata.name}</h4>
                        <p>{tdata.type}</p>
                    </div>
                    <div className="icon">
                        <i className={iclass}></i>
                    </div>
                    <div  className="small-box-footer">
                        Search {tdata.name} <i className="fa fa-arrow-circle-right"></i>
                    </div>
                </a>
            </div>
        );
    }
});

var TileList= React.createClass({
    displayName: 'TileList',
    getInitialState: function(){
        console.log ('TileList InitialState : ' + this.props.meta);
        return { breadcrumbs: []};
    },
    componentWillReceiveProps: function (nextProps) {
        let cbc = this.state.breadcrumbst;
        console.log ('TileList componentWillReceiveProps : ' + nextProps.meta);

    },
    // The statics object allows you to define static methods that can be called on the component class
    componentDidMount: function(){
        console.log ('TileList componentDidMount : ');
        //self.setState({  loading: false, tiles: i.records});
    },
    handleNavClick: function (cflt) {
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
    },
    render: function () {
        var meta = this.props.meta;
        //let cflt = this.state.filter; // this.getParams().flt;
        console.log ('TileList render : ' + meta.length);

        return (
            <section className="content">
                <div className="page-header">
                    <ol className="breadcrumb" >
                        <li><a href="#" onClick={this.handleNavClick.bind(this, null)}><i className="fa fa-dashboard"></i> Home</a></li>
                        {this.state.breadcrumbs.map(function(rt, i) { return (
                            <li className="active"><a href="#" onClick={self.handleNavClick.bind(self, rt.id)}>{rt.name}</a></li>
                        );})}
                    </ol>
                </div>
                { meta[0] && (
                <div className="row">
                  <div className="col-lg-12">
                    <div className="info-box">
                      <div className="box-body">
                        <a onClick={this.props.navTo} href={"#DNew?id="+meta[0]._id} className="btn btn-app">
                          <i className="fa fa-edit"></i> New
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                <div className="row">

                    {meta.map(function(row, i) { return (
                        <Tile meta={row}/>
                    );})}

                </div>
            </section>
        )
    }
});

var Test= React.createClass({
  getInitialState: function(){
      console.log ('Test InitialState : ' + this.props.meta);
      return {};
  },
  render: function () {
    return (
      <a onClick={this.props.navTo} href="#TileList">TileList</a>
    )
  }
});


module.exports = { TileList, Tile, Report, Test, RecordList, Form};
