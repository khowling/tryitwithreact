"use strict"

/**
 * Created by keith on 17/10/14.
 */
var System = require('es6-module-loader').System;
System.transpiler = 'babel';

var   express = require('express')
    , router = express.Router()
    , Grid = require('gridfs-stream')  // write to mongo grid filesystem
//  , fs = require('fs') // TESTING ONLY
    , mongo = require('mongodb')
    , GridStore = require('mongodb').GridStore
    , ObjectID = require('mongodb').ObjectID
    , jexl = require('jexl');

var typecheckFn;
System.import('./shared/dform.es6').then(function(dform) {
  console.log ('Setting shared module typecheckFn ' + dform);
  typecheckFn = dform.typecheckFn;
}, errval => console.log ('Setting shared module typecheckFn error ' + errval));



module.exports = function(options) {

    var meta = require('../libs/orm_mongo_meta')(options);
    var db = options.db;
    var exps = {};

    exps.find = function (formparam, query, findone, ignoreLookups) {
      return new Promise(function (resolve, reject)  {
        console.log ("find() staring, form: " + formparam + ", findone: ["+findone+"], ingnore lookups ["+ignoreLookups+"] query: " + JSON.stringify (query));

        /* search form meta-data for 'reference' fields to resolve (also search through 'childform' subforms) */
        var findFieldsandLookups = function (FORM_DATA, form, parentField, ignoreLookups, getsystemfields, lastresult) {
            var result = lastresult || {findField: {}, subqarray: []};
            if (!parentField && getsystemfields) {
              result.findField["_createdBy"] = 1;
              result.findField["_createDate"] = 1;
              result.findField["_updatedBy"] = 1;
              result.findField["_updateDate"] = 1;
              result.findField["_data"] = 1;
            }
            if (!ignoreLookups && getsystemfields) {
              let subqobj = {
                  field: "_updatedBy",
                  form: meta.findFormById(FORM_DATA, meta.forms.UserSearch)
              };
              if (parentField) {
                  subqobj.subdocfield = parentField;
              }
              result.subqarray.push(subqobj);
            }
            for (var f in form.fields) {
                var field = form.fields[f];
                if (!parentField && field.type != "relatedlist") {
                    // only add top level fields to the find
                    result.findField[field.name] = 1;
                }

                if (field.type === 'reference') {
                    console.log('find() findFieldsandLookups: found a lookup field on [' + form.name + '] field : ' + field.name);
                    let searchform = field.search_form && meta.findFormById(FORM_DATA, field.search_form._id);
                    let subqobj = {field: field.name};
                    if (!ignoreLookups && searchform)
                      subqobj.form = searchform
                    if (parentField)
                      subqobj.subdocfield = parentField;
                    result.subqarray.push(subqobj);

                } else if (field.type === 'childform') {
                    var childform = field.child_form && meta.findFormById(FORM_DATA, field.child_form._id);
                    if (!childform) {
                        return {error: 'find() Cannot find childform definitions on field ['+form.name+'.'+field.name+'] : ' + JSON.stringify(field.child_form)};
                    } else {
                        console.log('find() findFieldsandLookups: found a childform, recurse onit! name :' + field.child_form._id + ' : ' + childform.name);
                        result = findFieldsandLookups(FORM_DATA, childform, field.name, ignoreLookups, getsystemfields,  result);
                        if (result.error) break;
                    }
                }
            }
            return result;
        };

        /* Harvest lookup ids from primary document for foriegn key lookup */
        /* if subq is specified, update the docs with the lookup values */
        /* RETURNS: {'form_id': {form: <JSON form>, keys: ['id', 'id']}} */
        var processlookupids = function (subqarray, docs, subq) {
            let harvest = !subq,
                processFn = (obj, subqobj, lookupkeys, subq) => {
                  let harvest = !subq,
                      lookupfieldval = obj[subqobj.field];

                  if (lookupfieldval) {
                    if (harvest) { // harvest mode
                      try {
                        let keyval = lookupfieldval;
                        console.log ("find() processlookupids (harvest), need to find ["+subqobj.form.name+"]["+subqobj.field+"] val: " + lookupfieldval);
                        if (subqobj.form.store === "mongo") keyval = new ObjectID(lookupfieldval);
                        lookupkeys[subqobj.form._id].keys.push(keyval);
                      } catch (e) {
                        console.log (e + ' Warning : lookup value not in format of ObjectId:  field : ' + subqobj.field + ', val: ' + JSON.stringify(lookupfieldval));
                      }
                    } else { // update mode
                      console.log ("find() processlookupids (update), setting ["+subqobj.field+"] val: " + lookupfieldval);
                      obj[subqobj.field] = {  _id: lookupfieldval };
                      if (subqobj.form)
                          obj[subqobj.field].search_ref = subq[subqobj.form._id][lookupfieldval] || {error:'missing'};
                    }
                  }
                };

            var lookupkeys = {};
            for (var doc of docs) { // for each data row
                for (var subqobj of subqarray) { // for each 'reference' field from 'findFieldsandLookups'
                    if (harvest && !subqobj.form) continue; // no recorded search form, so dont run subquery
                    // if in harvest mode, initialise lookupkeys array
                    if (harvest && !lookupkeys[subqobj.form._id])  lookupkeys[subqobj.form._id] = {form: subqobj.form, keys: []};

                    if (subqobj.subdocfield) {
                        // if field is in an embedded-document,
                        for (var edidx in doc[subqobj.subdocfield]) {
                          processFn(doc[subqobj.subdocfield][edidx], subqobj, lookupkeys, subq);
                        }
                    } else {
                      // if field is NOT in an embedded-document, just add id to lookupkeys
                      processFn(doc, subqobj, lookupkeys, subq);
                    }
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
            let q = { _id: { $in: objids }},
                fieldsandlookups = findFieldsandLookups(FORM_DATA, form, null, true, false);

            console.log('find() runsubquery() find  ' + form.collection + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(fieldsandlookups.findField));

            db.collection(form.collection).find(q, fieldsandlookups.findField).toArray(function (err, docs) {
                if (err) reject(err);
                else {

                  processlookupids (fieldsandlookups.subqarray, docs, []);
                  // if less results than expected and using 'formMeta' lookup to the formMetadata object, include the META_DATA, as there may be a reference.
                  // need to call processlookupids in update mode to format the reference fields
                  // TODO: Should this be done on the client??

                  if (objids.length > docs.length && form._id === meta.forms.metaSearch) {
                    let metares = [];
                    for (let lid of objids) {
                      if (docs.filter(r => r._id === lid).length == 0)  {
                        console.log ('finding in metasearch: ' + lid);
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
        var runallsubqueries = function (FORM_DATA, subqarray, lookupkeys) {
          return new Promise(function (resolve, reject)  {
            let subq_res = {};
            if (Object.keys(lookupkeys).length == 0) {
              resolve();
            } else {
              let promises = []
              for (var scoll in lookupkeys) {
                  let form = lookupkeys[scoll].form,
                      keys = lookupkeys[scoll].keys;

                  if (form.store === "metadata") {
                    console.log ('find() runallsubqueries, metadata searchform, use form to resolve lookups : ' + form.name);
                    subq_res[form._id] = {};
                    if (form._data) for (let key of keys) {
                      let val = form._data.find(i => i._id === key);
                      console.log ('find() runallsubqueries, metadata searchform, setting ['+form._id+']['+key+'] : ' + JSON.stringify(val));
                      if (val) subq_res[form._id][key] =  val;
                    }
                  } else if (form.store === "mongo") {
                    console.log ('find() runallsubqueries, mongo searchform, use form to resolve lookups : ' + form.name);
                    promises.push(runsubquery (FORM_DATA, form, keys));
                  } else {
                    subq_res[form._id] = {};
                  }
              }
              Promise.all(promises).then(function (succVal) {
                  console.log ('Got all suqqueries, now shape the data: ' + JSON.stringify(succVal));

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

        exps.getFormMeta(formparam).then(function(FORM_DATA) {
            console.log("find() FORM_DATA ["+formparam+"] #=" + FORM_DATA.length);
            let form = meta.findFormById(FORM_DATA, formparam);

            if (!form  || !form.collection) {
              return reject ("find() form not Found or no defined collection : " + formparam);
            } else {

              //console.log("find() create the mongo query");
              let mquery = {};
              if (query) {
                if (typeof query === "object") {
                  for (let qkey in query) {
                    if (qkey === "id") {
                      if (Array.isArray(query.id)) {
                        if (findone) return reject ("query parameter 'id' is a array, but findone is 'true'");
                        mquery._id = {"$in": []};
                        for (let i of query.id) {
                          try {
                            mquery._id["$in"].push (new ObjectID(i));
                          } catch (e) {
                            return reject ("query parameter 'id' doesnt contain a valid objectid :  " + i);
                          }
                        }
                      } else {
                        if (!findone) return reject ("query parameter 'id' is a objectid, but findone is 'false'");
                        try {
                          mquery._id = new ObjectID(query.id);
                        } catch (e) {
                          return reject ("query parameter 'id' doesnt contain a valid objectid :  " + query.id);
                        }
                      }
                    } else if (qkey === "p")  {
                      if (findone) return reject ("query parameter 'p' (text search on primary field), but findone is 'true'");
                      // searches field with ->> db.ensureIndex(collectionname, index[, options], callback)
                      //db.createIndex(form.collection, {"name": "text"}, { comments: "text" }, function (a,b) {console.log ("create idx : " + JSON.stringify({a: a, b: b}))});
                      //mquery = { "$text": { "$search": query.p}};
                      mquery = {name: {$regex: query.p, $options: 'i'}}
                    } else if (qkey === "q") {
                      let validatedq = {};
                      for (let fieldname in query.q) {
                        let fval = query.q[fieldname],
                            fdef = form.fields.find(x => x.name === fieldname);
                        if (fieldname === "_id")
                          // probably query list of _ids, processed on server, already in ObjectID format
                          validatedq[fieldname] = fval;
                        else if (!fdef) {
                          let idxdot = fieldname.indexOf ('.');
                          if (idxdot > -1) {
                            if (!form.fields.find(x => x.name === fieldname.substr(0,idxdot)))
                              return reject ("query object doesnt contains a invalid field :  " + fieldname);
                          } else
                            return reject ("query object doesnt contains a invalid field :  " + fieldname);
                        }else if (fdef.type === "reference" && fval && typeof fval === 'string' && fval.length == 24)
                            validatedq[fieldname] = new ObjectID(fval);
                          else
                            validatedq[fieldname] = fval;
                      }
                      mquery = validatedq;
                    } else {
                      return reject ("query parameter not recognised : " + qkey);
                    }
                  }
                } else return reject ("query parameter needs to be an objet");
              }
              console.log("find() create the mongo query : " + JSON.stringify(mquery));

              //console.log('looking for lookup fields in ' + form.name);
              var fieldsandlookups = findFieldsandLookups(FORM_DATA, form, null, ignoreLookups, true);
              console.log('find() fieldsandlookups'); // + JSON.stringify(fieldsandlookups));

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

                        console.log("find() got records") // ' + JSON.stringify(doc));

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
                          console.log ('resolve: ' );
                          // need to call processlookupids in update mode to format the reference fields
                          processlookupids (fieldsandlookups.subqarray, findone && [doc] || doc, []);
                          return resolve(doc);
                        } else {
                            var lookupkeys = processlookupids(fieldsandlookups.subqarray, findone && [doc] || doc);
                            console.log("find() got query for foriegn key lookup "); // + JSON.stringify(lookupkeys));

                            runallsubqueries(FORM_DATA, fieldsandlookups.subqarray, lookupkeys).then(function (succVal) {
                              if (succVal) {
                                console.log("find() runallsubqueries success, now processlookupids, recs:" + (findone && "1" || doc.length));
                                processlookupids (fieldsandlookups.subqarray, findone && [doc] || doc, succVal);
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
                    console.log('findOne for ' + form.collection + ' id: ' + JSON.stringify(mquery));
                    db.collection(form.collection).findOne(mquery, fieldsandlookups.findField, retfn);

                } else {
                    console.log('find() ' + form.collection + ' : query : ' + JSON.stringify(mquery) + ' :  findField : ' + JSON.stringify(fieldsandlookups.findField));
                    db.collection(form.collection).find(mquery, fieldsandlookups.findField, {}).toArray(retfn);
                }
              }
            }
        }, function (err) {
            reject ('find() Cannot find form definitions ' + err);
        }).catch(function (err) {
            reject ('find() Program Error: ' + err);
        });
      });
    };

    exps.delete = function(formparam, recid, parentfieldid, parentid, success, error ) {

        exps.getFormMeta(formparam).then(function(FORM_DATA) {
            var form = meta.findFormById(FORM_DATA, formparam),
                isEmbedded = (parentfieldid && parentid);

            if (!form) {
                error ("delete() not Found : " + formparam);
            } else if (!isEmbedded && (parentfieldid || parentid)){
                error ("delete() need to supply both 'parentfieldid' and 'parentid' for embedded document delete : " + formparam);
            } else {

                var coll = form.collection;
                var embedfield;

                //if (form.type == "childform") {
                if (isEmbedded) {
                    console.log('delete() Its a childform, get the collection & field from the parent form : ' + parentfieldid);
                    var parentmeta = meta.findFieldById(FORM_DATA, parentfieldid);

                    if (!parentmeta) {
                        error ('delete() Cannot find parent form field for this childform: ' + parentfieldid);
                    } else if (!(new ObjectID(form._id)).equals(parentmeta.field.child_form._id)) {
                        error ('delete() childform cannot be saved to parent (check your schema child_form): ' + parentfieldid);
                    } else {
                        coll = parentmeta.form.collection;
                        embedfield = parentmeta.field.name;
                        console.log('delete() collection : ' + coll + ', field : ' + embedfield);
                    }
                }

                //callback gets two parameters - an error object (if an error occured) and the record if it was inserted or 1 if the record was updated.
                var callback = function (err, recs) {
                    if (err) error (err);
                    console.log('delete() done  : ' + JSON.stringify(recs) + ' doc : ' + recid);
                    if (recs == 1) { // updated
                        success({_id: recid}); // updated top level
                    } else {
                        success(recs[0]); // inserted (has to be top level)
                    }
                };

                if (isEmbedded) {
                  //console.log('delete() query parentid : ' + parentid + ' recid : ' + recid);
                  var query = {_id: new ObjectID(parentid)};
                  var update = { $pull: {} }
                  update["$pull"][embedfield] = { _id: new ObjectID(recid) };

                  console.log('delete()  ' + coll + ' query :' + JSON.stringify(query) + ' update :' + JSON.stringify(update));
                  db.collection(coll).update(query, update, function (err, out) {
                    console.log ('delete() update res : ' + JSON.stringify(out) + ', err : ' + err);
                    if (err) {
                       error (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                    } else {
                      success ({_id: query._id});
                    }
                  });
                } else {
                  db.collection(coll).remove({_id: new ObjectID(recid)}, function (err, out) {
                    console.log ('delete() res : ' + JSON.stringify(out) + ', err : ' + err);
                    if (err) {
                       error (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                    } else {
                      success ({_id: recid});
                    }
                  });
                }
            }
        }, function (err) {
            error ('delete() cannot find form definitions ' + err);
        }).catch(function (err) {
            error ('delete() catch error ' + err);
        });
    };


    exps.save = function (formparam, parentfieldid,parentid, userdoc, userid) {
        return new Promise( function(resolve, reject)  {
          exps.getFormMeta(formparam).then(function(FORM_DATA) {
            var form = meta.findFormById(FORM_DATA, formparam),
                isInsert = Array.isArray (userdoc) || typeof userdoc._id === 'undefined',
                isEmbedded = (parentfieldid && parentid);

            if (!form) {
                return reject ("save() form not Found : " + formparam);
            } else if (!isEmbedded && (parentfieldid || parentid)){
                return reject ("save() need to supply both 'parentfieldid' and 'parentid' for embedded document save : " + formparam);
            } else if (Array.isArray (userdoc) && isEmbedded){
                return reject ("save() cannot save array of records into embedded doc");
            } else {

                console.log ('save() formparam:' + formparam + ' : got form lookup: ' + form.name);
                var coll = form.collection;
                var embedfield;

                //if (form.type == "childform") {
                if (isEmbedded) {
                    console.log ('save() Its a childform, get the collection & field from the parent parentfieldid : ' + parentfieldid);
                    var  parentmeta = meta.findFieldById(FORM_DATA, parentfieldid);

                    if (!parentmeta) {
                        return reject ('save() Cannot find parent form field for this childform: ' + parentfieldid);
                    } else if (!(new ObjectID (form._id)).equals(parentmeta.field.child_form._id)) {
                        return reject ('save() childform cannot be saved to parent (check your schema child_form): ' + parentfieldid);
                    } else {
                        coll = parentmeta.form.collection;
                        embedfield = parentmeta.field.name;
                        console.log ('save() collection : ' + coll + ', field : ' + embedfield);
                    }
                }

                console.log('save() collection: '+coll+' userdoc: ' + JSON.stringify(userdoc));
                // build the field set based on metadata - NOT the passed in JSON!
                // 'allowchildform'  if its a INSERT of a TOP LEVEL form, allow a childform to be passed in (used by auth.js)
                var validateSetFields = function (isInsert, form, dataval, embedField, allowchildform) {
                  var isarray = Array.isArray(dataval),
                        reqval = isarray && dataval || [dataval],
                        setval = [];

                  // create formfield object keyed on fieldname


                //  let fldsByPropname = {};
                //  for (let f of form.fields) {
                //    fldsByPropname[f.name] = f;
                //  }
                  //console.log ("Save: validateSetFields, looping through save records: " + reqval.length);
                  for (let rv of reqval) { // for each data record
                    let tv = {};  // target validated object


                    if (isInsert) {
                      if (rv._id) return {error: "Insert request, data already contains key (_id) : " + rv._id};
                      // generate new ID.
                      tv._id = new ObjectID();
                      tv._createDate = new Date();
                      tv._createdBy = userid;
                      tv._updateDate = new Date();
                      tv._updatedBy = userid;
                    } else { // update
                      // if updating, data doesn't need new _id.
                      if (!rv._id) return {error: "Update request, data doesnt contain key (_id)"};
                      tv._updateDate = new Date();
                      tv._updatedBy = userid;
                    }
                    //console.log ("Save: validateSetFields, looping through record propities");
                    for (let propname in rv) { // for each property in data object
                      let fval = rv[propname], // store the requrested property value
                          tprop = embedField && embedfield+'.$.'+propname || propname;  // format the target property name for mongo

                      let tcres = typecheckFn (form, propname, fval, (fid) => meta.findFormById(FORM_DATA, fid), ObjectID);
                      if ('error' in tcres)
                        return tcres;
                      else if ('validated_value' in tcres)
                        tv[tprop] = tcres.validated_value;
                      else if ('childform_array' in tcres) {

                          if (!allowchildform) {
                            continue; // just ignore the childform data!
                            return {error: "data contains childform field, not allowed in this mode: " + propname};
                          }

                          let ctav = [];  // child  target array validated
                          // create formfield object keyed on fieldname
                          let cform = tcres.childform_field.child_form && meta.findFormById(FORM_DATA, tcres.childform_field.child_form._id);
                          if (!cform) return {error: "data contains childform field, but no child_form defined for the field: " + propname};
                      //    let cfldsByPropname = {};
                      //    for (let f of cform.fields) {
                      //      cfldsByPropname[f.name] = f;
                      //    }

                          for (let cval of tcres.childform_array) {
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

                if (!isEmbedded) {
                    //console.log('/db/'+coll+'  saving or updating a top-level document :' + userdoc._id);

                  if (!isInsert) {
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

                    console.log('save() collection ['+coll+'] update verified data : ' + JSON.stringify (update));
                    db.collection(coll).update (query, update,  function (err, out) {
                      console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                      if (err) {
                         reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                      } else {
                        resolve ({_id: query._id});
                      }
                    });
                  } else {
                    //console.log('/db/'+coll+'  insert toplevel document, use individual fields');
                    let insert,
                        validatedUpdates = validateSetFields(isInsert, form, userdoc, null, true);
                    if (validatedUpdates.error)
                      return reject (validatedUpdates.error);
                    else
                      insert = validatedUpdates.data;

                    console.log('save() '+coll+' insert verified data : ' + JSON.stringify (insert));
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

                } else {  // its modifing a embedded document
                  let query, update;
                  //console.log('/db/'+coll+'  set or push a embedded document :' + parentid);
                  try {
                    query = {_id: new ObjectID(parentid)};
                  } catch (e) {
                    return reject ("save() parentid not acceptable format : " + parentid);
                  }
                  /***** TRYING TO DO EMBEDDED ARRAY inside EMBEDDED ARRAY, BUT MONGO DOESNT SUPPORT NESTED POSITIONAL OPERATORS
                   var embedsplit = embedfield.split('.');
                   if (embedsplit.length == 2) {
                      query['"' + embedsplit[0] + '._id"'] = new ObjectID(parentid);
                  }  else {
                      query = {_id: new ObjectID(parentid)};
                  }
                   */

                  if (!isInsert) { // its updating a existing embedded entry
                    try {
                      // add embedded doc id to the query
                      query[embedfield+"._id"] =  new ObjectID(userdoc._id);
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
                      console.log ('embedded fld:' + embedfield + ', : ' + JSON.stringify(fldpush));
                      update = {'$push': fldpush};
                    }
                  }
                  console.log('save() update: query :' + JSON.stringify(query) +' update :' + JSON.stringify(update));
                  db.collection(coll).update(query, update, function (err, out) {
                    console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                    if (err) {
                       return reject (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                    } else {
                  return resolve ({_id: isInsert && update['$push'][embedfield]._id || query[embedfield+"._id"]});
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
                  query = {q: { _id: { $in: Array.from(oids) }}};
                }
            }
          }

          if (!query) {
            console.log("getFormMeta() resolved just in admin metadata");
            resolve (returnMeta);
          } else {
              exps.find(exps.forms.formMetadata, query, false, true).then( docs => {
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
          exps.find(exps.forms.formMetadata, {}, false, true).then( docs => {
            console.log("getFormMeta: got user-based form meta data : " + docs.length);
            resolve(docs.concat(meta.FORMMETA));
          }, err => reject ("reject: " + err)).catch((err) => reject ("err:" + err));
        }
      }).catch(err => console.log ("getFormMeta : error : " + err));
    }

    return exps;
}
