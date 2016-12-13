"use strict"

export function typecheckFn (formmeta, propname, fval, getFormFn, mongoObjectId)  {
  let fldmeta = formmeta.fields.find(f => f.name === propname);
  console.log (`typecheckFn: validating  ${propname}<${fldmeta && fldmeta.type}>`);
  if (!fldmeta) {
    if (propname === "_id" ||  propname === "_createDate" || propname === "_createdBy" || propname === "_updateDate" || propname === "_updatedBy")
      return {};
    else if (propname === "_data") {
      if (true) { // TODO - need to validate _data is allowed here
        if (fval && !Array.isArray(fval)) {
          return {error: "data contains value of incorrect type : " + propname};
        } else
         return {meta_data: "_data", value: fval};
      } else {
        return {error: `data contains _data field, needs to be a store='metadata', not ${formmeta.store}`};
      }
    } else
      return {error: "data contains fields not recognised, please reload your app/browser : " + propname};
  } else if (fldmeta.type === "dropdown_options") {
    if (fval && !Array.isArray(fval))
      return {error: "data contains value of incorrect type : " + propname};
    else
      return {validated_value: fval || null};
  } else if (fldmeta.type === "text" || fldmeta.type === "textarea" || fldmeta.type === "dropdown" || fldmeta.type === "email" || fldmeta.type === "formula") {
    if (fval && typeof fval !== 'string') return {error: "data contains value of incorrect type : " + propname};
    if (fldmeta.required && (!fval)) return {error: "required field missing : " + propname};
    return {validated_value: fval || null};
  } else if (fldmeta.type === "boolean" ) {
    if (fval && typeof fval !== 'boolean') return {error: "data contains value of incorrect type : " + propname};
    if (fldmeta.required && (!fval)) return {error: "required field missing : " + propname};
    return {validated_value: fval || false};
  } else if (fldmeta.type === "jsonarea") {
    if (fval) try {
      return {validated_value: JSON.parse(fval)}
    } catch (e) { return {error: "data contains invalid json format : " + propname}; }
    else
      return {validated_value:  null};
  } else if (fldmeta.type === "attachment") {
    if (fval && (typeof fval !== 'object' || fval.name == null || fval.size <0 )) return {error: "data contains value of incorrect type : " + propname};
    return {validated_value: fval || null};
  } else if (fldmeta.type === "datetime") {
    if (fval) {
      let fdate = Date.parse(fval);
      if (isNaN(fdate))
        return {error: "data contains invalid date format : " + propname};
      else
        return {validated_value: new Date(fdate)}
    } else {
      if (fldmeta.required) return {error: "required field missing : " + propname};
      return {validated_value:  null};
    }
  } else if (fldmeta.type === "image") {
    if (fval) try {
      if (mongoObjectId && !fval.startsWith("http")) {
        return {validated_value: new mongoObjectId(fval)};
      } else return {validated_value: fval};
    } catch (e) {  return {error: "data contains image field with invalid _id: " + propname + "  : " + fval};}
    else {
      if (fldmeta.required) return {error: "required field missing : " + propname};
      return {validated_value:  null};
    }
  } else  if (fldmeta.type === "reference") {
    if (fval) {
      if (!fval._id) return {error: "data contains reference field with recognised _id: " + propname};

      if (!getFormFn || typeof getFormFn !== "function") {
        return {error: "data contains reference field, missing getFormFn"};
      }

      let sform = fldmeta.search_form && getFormFn(fldmeta.search_form._id);
      if (!sform) return {error: "data contains reference field without defined search_form: " + propname};

      if (sform.store === "mongo" && mongoObjectId) {
        try {
          return {validated_value: fval && {_id: new mongoObjectId(fval._id)} || null};
        } catch (e) {  return {error: "data contains reference field with invalid _id: " + propname + "  : " + fval._id + ", e: " + e};}
      } else {
        return {validated_value: {_id: fval._id}};
      }
    } else {
      if (fldmeta.required) return {error: "required field missing : " + propname};
      return {validated_value:  null};
    }
  } else if (fldmeta.type === "childform") {
    if (!Array.isArray(fval))
      return {error: "data contains childform field, but data is not array: " + propname};
    else
      return {childform_field: fldmeta, value: fval};
  } else if (fldmeta.type === "dynamic") {
    if (fval && typeof fval !== 'object')
      return {error: "data contains dynamic value of incorrect type : " + propname};
    else
      return {dynamic_field: fldmeta,  value: fval};
  } else return {error: "data contains unknown field type: " + fldmeta.type};
};
