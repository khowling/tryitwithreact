
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
        <svg className={(this.props.classOverride  || "") + (this.props.spriteType === "utility" && " icon-utility "  ||  " slds-icon ")  + (this.props.small && "slds-icon--small" || "") + (this.props.large && "slds-icon--large" || "") + " slds-icon-" + this.props.spriteType+ "-" +this.props.spriteName.replace(/_/g,"-")}
          dangerouslySetInnerHTML={{__html: "<use xlink:href='/slds080/assets/icons/"+this.props.spriteType+"-sprite/svg/symbols.svg#"+this.props.spriteName+"' />"}}>
        </svg>
  )}
}
SvgIcon.propTypes = { spriteType: React.PropTypes.string.isRequired, spriteName: React.PropTypes.string.isRequired, small: React.PropTypes.bool, large: React.PropTypes.bool  };
SvgIcon.defaultProps = { spriteType: "", spriteName: "", small: false, large: false };


export class IconField extends Component {
  render() {
    let value = this.props.value,
        df = DynamicForm.instance,
        iconform = df.getFormByName("iconSearch"),
        iconrow = iconform.data.find(x => x.key == value);

    if (iconrow)
      return <SvgIcon spriteType={iconrow.icon.type} spriteName={iconrow.icon.name} small={this.props.small} large={this.props.large}/>;
    else
      return <span></span>;
  }
}
IconField.propTypes = {  small: React.PropTypes.bool, large: React.PropTypes.bool };
IconField.defaultProps = { small: false, large:  false };


export class Alert extends Component {

  render () {
    return (
      <div className="slds-notify slds-notify--alert slds-theme--alert-texture" role="alert">
       <span className="slds-assistive-text">Warning</span>

       <h2>
         <SvgIcon classOverride="slds-m-right--x-small" spriteType="action" spriteName="email"/>
         {this.props.message}
       </h2>
     </div>
    )
  }
}
