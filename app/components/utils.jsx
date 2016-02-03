
import React, {Component} from 'react';
import Router from './router.jsx';
import {FieldDate, FieldImage} from './dform_fields.jsx';
import DynamicForm from '../services/dynamicForm.es6';


export const SvgIcon = ({spriteType, spriteName, small, large, classOverride}) => {
  let df = DynamicForm.instance;
  return (
    <svg className={(classOverride  || "") + ((spriteType === "utility" && !classOverride) && " icon-utility "  ||  " slds-icon ")  + (small && "slds-icon--small" || "") + (large && "slds-icon--large" || "") + " slds-icon-" + spriteType+ "-" +spriteName.replace(/_/g,"-")}
      dangerouslySetInnerHTML={{__html: "<use xlink:href='/assets/icons/"+spriteType+"-sprite/svg/symbols.svg#"+spriteName+"' />"}}>
    </svg>
  )
}

export const IconField = ({value, small, large}) => {
  let df = DynamicForm.instance,
      iconform = df.getFormByName("iconSearch");

  if (iconform) {
    let iconrow = value && iconform._data.find(x => x._id == value._id);
    if (iconrow)
      return (<SvgIcon spriteType={iconrow.icon.type} spriteName={iconrow.icon.name} small={small} large={large}/>);
    else
      return (<span></span>);
  } else
    return <Alert type="error" message="iconSearch not available in this app"/>;

}

export const Alert = ({type, message}) => {
  return (
    <div className={"slds-notify slds-notify--alert slds-theme--"+type+" -texture"}>
     <span className="slds-assistive-text">{type}</span>
     <h2>
       <SvgIcon spriteType="utility" small={true} spriteName="ban" classOverride="slds-icon"/>
       <span>{message}</span>
     </h2>
   </div>
  )
}

export const UpdatedBy = ({user, date}) => {
  let df = DynamicForm.instance,
      userform =  df.getFormByName('Users');
  return (
    <span className="slds-pill" style={{marginBottom: "4px"}}>
      <a href={userform && Router.URLfor(true, "RecordPage", userform._id, user._id)} className="slds-pill__label">
        <FieldImage value={user.picture} inlist={true} />
        {user.name}, <FieldDate value={date}/>
      </a>
    </span>
  )
}

export const Modal = ({children}) => {
  return (
    <div>
      <div aria-hidden="false" role="dialog" className="slds-modal slds-modal--large slds-fade-in-open">
        <div className="slds-modal__container"  style={{width: "95%"}}>
            {children}
        </div>
      </div>
      <div className="slds-modal-backdrop slds-modal-backdrop--open"></div>
    </div>
  )
}
