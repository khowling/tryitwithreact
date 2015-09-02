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

    exps.find = function (formparam, q, success, error, ignoreLookups) {
        console.log ('find() formparam ' + formparam + ' q ' + JSON.stringify (q));
        /* search form meta-data for 'lookup' fields to resolve (also search through 'childform' subforms) */
        var subqarray = []; // lookup fields to query
        var fields = {}; // fields to return in find


        var findlookupfields = function (FORM_DATA, form, parentField) {
            for (var f in form.fields) {
                var field = form.fields[f];
                if (!parentField) {
                    // only add top level fields to the find
                    fields[field.name] = 1;
                }
                if (!ignoreLookups) {
                    if (field.type === 'lookup') {
                        console.log('find() findlookupfields: found a lookup field on ' + form.name + ' field ' + field.name);
                        var searchform = meta.findFormById(FORM_DATA, field.search_form);
                        if (searchform) {
                            var subqobj = {
                                field: field.name,
                                collection: searchform.collection
                            };
                            if (parentField) {
                                subqobj.subdocfield = parentField;
                            }
                            subqarray.push(subqobj);
                        }
                    } else if (field.type === 'childform') {
                        var childform = meta.findFormById(FORM_DATA, field.child_form);
                        if (!childform) {
                            error('find() Cannot find form definitions ' + field.child_form);
                            return;
                        } else {
                            console.log('find() findlookupfields: found a childfield, recurse onit! name :' + field.child_form + ' : ' + childform.name);
                            findlookupfields(FORM_DATA, childform, field.name);
                        }
                    }
                }
            }
        };

        /* Harvest lookup ids from primary document for foriegn key lookup */
        /* if subq is specified, update the docs with the lookup values */
        var processlookupids = function (docs, subq) {
            var lookupkeys = {};
            for (var didx in docs) {
                // for each data row
                var doc = docs[didx];
                for (var saidx in subqarray) {
                    // for each 'lookup' field
                    var subq_obj = subqarray[saidx];
                    // if in harvest mode, initialise lookupkeys array
                    if (!subq && !lookupkeys[subq_obj.collection])  lookupkeys[subq_obj.collection] = [];

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
                                lookupkeys[subq_obj.collection].push(new ObjectID(lookupfieldval));
                              } catch (e) {
                                console.log ('Warning : lookup value not in format of ObjectId: ' + doc._id + ', field : ' + subq_obj.field + ', val: ' + JSON.stringify(lookupfieldval));
                              }
                            } else {
                              // update mode
                              doc[subq_obj.subdocfield][edidx][subq_obj.field] = {
                                _id: lookupfieldval,
                                primary: subq[lookupfieldval]};
                            }
                          }
                        }
                    } else {
                      // if field is NOT in an embedded-document, just add id to lookupkeys
                      if (doc[subq_obj.field])
                        if (!subq) {
                          // harvest mode
                          try {
                            lookupkeys[subq_obj.collection].push(new ObjectID(doc[subq_obj.field]));
                          } catch (e) {
                            console.log ('Warning : lookup value not in format of ObjectId: ' + doc._id + ', field : ' + subq_obj.field + ', val: ' + JSON.stringify(doc[subq_obj.field]));
                          }
                        } else {
                          // update mode
                          doc[subq_obj.field] = {
                            _id: doc[subq_obj.field],
                            primary: subq[doc[subq_obj.field]]};
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
        }

        /* run subquery */
        var subq_res = {};
        var runsubquery = function (scoll, objids, callwhendone, success, error) {
            var q = { _id: { $in: objids }};
            var flds = { name: 1 };
            console.log('find() runsubquery() find  ' + scoll + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(flds));

            db.collection(scoll).find(q, flds, function(err, resultCursor) {
                if (err) {
                    error(err);
                    callwhendone();
                }
                var fnProcessItem = function (err, item) {
                    //console.log ('got ' + JSON.stringify(item));
                    if (item === null) {
                        // finished
                        callwhendone();
                    } else {
                        subq_res[item._id] = item.name;
                        resultCursor.nextObject(fnProcessItem);
                    }
                };
                resultCursor.nextObject(fnProcessItem);
            });
        };

        /* flow control - run sub queries in parrallel & call alldonefn(docs) when done! */
        var runallsubqueries = function (lookupkeys, docs, alldonefn ) {
            if (Object.keys(lookupkeys).length == 0) {
                alldonefn(docs);
            } else {
                var completed = 0;
                for (var scoll in lookupkeys) {
                    runsubquery (scoll, lookupkeys [scoll], function(){
                        completed++;
                        if(completed ===  Object.keys(lookupkeys).length) {
                            alldonefn(processlookupids(docs, subq_res));
                        }
                    });
                }
            }
        }


        meta.getFormMeta(function(FORM_DATA) {
            console.log('find() looking for fields in form : ' + formparam);
            form = meta.findFormById(FORM_DATA, formparam);

            if (!form  || !form.collection) {
              error ("find() form not Found or no defined collection : " + formparam);
            } else {

              //console.log('looking for lookup fields in ' + form.name);
              findlookupfields(FORM_DATA, form);
              console.log('find() need to do additional queries to resolve lookups? ' + JSON.stringify(subqarray));


              // its find one!  TIMEBOM??
              if ("_id" in q || "provider.provider_id"  in q) {
                  console.log('findOne for ' + form.collection + ' id: ' + JSON.stringify(q));
                  if ("_id" in q)  q._id = new ObjectID(q._id);
                  db.collection(form.collection).findOne(q, function (err, doc) {
                      if (err ) {
                          error (err);
                      } else {
                          console.log('find() got document ' + JSON.stringify(doc));

                          if (ignoreLookups) {
                              success([doc]);
                          } else {
                              var lookupkeys = processlookupids([doc]);
                              console.log('find() got query for foriegn key lookup ' + JSON.stringify(lookupkeys));

                              runallsubqueries(lookupkeys, [doc], function (docs) {
                                  success(docs);
                              });
                          }
                      }
                  });

              } else {
                  console.log('find() ' + form.collection + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(fields));
                  db.collection(form.collection).find(q, fields, {}).toArray(function (err, docs) {
                      if (err) {
                          console.log('find() find ERROR :  ' + err);
                          error (err);
                      } else {

                          console.log('find() documents ' + JSON.stringify(docs));

                          if (ignoreLookups) {
                              success(docs);
                          } else {
                              var lookupkeys = processlookupids(docs);
                              console.log('find() query for foriegn key lookup ' + JSON.stringify(lookupkeys));

                              runallsubqueries(lookupkeys, docs, function (docs) {
                                  success(docs);
                              });
                          }
                      }
                  });
              }
            }
        }, function (err) {
            error ('find() Cannot find form definitions ' + err);
        });
    };

    exps.delete = function(formparam, recid, parentfieldid, parentid, success, error ) {

        meta.getFormMeta(function(FORM_DATA) {
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


    exps.save = function (formparam, parentfieldid,parentid, userdoc, success, error) {

        meta.getFormMeta(function(FORM_DATA) {
            var form = meta.findFormById(FORM_DATA, formparam),
                isInsert = typeof userdoc._id === 'undefined',
                isEmbedded = (parentfieldid && parentid);

            if (!form) {
                error ("save() not Found : " + formparam);
            } else if (!isEmbedded && (parentfieldid || parentid)){
                error ("save() need to supply both 'parentfieldid' and 'parentid' for embedded document save : " + formparam);
            } else {

                console.log ('save() formparam:' + formparam + ' : got form lookup: ' + form.name);
                var coll = form.collection;
                var embedfield;

                //if (form.type == "childform") {
                if (isEmbedded) {
                    console.log ('save() Its a childform, get the collection & field from the parent parentfieldid : ' + parentfieldid);
                    var  parentmeta = meta.findFieldById(FORM_DATA, parentfieldid);

                    if (!parentmeta) {
                        error ('save() Cannot find parent form field for this childform: ' + parentfieldid);
                        return;
                    } else if (!(new ObjectID (form._id)).equals(parentmeta.field.child_form)) {
                        error ('save() childform cannot be saved to parent (check your schema child_form): ' + parentfieldid);
                        return;
                    } else {
                        coll = parentmeta.form.collection;
                        embedfield = parentmeta.field.name;
                        console.log ('save() collection : ' + coll + ', field : ' + embedfield);
                    }
                }

                var savedEmbedDoc; // set later, used by callback

                console.log('save() collection: '+coll+' userdoc: ' + JSON.stringify(userdoc));

                //callback gets two parameters - an error object (if an error occured) and the record if it was inserted or 1 if the record was updated.
                var callback = function (err, recs) {
                    if (err) error (err);
                    console.log('save() saved  : ' + JSON.stringify(recs) + ' doc : ' + JSON.stringify(userdoc));
                    if (recs == 1) { // updated
                        if (embedfield) { // embedded doc (insert or update)
                            success (savedEmbedDoc);
                        } else {
                            success ({_id: userdoc._id}); // updated top level
                        }
                    }
                };

                // build the field set based on metadata - NOT the passed in JSON!
                // 'allowchildform'  if its a INSERT of a TOP LEVEL form, allow a childform to be passed in (used by auth.js)
                var validateSetFields = function (formFields, dataval, embedField, allowchildform) {
                    var setval = {};
                    for (var f in formFields) {
                        var fname = formFields[f].name,
                            ftype = formFields[f].type;

                        if (ftype !== 'childform' || allowchildform) {
                            var verified_val = dataval[fname];
                            if (ftype === 'lookup' && verified_val)  verified_val = verified_val._id;

                            if (embedField) {
                                setval[embedfield+'.$.'+fname] = verified_val;
                            } else {
                              if (dataval.hasOwnProperty(fname)) {
                                setval[fname] = verified_val;
                              } else if (isInsert && ftype === 'childform') {
                                setval[fname] = [];
                              }
                            }
                        }
                    }
                    return setval;
                }

                if (!isEmbedded) {
                    //console.log('/db/'+coll+'  saving or updating a top-level document :' + userdoc._id);

                    if (!isInsert) {
                        //console.log('/db/'+coll+' got _id,  update doc, use individual fields : ' + userdoc._id);
                        try {
                          var query = {_id: new ObjectID(userdoc._id)};
                        } catch (e) {
                          error ("save() _id not acceptable format : " + userdoc._id);
                        }
                        var update = validateSetFields(form.fields, userdoc, null);
                        var update_set = { '$set': update };

                        console.log('save() '+coll+' update verified data : ' + JSON.stringify (update_set));
                        db.collection(coll).update (query, update_set,  function (err, out) {
                          console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                          if (err) {
                             error (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                          } else {
                            success ({_id: query._id});
                          }
                        });
                    } else {
                        //console.log('/db/'+coll+'  insert toplevel document, use individual fields');
                        var insert = validateSetFields(form.fields, userdoc, null, true);
                        insert._id = new ObjectID();
                        console.log('save() '+coll+' insert verified data : ' + JSON.stringify (insert));
                        db.collection(coll).insert (insert, function (err, out) {
                          console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                          if (err) {
                             error (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                          } else {
                            success ({_id: insert._id});
                          }
                        });
                    }

                } else {  // its modifing a embedded document

                      //console.log('/db/'+coll+'  set or push a embedded document :' + parentid);
                      try {
                        var query = {_id: new ObjectID(parentid)}, update;
                      } catch (e) {
                        error ("save() parentid not acceptable format : " + parentid);
                      }
                      /***** TRYING TO DO EMBEDDED ARRAY inside EMBEDDED ARRAY, BUT MONGO DOESNT SUPPORT NESTED POSITIONAL OPERATORS
                       var embedsplit = embedfield.split('.');
                       if (embedsplit.length == 2) {
                          query['"' + embedsplit[0] + '._id"'] = new ObjectID(parentid);
                      }  else {
                          query = {_id: new ObjectID(parentid)};
                      }
                       */
                      var validatedUpdates = validateSetFields(form.fields, userdoc, null);
                      if (isInsert) { // its $push'ing a new entry
                          savedEmbedDoc = { _id: new ObjectID() };

                          var pushjson = {};
                          pushjson[embedfield] =  validatedUpdates;
                          pushjson[embedfield]._id  = savedEmbedDoc._id;
                          // mongodb doesnt automatically provide a _Id for embedded docs!
                          update = {'$push': pushjson} ;
                      } else {
                        try {
                          savedEmbedDoc = { _id: new ObjectID(userdoc._id) };
                        } catch (e) {
                          error ("save() _id not acceptable format : " + userdoc._id);
                        }
                        //query[embedfield] = {'$elemMatch': { _id:  savedEmbedDoc._id}}
                        query[embedfield+"._id"] = savedEmbedDoc._id;
                        update = { '$set': validateSetFields(form.fields, userdoc, embedfield) };
                      }
                      console.log('save() update: query :' + JSON.stringify(query) +' update :' + JSON.stringify(update));
                      db.collection(coll).update(query, update, function (err, out) {
                        console.log ('save() res : ' + JSON.stringify(out) + ', err : ' + err);
                        if (err) {
                           error (err); // {'ok': #recs_proceses, 'n': #recs_inserted, 'nModified': #recs_updated}
                        } else {

                          // return full update sent to database (the client uses this for child forms)
                          validatedUpdates._id = savedEmbedDoc._id;
                          success (validatedUpdates);
                        }
                      });
                }
            }
        }, function (err) {
            error ('find() Cannot find form definitions ' + err);
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

        /*
        var gs = new GridStore(db, filename, 'r');
        console.log ('getfile() new GridStore');
        gs.open(function(err, gs){
            if (err) {
              console.log ('getfile() cannot open GridStore: ' + JSON.stringify(err));
              res.end();
            } else {

              // Strange - commented out code crashes
              //gs.on('close',function(){
              //  console.log ('getfile() finished');
              //});

              console.log ('getfile() open GridStore pipe to response');
              gs.stream([autoclose=true]).pipe(res);
            }
        });
        */
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

    exps.getmeta = function (success, error) {
        //	var formid = req.params["id"];
        //	res.send (FORM_DATA[formid]);
        meta.getFormMeta(function (docs) {
            success (docs);
        }, function (err) {
            error (err);
        });

    };
    return exps;
}
