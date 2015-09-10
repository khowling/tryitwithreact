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
    , ObjectID = require('mongodb').ObjectID;


module.exports = function(options) {

    var meta = require('../libs/orm_mongo_meta')(options);
    var db = options.db;
    var exps = {};

    exps.find = function (formparam, query, findone, ignoreLookups) {
      return new Promise(function (resolve, reject)  {
        console.log ("find() staring, form: " + formparam + ", findone: ["+findone+"], ingnore lookups ["+ignoreLookups+"] query: " + JSON.stringify (query));

        /* search form meta-data for 'lookup' fields to resolve (also search through 'childform' subforms) */
        var findFieldsandLookups = function (FORM_DATA, form, parentField, lastresult) {
            var result = lastresult || {findField: {}, subqarray: []};
            for (var f in form.fields) {
                var field = form.fields[f];
                if (!parentField) {
                    // only add top level fields to the find
                    result.findField[field.name] = 1;
                }
                if (!ignoreLookups) {
                    if (field.type === 'lookup') {
                        console.log('find() findFieldsandLookups: found a lookup field on [' + form.name + '] field : ' + field.name);
                        var searchform = meta.findFormById(FORM_DATA, field.search_form);
                        if (searchform) {
                            var subqobj = {
                                field: field.name,
                                form: searchform
                            };
                            if (parentField) {
                                subqobj.subdocfield = parentField;
                            }
                            result.subqarray.push(subqobj);
                        }
                    } else if (field.type === 'childform') {
                        var childform = meta.findFormById(FORM_DATA, field.child_form);
                        if (!childform) {
                            return {error: 'find() Cannot find childform definitions on field ['+form.name+'.'+field.name+'] : ' + field.child_form};
                        } else {
                            console.log('find() findFieldsandLookups: found a childform, recurse onit! name :' + field.child_form + ' : ' + childform.name);
                            result = findFieldsandLookups(FORM_DATA, childform, field.name, result);
                            if (result.error) break;
                        }
                    }
                }
            }
            return result;
        };

        /* Harvest lookup ids from primary document for foriegn key lookup */
        /* if subq is specified, update the docs with the lookup values */
        var processlookupids = function (subqarray, docs, subq) {
            var lookupkeys = {};
            for (var didx in docs) {
                // for each data row
                var doc = docs[didx];
                for (var saidx in subqarray) {
                    // for each 'lookup' field
                    var subq_obj = subqarray[saidx];
                    // if in harvest mode, initialise lookupkeys array
                    if (!subq && !lookupkeys[subq_obj.form._id])  lookupkeys[subq_obj.form._id] = {form: subq_obj.form, keys: []};

                    if (subq_obj.subdocfield) {
                        // if field is in an embedded-document,
                        for (var edidx in doc[subq_obj.subdocfield]) {
                          // loop round records and pull out id of lookup fields into lookupkeys
                          var lookupfieldval = doc[subq_obj.subdocfield][edidx][subq_obj.field];
                          //console.log ("find() processlookupids " + subq_obj.field + ":" + subq_obj.collection + " = " + JSON.stringify(lookupfieldval));
                          if (lookupfieldval) {
                            if (!subq) {
                              // harvest mode
                              try {
                                lookupkeys[subq_obj.form._id].keys.push(new ObjectID(lookupfieldval));
                              } catch (e) {
                                console.log ('Warning : lookup value not in format of ObjectId: ' + doc._id + ', field : ' + subq_obj.field + ', val: ' + JSON.stringify(lookupfieldval));
                              }
                            } else {
                              // update mode
                              doc[subq_obj.subdocfield][edidx][subq_obj.field] = {
                                _id: lookupfieldval,
                                primary: subq[lookupfieldval] || 'missing'};
                            }
                          }
                        }
                    } else {
                      // if field is NOT in an embedded-document, just add id to lookupkeys
                      if (doc[subq_obj.field])
                        if (!subq) {
                          // harvest mode
                          try {
                            lookupkeys[subq_obj.form._id].keys.push(new ObjectID(doc[subq_obj.field]));
                          } catch (e) {
                            console.log ('Warning : lookup value not in format of ObjectId: ' + doc._id + ', field : ' + subq_obj.field + ', val: ' + JSON.stringify(doc[subq_obj.field]));
                          }
                        } else {
                          // update mode
                          doc[subq_obj.field] = {
                            _id: doc[subq_obj.field],
                            primary: subq[doc[subq_obj.field]] || 'missing'};
                        }
                    }
                }
            }
            // Map<collection, List<ids>.
            if (!subq) {
              return lookupkeys;
            } else {
              return docs;
            }
        };

        /* run subquery */
        var runsubquery = function (FORM_DATA, form, objids, pfld) {
          return new Promise(function (resolve, reject)  {
            var primaryfld = pfld || "name",
                q = { _id: { $in: objids }},
                flds = { [primaryfld]: 1 }; // Computed property names (ES6)
            console.log('find() runsubquery() find  ' + form.collection + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(flds));

            db.collection(form.collection).find(q, flds).toArray(function (err, docs) {
                if (err) reject(err);
                else {

                  // if less results than expected and using 'formMeta' lookup to the formMetadata object, include the META_DATA, as there may be a reference.
                  if (objids.length > docs.length && form._id === meta.forms.metaSearch) {
                    console.log ('finding in metasearch');
                    let metares = [];
                    for (let lid of objids) {
                      //if (!docs.filter(r => r._id === lid))  // ES6 :(
                      let gotit = false;
                      for (let d of docs) {if (d._id === lid) gotit = true;};
                      if  (!gotit) {
                        let lform = meta.findFormById(FORM_DATA, lid);
                        if (lform) docs.push ({_id: lform._id, name: lform.name});
                      }
                    }
                  }

                  resolve({primaryfld: primaryfld, recs: docs});
                }
            });
          });
        };

        /* flow control - run sub queries in parrallel & call alldonefn(docs) when done! */
        var runallsubqueries = function (FORM_DATA, subqarray, lookupkeys) {
          return new Promise(function (resolve, reject)  {
            if (Object.keys(lookupkeys).length == 0) {
              resolve();
            } else {
              let promises = []
              for (var scoll in lookupkeys) {
                  let form = lookupkeys[scoll].form,
                      keys = lookupkeys[scoll].keys;
                  promises.push(runsubquery (FORM_DATA, form, keys));
              }
              Promise.all(promises).then(function (succVal) {
                  console.log ('Got all suqqueries, now shape the data: ' + JSON.stringify(succVal));
                  let subq_res = {};
                  for (let subq of succVal) {
                      for (let rec of subq.recs) {
                        subq_res[rec._id] = rec[subq.primaryfld];
                      }
                  }
                  resolve(subq_res);
                }).catch(function (reason) {
                    reject(reason);
                });
            }
          });
        }

        exps.getFormMeta().then(function(FORM_DATA) {
            let form = meta.findFormById(FORM_DATA, formparam);

            if (!form  || !form.collection) {
              reject ("find() form not Found or no defined collection : " + formparam);
            } else {

              console.log("find() create the mongo query");
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
                      mquery = query.q;
                    } else {
                      return reject ("query parameter not recognised : " + qkey);
                    }
                  }
                } else return reject ("query parameter needs to be an objet");
              }
              console.log("find() create the mongo query : " + JSON.stringify(mquery));

              //console.log('looking for lookup fields in ' + form.name);
              var fieldsandlookups = findFieldsandLookups(FORM_DATA, form);
              console.log('find() fieldsandlookups: ' + JSON.stringify(fieldsandlookups));

              if (fieldsandlookups.error) {
                reject(fieldsandlookups.error)
              } else {

                let retfn = function (err, doc) {
                    if (err ) {
                      console.log('find() find ERROR :  ' + err);
                      reject (err);
                    } else {
                        console.log("find() got documents succfull") // ' + JSON.stringify(doc));

                        if (ignoreLookups) {
                            resolve(doc);
                        } else {
                            var lookupkeys = processlookupids(fieldsandlookups.subqarray, findone && [doc] || doc);
                            console.log("find() got query for foriegn key lookup "); // + JSON.stringify(lookupkeys));

                            runallsubqueries(FORM_DATA, fieldsandlookups.subqarray, lookupkeys).then(function (succVal) {
                              if (succVal) {
                                console.log("find() runallsubqueries success, now processlookupids, recs:" + (findone && "1" || doc.length));
                                processlookupids (fieldsandlookups.subqarray, findone && [doc] || doc, succVal);
                              }
                              resolve(doc);
                            }, function (errVal) {
                              console.log("find() runallsubqueries error " + errVal);
                              reject(errVal)
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
            reject ('find() catch error ' + err);
        });
      });
    };

    exps.delete = function(formparam, recid, parentfieldid, parentid, success, error ) {

        exps.getFormMeta().then(function(FORM_DATA) {
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
                    } else if (!(new ObjectID(form._id)).equals(parentmeta.field.child_form)) {
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
        });
    };


    exps.save = function (formparam, parentfieldid,parentid, userdoc) {
        return new Promise( function(resolve, reject)  {
          exps.getFormMeta().then(function(FORM_DATA) {
            var form = meta.findFormById(FORM_DATA, formparam),
                isInsert = Array.isArray (userdoc) || typeof userdoc._id === 'undefined',
                isEmbedded = (parentfieldid && parentid);

            if (!form) {
                return reject ("save() not Found : " + formparam);
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
                    } else if (!(new ObjectID (form._id)).equals(parentmeta.field.child_form)) {
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
                var validateSetFields = function (isInsert, formFields, dataval, embedField, allowchildform) {
                  var isarray = Array.isArray(dataval),
                        reqval = isarray && dataval || [dataval],
                        setval = [];

                  // create formfield object keyed on fieldname
                  let fldmetalist = {};
                  for (let f of formFields) {
                    fldmetalist[f.name] = f;
                  }

                  // for each data record
                  for (var rqidx in reqval) {
                    var rv = reqval[rqidx],
                        tv = {};

                    if (isInsert) {
                      if (rv._id) return {error: "Insert request, data already contains key (_id) : " + rv._id};
                      // generate new ID.
                      tv._id = new ObjectID();
                    } else { // update
                      // if updating, data doesn't need new _id.
                      if (!rv._id) return {error: "Update request, data doesnt contain key (_id)"};
                    }

                    // for each data record prop
                    for (let propname in rv) {
                        console.log ('Finding ' + propname +' in ' + JSON.stringify (formFields));

                        if (propname === "_id") continue;

                        let fldmeta = fldmetalist[propname],
                            fval = rv[propname],
                            tprop = embedField && embedfield+'.$.'+propname || propname;

                        if (!fldmeta)
                          return {error: "data contains fields not recognised : " + propname};
                        if (fldmeta.type === "lookup") {
                          if (fval && !fval._id) {error: "data contains lookup field with recognised _id: " + propname};
                          tv[tprop] = fval && fval._id || null;
                        } else if (fldmeta.type === "childform") {

                          if (!allowchildform) {
                            continue; // just ignore the childform data!
                            return {error: "data contains childform field, not allowed in this mode: " + propname};
                          }

                          // NEED TO VALIDATE CHILD FORM DATA!
                          if (!Array.isArray(fval)) return {error: "data contains childform field, but data is not array: " + propname};
                          let cform = meta.findFormById(FORM_DATA, fldmeta.child_form);

                          // create formfield object keyed on fieldname
                          let cfldmetalist = {};
                          for (let f of cform.fields) {
                            cfldmetalist[f.name] = f;
                          }

                          for (let cval of fval) {
                            if (cval._id) return {error: "data contains childform field, and data array contains existing _id: " + propname};
                            cval._id =  new ObjectID(rv._id);
                            for (let cpropname in cval) {

                                if (cpropname === "_id") continue;

                                let cfldmeta = cfldmetalist[cpropname];
                                if (!cfldmeta)
                                  return {error: "data contains fields in child for not recognised : " + propname + "." + cpropname};
                                if (cfldmeta.type === "lookup") {
                                  if (cval[cpropname] && !cval[cpropname]._id) {error: "data contains lookup field with recognised _id: " + propname};
                                  cval[cpropname] = cval[cpropname] && cval[cpropname]._id || null;
                                }

                            }
                          }
                          tv[tprop] = fval;
                        } else {
                          tv[tprop] = fval;
                        }
                    }
                    setval.push(tv);
                  }
                  return {data: isarray && setval || setval[0]};
                }

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
                    let validatedUpdates = validateSetFields(isInsert, form.fields, userdoc, null);
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
                        validatedUpdates = validateSetFields(isInsert, form.fields, userdoc, null, true);
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
                    let validatedUpdates = validateSetFields(isInsert, form.fields, userdoc, embedfield);
                    if (validatedUpdates.error)
                      return reject (validatedUpdates.error);
                    else {
                      update = {'$set': validatedUpdates.data};
                    }

                  } else {  // its $push'ing a new embedded entry

                    let validatedUpdates = validateSetFields(isInsert, form.fields, userdoc, null);
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
        });
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


    exps.getFormMeta = function (filterids) {
      // filterids:  not specified, return all
      // if specified, use as a query filter
      return new Promise(function (resolve, reject)  {
        console.log("getFormMeta() filterids : " + JSON.stringify(filterids));
        let adminmeta = meta.adminMetabyId(),
            retadminmeta = [];

        // apps that need to work with files
        retadminmeta.push(adminmeta[exps.forms.FileMeta.toString()]);

        // Get out of Jail!!
        //for (let admins in exps.forms) {
        //  retadminmeta.push(adminmeta[exps.forms[admins].toString()]);
        //}

        if (filterids) {
          let oids = [];
          for (let strid of filterids) {
            let aview = adminmeta[strid];
            if (aview) {
              retadminmeta.push(aview);
            } else {
              oids.push(new ObjectID(strid));
            }
          }
          if (oids.length == 0) {
            resolve (retadminmeta);
          } else {
            db.collection('formmeta').find(oids.length >0 && { _id: { $in: oids }} || {}).toArray(function (err, docs) {
              console.log("getFormMeta: got user-based form meta data [err: "+err+"]: " + docs.length);
              if (err) reject (err);
              else resolve(retadminmeta.concat(docs)); //retmeta.concat(docs));
            });
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
          db.collection('formmeta').find({}).toArray(function (err, docs) {
            console.log("getFormMeta: got user-based form meta data [err: "+err+"]: " + docs.length);
            if (err) reject (err);
            else resolve(docs.concat(meta.FORMMETA)); //retmeta.concat(docs));
          });
        }
      });
    }

    return exps;
}
