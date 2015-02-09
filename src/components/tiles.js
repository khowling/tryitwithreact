const React = require('react');
const { Element, Elements } = require('../lib/util');
const { displayDate } = require("../lib/date");
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;

const { Link, State } = require("react-router");
const xhr = require('src/lib/xhr');

var Report = React.createClass({
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
        }
    },
    render: function() {
        var rdata = this.props.data.Report__r;
        var divStyleHidden =  { display: 'none' };
        return (
            <div className="col-md-4">

                <div className="box collapsed-box">
                    <div className="box-header" data-toggle="tooltip" title="" data-original-title="Header tooltip">
                        <h3 className="box-title">{rdata.Name} <br/> <small><code>{rdata.Source__c}</code></small></h3>
                        <div className="box-tools pull-right">
                            <button onClick={this.handleCollapse} className="btn  btn-xs" data-widget="collapse"><i className="fa fa-minus"></i></button>
                        </div>
                    </div>
                    <div className="box-body" style={divStyleHidden}>
                        <p>{rdata.Summary__c}
                        </p>
                    </div>
                    <div className="box-footer" style={divStyleHidden}>
                        <div> Actual: <code>{rdata.Actual__c}</code></div>
                        <div> Target: <code>{rdata.Target__c}</code></div>
                        <a className="btn  btn-block btn-success">
                            <i className="fa fa-play"></i> Open
                        </a>
                    </div>
                </div>
            </div>
        );
    }
});



var Tile = React.createClass({

    // This component doesn't hold any state - it simply transforms
    // whatever was passed as attributes into HTML that represents a picture.
    clickHandler: function(){

        // When the component is clicked, trigger the onClick handler that
        // was passed as an attribute when it was constructed:
        this.props.onClick(this.props.ref);
    },

    render: function(){

        var tdata = this.props.data;
        var chldrep = tdata.Associated_Reports__r || { totalSize: 0, records: []};

        return (


            <div className="col-lg-3 col-xs-6">

                <div className="small-box bg-aqua">
                    <div className="inner">
                        <h3>{chldrep.totalSize}</h3>
                        <p>{tdata.Name}</p>
                    </div>
                    <div className="icon">
                        <i className="ion ion-bag"></i>
                    </div>
                    <Link to='tiles' params={{flt: tdata.Id}} className="small-box-footer">
                        Run {tdata.Name} <i className="fa fa-arrow-circle-right"></i>
                    </Link>
                </div>
            </div>
        );

    }
});

var TileList= React.createClass({
    displayName: 'TileList',
    mixins: [ State ],
    getInitialState: function(){
        console.log ('TileList InitialState : ');
        return { tiles: [], loading: false };
    },
    // The statics object allows you to define static methods that can be called on the component class
    componentDidMount: function(){
        console.log ('TileList componentDidMount : ');
        var self = this;
        var qsttr = 'select Id, Name, parent__c, (select name, id, report__r.Id, report__r.Name, report__r.summary__c, report__r.actual__c, report__r.target__c, report__r.difference__c, report__r.Source__c from Associated_Reports__r) from Tiles__c',
            xhr_opts = {
            url: _sfdccreds.sf_host_url + _sfdccreds.sfdc_api_version + '/query/?q=' + qsttr,
            headers: {  'Authorization': 'OAuth ' + _sfdccreds.session_api  }
        }

        let ch = xhr(xhr_opts, chan(1, t.map(x => x.json)));
        self.setState({ loading: true });
        csp.takeAsync (ch, function(i) {
            self.setState({  loading: false, tiles: i.records});
        });
    },

    render: function () {
        console.log ('TileList render : ' + this.getParams().flt);
        let tiles = seq(this.state.tiles,
            filter(x =>  x.Parent__c == this.getParams().flt ));
        let tilereports = seq(this.state.tiles,
            compose(
                filter(x => x.Id == this.getParams().flt ),
                map (x => x.Associated_Reports__r)
            ))[0],
            reporta = tilereports && tilereports.records || [];

        var optionalElement;
        if (this.state.loading) {
            optionalElement = (<div> loading </div>);
        }
        return (

        <section className="content">
            <div className="row">
                {optionalElement}
                {tiles.map(function(row, i) { return (
                    <Tile data={row} />
                );})}
                {reporta.map(function(row, i) { return (
                    <Report data={row} />
                );})}
            </div>
        </section>
        )
    }
});

var ContentHeader = React.createClass({
    displayName: 'TileHeader',
    getInitialState: function(){
        return { breadcrums: [] };
    },
    render: function() {
        return (
            <section className="content-header">
                <h1>
                    Report Dashboard
                    <small>For all your reporting requirements</small>
                </h1>
                <ol className="breadcrumb">
                    <li><a href="#"><i className="fa fa-dashboard"></i> Top</a></li>
                    <li className="active">Dashboard</li>
                </ol>
            </section>
        );
    }
});



module.exports = { ContentHeader, TileList, Tile, Report};