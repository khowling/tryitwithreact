
import React, {Component} from 'react';
import DynamicForm from '../services/dynamicForm.es6';

export  class SvgIcon extends Component {
  render() {
    // this.props.spriteType = [action, custom, doctype, standard, utility]
    // this.props.spriteName = description
    // this.props.small = true/false
    // this.props.large = true
    // this.props.classOverride = 'slds-input__icon'
    let df = DynamicForm.instance;

    return (
      <span className={this.props.classOverride && this.props.classOverride || "slds-icon__container"}>
        <svg className={"slds-icon " + (this.props.small && "slds-icon--small" || "") + (this.props.large && "slds-icon--large" || "") + " slds-icon-"+this.props.spriteType+"-"+this.props.spriteName}
          dangerouslySetInnerHTML={{__html: "<use xlink:href='"+df.host+"/assets/icons/"+this.props.spriteType+"-sprite/svg/symbols.svg#"+this.props.spriteName+"' />"}}>
        </svg>
      </span>
  )}
}
SvgIcon.propTypes = { spriteType: React.PropTypes.string, spriteName: React.PropTypes.string, small: React.PropTypes.bool, large: React.PropTypes.bool  };
SvgIcon.defaultProps = { small: false, large: false };
