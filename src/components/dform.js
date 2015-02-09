
var React = require('react');
var Router = require('react-router');
var { Route, DefaultRoute, RouteHandler, Link } = Router;


var DForm = React.createClass({
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        reqwest({
            url: this.props.url,
            type: 'json',
            success: function(data) {

                var formmeta = data[this.props.fidx];
                //console.log ('success ' + JSON.stringify(data[this.props.fidx].fields));
                reqwest({
                    url: '/dform/db/'+formmeta._id+'?q='+ { _id: $routeParams.id},
                    type: 'json',
                    success: function(data) {},
                    error: function(xhr, status, err) {}});

                this.setState({data: data[this.props.fidx]});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function() {
        return (
            <div className="commentBox">
                <h1>Comments</h1>
                <FieldList data={this.state.data} />
            </div>
        );
    }
});

var FieldList = React.createClass({
    render: function() {
        var commentNodes;
        //console.log ('success ' + JSON.stringify(this.props.data.fields));
        if (this.props.data.fields) {
            console.log ('field ' + this.props.data.fields[0].name);
            commentNodes = this.props.data.fields.map(function (fielddef) {
                return (
                    <DField definition={fielddef}>fieldval</DField>
                );
            });
        }
        return (
            <div className="commentList">{commentNodes}</div>
        );
    }
});

var DField = React.createClass({
    getInitialState: function() {
        return {value: this.props.children};
    },
    handleChange: function(event) {
        this.setState({value: event.target.value});
    },
    render: function() {
        var field = this.props.definition;
        var lbl = <label >{field.title}</label>,
            tplt;

        switch (field.type) {
            case 'text':
                tplt = <div>{lbl}<input type="text" name={field.name}  placeholder={field.placeholder} value={this.state.value} onChange={this.handleChange} />
                </div>
                break;
            case 'dropdown':
                var options = field.dropdown_options.map(function(i) {
                    return <option value={i.value}>{i.name}</option>
                })
                tplt = <div>{lbl}<select name={field.name} value={this.state.value} onChange={this.handleChange}>{options}</select>
                </div>
                break;
            default:
                tplt = <div>{lbl}Unknown Field Type {field.type}</div>
        }

        return tplt;
    }
});

module.exports =  {DField: DField, FieldList: FieldList, DForm: DForm};