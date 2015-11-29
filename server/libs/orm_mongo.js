"use strict"

/**
 * Created by keith on 17/10/14.
 */

var   express = require('express')
    , router = express.Router()
    , Grid = require('gridfs-stream')  // write to mongo grid filesystem
//  , fs = require('fs') // TESTING ONLY
    , mongo = require('mongodb')
    , GridStore = require('mongodb').GridStore
    , ObjectID = require('mongodb').ObjectID
    , jexl = require('jexl');


var typecheckFn, asyncfn;
var System = require('es6-module-loader').System;
System.transpiler = 'babel'; // use babel 5.x.x NOT 6

System.import('./shared/async.es6').then(async_mod => {
  console.log ('Setting shared module async ' + async_mod);
  asyncfn = async_mod.default;
}, errval => console.log ('ERROR Setting shared module async ' + errval));

System.import('./shared/dform.es6').then(dform_mod => {
  console.log ('Setting shared module typecheckFn ' + dform_mod);
  typecheckFn = dform_mod.typecheckFn;
}, errval => console.log ('ERROR Setting shared module typecheckFn ' + errval));



module.exports = function(options) {

    var meta = require('../libs/orm_mongo_meta')(options);
    var db = options.db;
    var exps = {};


    var genQuery = function (query, form, parentFieldname) {
      let mquery = {};
      if (query) {
        if (typeof query === "object") {
          for (let qkey in query) {
            if (qkey === "_id") {
              let qfieldid = parentFieldname ? `${parentFieldname}._id` : "_id";
              if (Array.isArray(query._id)) {
                mquery[qfieldid] = {"$in": []};
                for (let i of query._id) {
                  try {
                    mquery[qfieldid]["$in"].push (new ObjectID(i));
                  } catch (e) {
                    return {error: "query parameter 'id' doesnt contain a valid objectid :  " + i};
                  }
                }
              } else {
                try {
                  mquery[qfieldid] = new ObjectID(query._id);
                } catch (e) {
                  return {error: "query parameter 'id' doesnt contain a valid objectid :  " + query._id};
                }
              }
            } else if (qkey === "p")  {
              let qfieldid = parentFieldname ? `${parentFieldname}.name` : "name";
              // searches field with ->> db.ensureIndex(collectionname, index[, options], callback)
              //db.createIndex(form.collection, {"name": "text"}, { comments: "text" }, function (a,b) {console.log ("create idx : " + JSON.stringify({a: a, b: b}))});
              //mquery = { "$text": { "$search": query.p}};
              mquery = {[qfieldid]: {$regex: query.p, $options: 'i'}}
            } else if (qkey === "q") {
              let validatedq = {};
              for (let fieldname in query.q) {
                let qfieldid = parentFieldname ? `${parentFieldname}.${fieldname}` : fieldname;
                let fval = query.q[fieldname],
                    fdef = form.fields.find(x => x.name === fieldname);
                if (fieldname === "_id")
                  // probably query list of _ids, processed on server, already in ObjectID format
                  validatedq[qfieldid] = fval;
                else if (!fdef) {
                  // hardwire solution for auth.js find of {"q":{"provider.provider_id":"100002510156619"}}
                  let idxdot = fieldname.indexOf ('.');
                  if (idxdot > -1) {
                    if (!form.fields.find(x => x.name === fieldname.substr(0,idxdot)))
                      return {error: "query object doesnt contains a invalid field :  " + fieldname};
                    else
                      validatedq[qfieldid] = fval;
                  } else
                    return {error: "query object doesnt contains a invalid field :  " + fieldname};
                } else if (fdef.type === "reference" && fval && typeof fval === 'string' && fval.length == 24)
                    validatedq[qfieldid] = new ObjectID(fval);
                  else
                    validatedq[qfieldid] = fval;
              }
              mquery = validatedq;
            } else {
              return {error: "query parameter not recognised : " + qkey};
            }
          }
        } else return {error: "query parameter needs to be an objet"};
      }
      console.log (`find(), genquery ${JSON.stringify(query)} ${parentFieldname} : res : ${JSON.stringify(mquery)}`);
      return mquery;
    }

    exps.find = function (formid, parent, query, findone, ignoreLookups) {
      return new Promise(function (resolve, reject)  {
        console.log (`find() starting with params <${formid}> <${JSON.stringify (parent)}> <${JSON.stringify (query)}> <${findone}> <${ignoreLookups}>`);

        /* search form meta-data for 'reference' fields to resolve (also search through 'childform' subforms) */
        var findFieldsandLookups = function (FORM_DATA, form, parentField, ignoreLookups, getsystemfields, dynamicField) {

//            console.log(`find() findFieldsandLookups form:<${form.name}> parent:<${parentField}>  ignoreLookups:<${ignoreLookups}> system:<${getsystemfields}> `);
            var result = {findField: {}, lookups: [], dynamics: []};

            if (parentField) {
              result.findField[`${parentField}._id`] = 1;
              if (getsystemfields) {
                result.findField[`${parentField}._updateDate`] = 1;
                result.findField[`${parentField}._updatedBy`] = 1;
              }
            } else {
              // get all system fields on top level collection
              if (getsystemfields) {
                result.findField["_createdBy"] = 1;
                result.findField["_createDate"] = 1;
                result.findField["_updatedBy"] = 1;
                result.findField["_updateDate"] = 1;
                //if (form.store === "metadata")
                result.findField["_data"] = 1;
              }
            }

            // instruct find to resolve lookup for "_updatedBy" on top level and childforms (but not dynamicfields)
            if (getsystemfields && !ignoreLookups) {
              let v = {reference_field_name: "_updatedBy",search_form_id: meta.forms.UserSearch};
              if (parentField) v.parent_field_name = parentField;
              if (dynamicField) v.dynamic_field_name = dynamicField;
              result.lookups.push(v);
            }

            if (form.fields) for (var field of form.fields) {

                let fullfieldname = (parentField ? `${parentField}.${field.name}` : field.name);
//                console.log(`find() findFieldsandLookups: ${fullfieldname}`);
                // mongo projections (field list to return)
                if (field.type === 'childform') {
                  result.findField[fullfieldname+"._id"] = 1;
                } else if (field.type != "relatedlist") {
                  result.findField[fullfieldname] = 1;
                }

                // instruct find to resolve lookup for this reference field by running a subquery
                if (field.type === 'reference') {
//                    console.log('find() findFieldsandLookups: found a lookup field on  field : ' + fullfieldname);
                  if (!ignoreLookups && field.search_form) {
                    let v = {reference_field_name: field.name, search_form_id: field.search_form._id};
                    if (parentField) v.parent_field_name = parentField;
                    if (dynamicField) v.dynamic_field_name = dynamicField;
                    result.lookups.push(v);
                  }
                } else if (field.type === 'childform') {
                    var childform = field.child_form && meta.findFormById(FORM_DATA, field.child_form._id);
                    if (!childform) {
                        return {error: 'find() Cannot find childform definitions on field ['+fullfieldname+'] : ' + JSON.stringify(field.child_form)};
                    } else {
                        //console.log('find() findFieldsandLookups: found a childform, recurse onit! name :' + field.child_form._id + ' : ' + childform.name);
                        //result = yield findFieldsandLookups(FORM_DATA, childform, fullfieldname, ignoreLookups, getsystemfields,  result);
                        let child_result = findFieldsandLookups(FORM_DATA, childform, fullfieldname, ignoreLookups, getsystemfields, dynamicField);
//                        console.log (`child_result ${JSON.stringify(child_result)}`);
                        if (child_result.error)
                          return child_result;
                        result = {findField: Object.assign(result.findField, child_result.findField),
                                  lookups: result.lookups.concat(child_result.lookups),
                                  dynamics: result.dynamics.concat(child_result.dynamics)
                                };
                    }
                }  else if (field.type === 'dynamic') {
                  // we only know the field types once we have the data record, so lets mark it now, and do the jexp at harvest time!
                  // TODO: need to validate dynamic fields & lookup references when dynamic fields are lookups!!
                  if (!ignoreLookups && field.fieldmeta_el) {
                    let v = {reference_field_name: field.name, dynamic_form_ex: field.fieldmeta_el};
                    if (parentField) v.parent_field_name = parentField;
                    result.dynamics.push(v);
                  }
                }
            }
            //console.log('find() findFieldsandLookups: returning result : ' + JSON.stringify(result));
            return result;
        };

        /* Harvest lookup ids from primary document for foriegn key lookup */
        /* if subq is specified, update the docs with the lookup values */
        /* RETURNS: {'form_id': {form: <JSON form>, keys: ['id', 'id']}} */
        var processlookupids = function (fieldsandlookups, docs, subq) {
            let harvest = !subq,
                processFn = (doc, lookup, lookupkeys, subq, dynamicField) => {
                  let harvest = !subq,
                      fval = doc[lookup.reference_field_name];

                  if (fval) {
                    if (harvest) { //--------------------- harvest mode
                      try {
                        console.log ("find() processlookupids (harvest), need to find ["+lookup.search_form_id+"]["+lookup.reference_field_name+"] val: " + JSON.stringify(fval));
                        if (dynamicField) {
                          if (fval[dynamicField]._id) {
                            lookupkeys[lookup.search_form_id].add(fval[dynamicField]._id);
                          } else {
                            fval[dynamicField] = {error: `no _id`};
                          }
                        } else {
                          if (fval._id) {
                            lookupkeys[lookup.search_form_id].add(fval._id);
                          } else {
                            fval = {error: `no _id`};
                          }
                        }
                      } catch (e) {
                        console.log (e + ' Warning : lookup value not in format of ObjectId:  field : ' + lookup.reference_field_name + ', val: ' + JSON.stringify(fval));
                      }
                    } else { //----------------------------  update mode
                      console.log ("find() processlookupids (update), setting ["+lookup.reference_field_name+"] val: " + JSON.stringify(fval));
                      if (dynamicField) {
                        if (lookup.search_form_id && !fval[dynamicField].error)
                            doc[lookup.reference_field_name][dynamicField] = subq[lookup.search_form_id][fval[dynamicField]._id] || {error:`missing id ${JSON.stringify(fval)}`};
                      } else {
                        if (lookup.search_form_id && !fval.error)
                            doc[lookup.reference_field_name] = subq[lookup.search_form_id][fval._id] || {error:`missing id ${JSON.stringify(fval)}`};
                      }
                    }
                  }
                };

            var lookupkeys = {};
            for (var doc of docs) { // for each data row
/*
              if (harvest) for (let d of fieldsandlookups.dynamics) {

                let dynamic_fields = yield jexl.eval(d.dynamic_form_ex, {rec: doc, appMeta: FORM_DATA});
                if (dynamic_fields.error) {
                  return {error: 'find() error execting dynamic field expression  ['+d.dynamic_form_ex+'] : ' + JSON.stringify(dynamic_fields.error)};
                } else if (dynamic_fields) {
*/
//                  let dynamicfieldsandLookups = findFieldsandLookups (FORM_DATA, {fields: dynamic_fields}, d.parent_field_name /*parentFieldName */,  false/*ignoreLookups*/, false/*getsystemfields*/, d.reference_field_name /* dynamicField*/ );
/*
                  for (let l of dynamicfieldsandLookups.lookups) {
                    if (harvest && !lookupkeys[l.search_form_id])  lookupkeys[l.search_form_id] = new Set();
                    if (l.parent_field_name) for (let edoc of doc[l.parent_field_name]) {
                      processFn(edoc, l, lookupkeys, subq, l.dynamic_field_name);
                    } else // if field is NOT in an embedded-document, just add id to lookupkeys
                      processFn(doc, l, lookupkeys, subq, l.dynamic_field_name);
                  }

                }
              }
*/
              for (let l of fieldsandlookups.lookups) { // for each 'reference' field from 'findFieldsandLookups'
                //if (harvest && !l.search_form_id) continue; // no recorded search form, so dont run subquery
                // if in harvest mode, initialise lookupkeys array
                if (harvest && !lookupkeys[l.search_form_id])  lookupkeys[l.search_form_id] = new Set();
                console.log (`ok ${l.parent_field_name} ${doc[l.parent_field_name]}`);
                if (l.parent_field_name && Array.isArray(doc[l.parent_field_name])) for (let edoc of doc[l.parent_field_name]) {
                  processFn(edoc, l, lookupkeys, subq);
                } else // if field is NOT in an embedded-document, just add id to lookupkeys
                  processFn(doc, l, lookupkeys, subq);
              }

            }
            if (!subq) {
              return lookupkeys;
            } else {
              return docs;
            }
        };

        /* run subquery */
        var runsubquery = function (FORM_DATA, form, objids, pfld) {
          return new Promise(function (resolve, reject)  {
            let q = { _id: { $in: objids }};

            let fieldsandlookups = findFieldsandLookups(FORM_DATA, form, null, true, false);

//              console.log('find() runsubquery() find  ' + form.collection + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(fieldsandlookups.findField));

              db.collection(form.collection).find(q, fieldsandlookups.findField).toArray(function (err, docs) {
                  if (err) reject(err);
                  else {

                    //processlookupids (fieldsandlookups.lookups, docs, []);
                    // if less results than expected and using 'formMeta' lookup to the formMetadata object, include the META_DATA, as there may be a reference.
                    // need to call processlookupids in update mode to format the reference fields
                    // TODO: Should this be done on the client??

                    if (objids.length > docs.length && form._id === meta.forms.metaSearch) {
                      let metares = [];
                      for (let lid of objids) {
                        if (docs.filter(r => r._id === lid).length == 0)  {
//                         console.log ('finding in metasearch: ' + lid);
                          let lidform = meta.findFormById(FORM_DATA, lid);
                          if (lidform) {
                            let filteredform = {_id: lidform._id};
                            for (let f in fieldsandlookups.findField)
                              filteredform[f] = lidform[f];
                            docs.push (filteredform);
                          }
                        }
                      }
                    }
                    resolve({formid: form._id, records: docs});
                  }
              });
          });
        };

        /* flow control - run sub queries in parrallel & call alldonefn(docs) when done! */
        var runallsubqueries = function (FORM_DATA, lookups, lookupkeys) {
          return new Promise(function (resolve, reject)  {
            let subq_res = {};
            if (Object.keys(lookupkeys).length == 0) {
              resolve();
            } else {
              let promises = []
              for (var formid in lookupkeys) {
                  let form = meta.findFormById(FORM_DATA, formid),
                      keys = Array.from(lookupkeys[formid]);

                  if (keys.length >0) {
                    if (form.store === "metadata") {
//                      console.log ('find() runallsubqueries, metadata searchform, use form to resolve lookups : ' + form.name + ' _data#=' + (form._data? form._data.length : "0"));
                      subq_res[form._id] = {};
                      if (form._data) for (let key of keys) {
                        let val = form._data.find(i => i._id === key);
//                        console.log ('find() runallsubqueries, metadata searchform, setting ['+form.name+']['+key+'] : ' + JSON.stringify(val));
                        if (val) subq_res[form._id][key] =  val;
                      }
                    } else if (form.store === "mongo") {
//                      console.log ('find() runallsubqueries, mongo searchform, use form to resolve lookups : ' + form.name);
                      promises.push(runsubquery (FORM_DATA, form, keys));
                    } else {
                      subq_res[form._id] = {};
                    }
                 }
              }

              Promise.all(promises).then(function (succVal) {
//                  console.log ('Got all suqqueries, now shape the data: ' + JSON.stringify(succVal));
                  for (let subq of succVal) {
                    subq_res[subq.formid] = {};
                    for (let rec of subq.records) {
                      subq_res[subq.formid][rec._id] = rec;
                    }
                  }
                  resolve(subq_res);
                }).catch(function (reason) {
                    reject(reason);
                });
            }
          });
        }


        exps.getFormMeta(formid).then(function(FORM_DATA) {
//            console.log("\n\nfind() FORM_DATA ["+formid+"] #=" + FORM_DATA.length);
            let form = meta.findFormById(FORM_DATA, formid),
                collection, parent_form = null, parent_field  = null;

            if (!form) {
              return reject ("find() form not Found or no defined collection : " + formid);
            }
            if (form.store ===  'mongo') {
              collection = form.collection;
              if (parent)  return reject ("find() cannot supply parent parameter for top level form : " + form.name);
            } else if (form.store ===  'fromparent') {
              if (!(parent && parent.field_id && parent.form_id && parent.query))  return reject ("find() got child form, but not complete parent data : " + JSON.stringify(parent));
              parent_form = meta.findFormById(FORM_DATA, parent.form_id);
              if (!parent_form) {
                return reject ("find() parent form not Found : " + parent.form_id);
              } else {
                collection = parent_form.collection;
                parent_field = parent_form.fields.find(f => f._id == parent.field_id);
                if (!(parent_field && parent_field.child_form && parent_field.child_form._id == formid))
                   return reject ('find() childform not assosiated to parent (check your schema child_form): ' + parent.field_id);
              }
            }

            let mquery;
            if (parent_field) {
              mquery = genQuery(parent.query, parent_form);
              Object.assign(mquery, genQuery(query, form, parent_field.name));
            } else {
              mquery = genQuery(query, form);
            }

//            console.log("find() create the mongo query : " + JSON.stringify(mquery));
            if (mquery.error) return reject(`query ${mquery.error}`);

//            console.log('find() calling findFieldsandLookups');
            let fieldsandlookups = findFieldsandLookups(FORM_DATA, form, parent_field && parent_field.name, ignoreLookups, true);

//           console.log('find() calling findFieldsandLookups finished ' + JSON.stringify(fieldsandlookups)); // + JSON.stringify(fieldsandlookups));

            if (fieldsandlookups.error) {
              reject(fieldsandlookups.error)
            } else {

              let retfn = function (err, doc) {
                  if (err ) {
                    console.log('find() find ERROR :  ' + err);
                    reject (err);
                  } else if ((findone && doc == null) || (!findone && doc.length == 0)) {
                    console.log("find() no records retuned") // ' + JSON.stringify(doc));
                    resolve(doc);
                  } else {

  //                  console.log("find() got records") // ' + JSON.stringify(doc));

                      // finding all forms, so return our hardwired also
                      /* - ERROR - this code mutates doc!!!
                      console.log ('debug: ' + form._id + " === " + exps.forms["metaSearch"]);
                      if (Object.is(form._id,exps.forms["metaSearch"])) {
                        if (!findone) {
                          doc = doc.concat( FORM_DATA) ;
                        }
                      }
                      */
                      if (ignoreLookups) {
    //                    console.log ('resolve: ' );
                        // need to call processlookupids in update mode to format the reference fields
    //                    processlookupids (fieldsandlookups.lookups, findone && [doc] || doc, []);
                        return resolve(doc);
                      } else {
                          var lookupkeys = processlookupids(fieldsandlookups, findone && [doc] || doc);
    //                      console.log("find() got query for foriegn key lookup "); // + JSON.stringify(lookupkeys));

                          runallsubqueries(FORM_DATA, fieldsandlookups.lookups, lookupkeys).then(function (succVal) {
                            if (succVal) {
  //                           console.log("find() runallsubqueries success, now processlookupids, recs:" + (findone && "1" || doc.length));
                              processlookupids (fieldsandlookups, findone && [doc] || doc, succVal);
                            }
                            return resolve(doc);
                          }, function (errVal) {
                            console.log("find() runallsubqueries error " + errVal);
                            return reject(errVal)
                          }).catch(function error(e) {
                            console.log ("catch err : " + e);
                            return reject(e);
                          });
                      }
                  }
              };


              // its find one, DOESNT RETURN A CURSOR
              if (findone) {
                  console.log(`find() findOne for ${collection} query:  ${JSON.stringify(mquery)}, projection: ${JSON.stringify(fieldsandlookups.findField)}`);
                  db.collection(collection).findOne(mquery, fieldsandlookups.findField, retfn);

              } else {
                  console.log(`find() find for ${collection} query:  ${JSON.stringify(mquery)}, projection: ${JSON.stringify(fieldsandlookups.findField)}`);
                  db.collection(collection).find(mquery, fieldsandlookups.findField, {}).toArray(retfn);
              }
            }

        }, function (err) {
            reject ('find() Cannot find form definitions ' + err);
        }).catch(function (err) {
          console.log (`find() ${typeof err} ${JSON.stringify(err)}`);
          reject (`find() catch program Error: ${JSON.stringify(err)}`);
        });
      })
    };

    exps.delete = function(formid, parent, query) {
      return new Promise(function (resolve, reject)  {
        console.log (`delete() starting with params <${formid}> <${JSON.stringify (parent)}>`);
        exps.getFormMeta(formid).then(function(FORM_DATA) {
            let form = meta.findFormById(FORM_DATA, formid),
                collection, parent_form = null, parent_field  = null;

            if (!form) {
              return error ("delete() form not Found or no defined collection : " + formid);
            }
            if (form.store ===  'mongo') {
              collection = form.collection;
              if (parent)  return reject ("delete() cannot supply parent parameter for top level form : " + form.name);
            } else if (form.store ===  'fromparent') {
              if (!(parent && parent.field_id && parent.form_id && parent.record_id))  return reject ("delete() got child form, but not complete parent data : " + form.name);
              parent_form = meta.findFormById(FORM_DATA, parent.form_id);
              if (!parent_form) {
                return reject ("delete() parent form not Found : " + parent.form_id);
              } else {
                collection = parent_form.collection;
                parent_field = parent_form.fields.find(f => f._id == parent.field_id);
                if (!(parent_field && parent_field.child_form && parent_field.child_form._id == formid))
                   return reject ("delete() childform not assosiated to parent (check your schema child_form): " + parent.field_id);
              }
            }

            let mquery, update;
            if (parent_field) {
              mquery = genQuery(parent.query, parent_form);
              update = { $pull: { [parent_field.name]: genQuery(query, form) } };
              if (mquery.error) return reject(mquery.error);

              console.log(`delete() <${collection}>  query:  ${JSON.stringify(mquery)}, update: ${JSON.stringify(update)}`);
              db.collection(collection).update(mquery, update, function (err, out) {
                console.log (`delete() update ${JSON.stringify(out)} err: ${err}`);
                if (err) {
                   return reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                } else if (out.nModified == 0) {
                  return reject ("nothing deleted");
                } else {
                  return resolve ({'deleted': true});
                }
              });
            } else {
              mquery = genQuery(query, form);
              console.log(`delete() <${collection}>  query:  ${JSON.stringify(mquery)}`);
              db.collection(collection).remove(mquery, function (err, out) {
                console.log (`delete() update ${JSON.stringify(out)} err: ${err}`);
                if (err) {
                   return reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                } else if (out.nModified == 0) {
                  return reject ("nothing deleted");
                } else {
                  return resolve ({'deleted': true});
                }
              });
            }
          }, function (err) {
              reject ('delete() Cannot find form definitions ' + err);
          }).catch(function (err) {
              reject ('delete() Program Error: ' + err);
          });
        }).catch(function (err) {
            console.log ('delete() Program Error: ' + err);
            return Promise.reject(err);
        });
    };


    exps.save = function (formid, parent, userdoc, userrec) {
        return new Promise( function(resolve, reject)  {
          exps.getFormMeta(formid).then(function(FORM_DATA) {
            var form = meta.findFormById(FORM_DATA, formid),
                isInsert = Array.isArray (userdoc) || typeof userdoc._id === 'undefined',
                isEmbedded = (parent && parent.field_id && parent.form_id && parent.query);

            if (!form) {
              return reject ("save() form not Found : " + formid);
            } else if (!isEmbedded && parent){
              return reject (`save() need to supply parent 'field_id', 'form_id' & 'query' for embedded document save:  ${JSON.stringify(parent)}`);
            } else if (Array.isArray (userdoc) && isEmbedded){
              return reject ("save() cannot save array of records into embedded doc");
            } else {

//              console.log ('save() formid:' + formid + ' : got form lookup: ' + form.name);
              var coll = form.collection;
              var embedfield;

              if (isEmbedded) {
//                  console.log ('save() Its a childform, get the collection & field from theparent.field_id : ' + parent.field_id);
                  let parent_form = meta.findFormById (FORM_DATA, parent.form_id),
                      parent_field = parent_form.fields.find(f => f._id == parent.field_id);

                  if (!parent_form) {
                      return reject ('save() Cannot find parent form field for this childform: ' + parent.field_id);
                  } else if (!(parent_field && parent_field.child_form && parent_field.child_form._id == formid)) {
                      return reject ('save() childform cannot be saved to parent (check your schema child_form): ' + parent.field_id);
                  } else {
                      coll = parent_form.collection;
                      embedfield = parent_field.name;
//                      console.log ('save() its embedded, top level collection : ' + coll + ', fieldname : ' + embedfield);
                  }
              }

//              console.log('save() collection: '+coll+' userdoc: ' + JSON.stringify(userdoc));
              // build the field set based on metadata - NOT the passed in JSON!
              // 'allowchildform'  if its a INSERT of a TOP LEVEL form, allow a childform to be passed in (used by auth.js)
              var validateSetFields = function (isInsert, form, dataval, embedField, allowchildform) {
                var isarray = Array.isArray(dataval),
                      reqval = isarray && dataval || [dataval],
                      setval = [];

                //console.log ("Save: validateSetFields, looping through save records: " + reqval.length);
                for (let rv of reqval) { // for each data record
                  let tv = {};  // target validated object

                  if (isInsert) {
                    if (rv._id) return {error: "Insert request, data already contains key (_id) : " + rv._id};
                    // generate new ID.
                    tv._id = new ObjectID();
                    tv._createDate = new Date();
                    tv._createdBy = {_id: userrec._id};
                    tv._updateDate = new Date();
                    tv._updatedBy = {_id: userrec._id};
                  } else { // update
                    // if updating, data doesn't need new _id.
                    if (!rv._id) return {error: "Update request, data doesnt contain key (_id)"};
                    tv[embedField && embedfield+'.$._updateDate' || '_updateDate'] = new Date();
                    tv[embedField && embedfield+'.$._updatedBy' || '_updatedBy'] = {_id: userrec._id};
                  }
                  //console.log ("Save: validateSetFields, looping through record propities");
                  for (let propname in rv) { // for each property in data object
                    let fval = rv[propname], // store the requrested property value
                        tprop = embedField && embedfield+'.$.'+propname || propname;  // format the target property name for mongo

                    let tcres = typecheckFn (form, propname, fval, (fid) => meta.findFormById(FORM_DATA, fid), ObjectID);
                    if ('error' in tcres)
                      return tcres;
                    else if ('validated_value' in tcres) {
                      tv[tprop] = tcres.validated_value;
                    } else if ('dynamic_field' in tcres) {
                      // TODO : Validate dynamic files, function needs to be sync generator
                      let dynamic_fields = jexl.eval(tcres.dynamic_field.fieldmeta_el, {rec: rv, appMeta: FORM_DATA});
                      console.log ("TODO TODO :: dynamic_fields validation : " + JSON.stringify(dynamic_fields));
                      tv[tprop] = tcres.value; //temp
                    } else if ('childform_field' in tcres) {

                        if (!allowchildform) {
                          continue; // just ignore the childform data!
                          return {error: "data contains childform field, not allowed in this mode: " + propname};
                        }

                        let ctav = [];  // child  target array validated
                        // create formfield object keyed on fieldname
                        let cform = tcres.childform_field.child_form && meta.findFormById(FORM_DATA, tcres.childform_field.child_form._id);
                        if (!cform) return {error: "data contains childform field, but no child_form defined for the field: " + propname};

                        for (let cval of tcres.value) {
                          let ctv = {};  // target validated object

                          if (cval._id) return {error: "data contains childform field, and data array contains existing _id: " + propname};
                          ctv._id =  new ObjectID();

                          for (let cpropname in cval) {
                            let cfval = cval[cpropname]; // store the requrested property value
                            let ctcres = typecheckFn (cform, cpropname, cfval, (fid) => meta.findFormById(FORM_DATA, fid), ObjectID);
                            if ('error' in ctcres)
                              return ctcres;
                            else if ('validated_value' in ctcres)
                              ctv[cpropname] = ctcres.validated_value;
                          }
                          ctav.push(ctv);
                        }
                        tv[tprop] = fval;
                      }
                  }
                  setval.push(tv);
                }
                return {data: isarray && setval || setval[0]};
              };

              if (isEmbedded || !isInsert) {
                // get existing document.
                exps.find (formid, parent, {_id: new ObjectID(userdoc._id)}, true, true).then(existing_rec => {
                  console.log (`save() got existing record : ${JSON.stringify(existing_rec)}`);
                  if (isEmbedded)  {  // its embedded, so modifing a existing top document
                    let query, update;
                    //console.log('/db/'+coll+'  set or push a embedded document :' + parentid);

                    try {
                      // TODO: use genQuery?
                      query = {_id: new ObjectID(parent.query._id)};
                    } catch (e) {
                      return reject ("save() parent.record_id not acceptable format : " + parent.record_id);
                    }
                    /***** TRYING TO DO EMBEDDED ARRAY inside EMBEDDED ARRAY, BUT MONGO DOESNT SUPPORT NESTED POSITIONAL OPERATORS
                     var embedsplit = embedfield.split('.');
                     if (embedsplit.length == 2) {
                        query['"' + embedsplit[0] + '._id"'] = new ObjectID(parent.record_id);
                    }  else {
                        query = {_id: new ObjectID(parent.record_id)};
                    }
                     */

                    if (!isInsert) { // its updating a existing embedded entry
                      try {
                        // add embedded doc id to the query
                        query[`${embedfield}._id`] =  new ObjectID(userdoc._id);
                      } catch (e) {
                        return reject ("save() _id not acceptable format : " + userdoc._id);
                      }
                    //query[embedfield] = {'$elemMatch': { _id:  savedEmbedDoc._id}}
                      let validatedUpdates = validateSetFields(isInsert, form, userdoc, embedfield);
                      if (validatedUpdates.error)
                        return reject (validatedUpdates.error);
                      else {
                        update = {'$set': validatedUpdates.data};
                      }

                    } else {  // its $push'ing a new embedded entry

                      let validatedUpdates = validateSetFields(isInsert, form, userdoc, null);
                      if (validatedUpdates.error)
                        return reject (validatedUpdates.error);
                      else {
                        let fldpush = { [embedfield]: validatedUpdates.data};
//                        console.log ('embedded fld:' + embedfield + ', : ' + JSON.stringify(fldpush));
                        update = {'$push': fldpush};
                      }
                    }
                    console.log(`save() update <${coll}>: query: ${JSON.stringify(query)}, update: ${JSON.stringify(update)}`);
                    db.collection(coll).update(query, update, function (err, out) {
                      console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                      if (err) {
                         return reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                      } else if (out.nModified == 0) {
                        return reject (`no update made ${JSON.stringify(query)}`);
                      } else {
                        return resolve ({_id: isInsert && update['$push'][embedfield]._id || query[embedfield+"._id"]});
                      }
                    });
                  } else {
                    // its a top level Update (!isInsert)
                    //console.log('/db/'+coll+' got _id,  update doc, use individual fields : ' + userdoc._id);
                    let query, update;

                    try {
                      query = {_id: new ObjectID(userdoc._id)};
                    } catch (e) {
                      return reject  ("save() _id not acceptable format : " + userdoc._id);
                    }
                    let validatedUpdates = validateSetFields(isInsert, form, userdoc, null);
                    if (validatedUpdates.error)
                      return reject (validatedUpdates.error);
                    else
                      update = { '$set': validatedUpdates.data};

                    console.log(`save() update <${coll}>: query: ${JSON.stringify(query)}, update: ${JSON.stringify(update)}`);
                    db.collection(coll).update (query, update,  function (err, out) {
                      console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                      if (err) {
                         return reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                      } else if (out.nModified == 0) {
                        return reject (`no update made ${JSON.stringify(query)}`);
                      } else {
                        resolve ({_id: query._id});
                      }
                    });
                  }
                }, err => reject (`failed to retrieve existing record : ${err}`));
              }  else {
                // its a insert, no existing record
                //console.log('/db/'+coll+'  insert toplevel document, use individual fields');
                let insert,
                    validatedUpdates = validateSetFields(isInsert, form, userdoc, null, true);
                if (validatedUpdates.error)
                  return reject (validatedUpdates.error);
                else
                  insert = validatedUpdates.data;

                console.log(`save() insert <${coll}>: insert: ${JSON.stringify(insert)}`);
                db.collection(coll).insert (insert, function (err, out) {
                  console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                  if (err) {
                     reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                  } else {
                    if (Array.isArray(userdoc))
                      resolve (out);
                    else
                      resolve ({_id: insert._id});
                  }
                });
              }
            }
        }, function (err) {
            reject ('save() Cannot find form definitions ' + err);
        }).catch (err => reject ('save() Program Error ' + err));
      });
    };


    /* ------------------------------------- FILE HANDLING
     *
     */
    /* UNIX COMMAND
     mongofiles -d myapp_dev list
     mongofiles -d myapp_dev get profile-pic511a7c150c62fde30f000003
     */
    exps.getfile = function (filename, res) {
        console.log ('getfile() filename : ' + filename);

        try {
          var gfs = Grid(db, mongo),
              findopts = {_id: new ObjectID(filename)};

          gfs.exist(findopts, function (err, found) {
            if (err) return res.status(400).send(err);
            if (!found) res.status(400).send({error: "no file found" + filename});

            console.log('File exists'  + filename);

            var readstream = gfs.createReadStream(findopts);

            readstream.on('finish', function (file) {
                console.log ('getfile pipe finished ');
            });

            readstream.on('error', function (e) {
                console.log ('getfile pipe error : ' + JSON.stringify(e));
                res.status(400).send({error: JSON.stringify(e)});
            });

            console.log ('getfile pipe  ' + filename);
            readstream.pipe(res);

          });
        } catch (e) {
          console.log ('getfile try error : ' + JSON.stringify(e));
          res.status(400).send({error: JSON.stringify(e)});
        }
    };

    exps.putfile = function (req, res, origname) {
      var filename = new ObjectID (),
          gfs = Grid(db, mongo),
          writestream = gfs.createWriteStream({
              _id: filename,
              filename: origname,
              metadata: {
                ownerId: 'authTBC',
                uploadIP: '??'
              }
          });

      writestream.on('finish', function (file) {
        console.log ('putfile pipe finished ' + JSON.stringify(file));
        res.send({_id: filename});
      });

      writestream.on('error',function(e) {
        console.log ('putfile pipe error ');
        res.status(400).send({error: JSON.stringify(e)});
      });

      console.log ('putfile pipe  ' + filename);
      req.pipe(writestream);
    };

    exps.listfiles = function( success, error) {
      var gfs = Grid(db, mongo);
      gfs.files.find({}).toArray(function (err, files) {
        if (err) error(err);
        success(files);
      })
    }

    exps.forms = meta.forms;
    // expose these from the static data
    exps.defaultData = meta.defaultData;
    exps.adminApp = meta.adminApp;
    exps.adminMetabyId = meta.adminMetabyId;


    exps.getFormMeta = function (filterids) {

      return new Promise(function (resolve, reject)  {
        let returnMeta = [],
            query = null;

        if (filterids) {

          if (!Array.isArray(filterids) && meta.FORMMETA.find(meta => meta._id.toString() == filterids)) {
            console.log ("getFormMeta() passed in a single form that is resolved to a hardwired metadata,  return all hardcoded metadata : " + filterids);
            returnMeta = meta.FORMMETA;
          } else {
            if (!Array.isArray(filterids)) {
              console.log ("getFormMeta() passed in a single form that is resolved to a user metadata,  return everything (for now) : " + filterids);
              returnMeta = meta.FORMMETA;
              query = {};
            } else {
                console.log("getFormMeta() passed in array filterids, just return requested metadata : " + JSON.stringify(filterids));

                let adminmeta = meta.adminMetabyId(),
                    retadminmeta = new Set();

                retadminmeta.add(adminmeta[exps.forms.FileMeta.toString()]); // apps that need to work with files
                retadminmeta.add(adminmeta[exps.forms.iconSearch.toString()]); // apps that need to work with icons
                retadminmeta.add(adminmeta[exps.forms.UserSearch.toString()]); // apps that need to work with users
                retadminmeta.add(adminmeta[exps.forms.App.toString()]); // apps that need to work with users app-specific dynamic fields
                retadminmeta.add(adminmeta[exps.forms.ComponentMetadata.toString()]); // needed for the router props

                if (false) for (let admins in exps.forms) { // Get out of Jail!!
                  retadminmeta.add(adminmeta[exps.forms[admins].toString()]);
                }

                let oids = new Set();
                for (let strid of filterids) {
                  let aview = adminmeta[strid];

                  if (aview) {
                    retadminmeta.add(aview);
                  } else {
                    oids.add(new ObjectID(strid));
                  }
                }
                returnMeta = Array.from(retadminmeta);
                if (oids.size > 0) {
                  query = {_id: Array.from(oids) };
                }
            }
          }

          if (!query) {
            console.log("getFormMeta() resolved just in admin metadata");
            resolve (returnMeta);
          } else {
              console.log(`getFormMeta: search formmeta for ${JSON.stringify(query)}`);
              exps.find(exps.forms.formMetadata, null, query, false, true).then( docs => {
            //db.collection('formmeta').find(oids.length >0 && { _id: { $in: oids }} || {}).toArray(function (err, docs)
                  console.log("getFormMeta: got user-based form meta data #=" + docs.length);
                  resolve(returnMeta.concat(docs)); //retmeta.concat(docs));
                }, err => reject ("reject: " + err)).catch((err) => reject ("err:" + err));
          }
          /*exps.find(exps.forms["formMetadata"], filterids && {id: filterids}, false, true).then(function(sucval) {
              console.log('getFormMeta: got user-based form meta data : ' + sucval.length);
              resolve(retmeta.concat(docs));
            }, function (errval) {
              console.log('getFormMeta : err ' + errval);
              reject(errval);
            });
            */
        } else {
          //reject("getFormMeta needs a list of forms to return");
          // TODO: just return everything :(  I need to fix this.
          //db.collection('formmeta').find({}).toArray(function (err, docs) {
          console.log("getFormMeta() get everything TODO - not good");
          exps.find(exps.forms.formMetadata, null, {}, false, true).then( docs => {
            console.log("getFormMeta: got user-based form meta data : " + docs.length);
            resolve(docs.concat(meta.FORMMETA));
          }, err => reject ("reject: " + err)).catch((err) => reject ("err:" + err));
        }
      }).catch(err => console.log ("getFormMeta : error : " + err));
    }

    return exps;
}
