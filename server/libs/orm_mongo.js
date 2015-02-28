/**
 * Created by keith on 17/10/14.
 */
var   express = require('express')
    , router = express.Router()
    , formidable = require('formidable')     // handle multipart post stream (already in express)
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
        console.log ('orm_mongo:find formparam ' + formparam + ' q ' + JSON.stringify (q));
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
                        console.log('findlookupfields: found a lookup field on ' + form.name + ' field ' + field.name);
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
                            error('Cannot find form definitions ' + field.child_form);
                            return;
                        } else {
                            console.log('findlookupfields: found a childfield, recurse onit! name :' + field.child_form + ' : ' + childform.name);
                            findlookupfields(FORM_DATA, childform, field.name);
                        }
                    }
                }
            }
        };

        /* Harvest lookup ids from primary document for foriegn key lookup */
        var collectforignids = function (docs) {
            var lookupkeys = {};
            for (var didx in docs) {
                var doc = docs[didx];
                for (var saidx in subqarray) {
                    var subq_obj = subqarray[saidx];
                    if (! lookupkeys[subq_obj.collection])  lookupkeys[subq_obj.collection] = [];
                    if (subq_obj.subdocfield) {
                        for (var edidx in doc[subq_obj.subdocfield]) {
                            console.log ('adding ' + JSON.stringify(doc[subq_obj.subdocfield]) + ' : ' + edidx + ' : ' + subq_obj.field);
                            if (doc[subq_obj.subdocfield][edidx][subq_obj.field])
                                lookupkeys[subq_obj.collection].push(new ObjectID(doc[subq_obj.subdocfield][edidx][subq_obj.field]));
                        }
                    } else {
                        if (doc[subq_obj.field])
                            lookupkeys[subq_obj.collection].push(new ObjectID(doc[subq_obj.field]));
                    }
                }
            }
            // Map<collection, List<ids>.
            return lookupkeys;
        }

        /* run subquery */
        var subq_res = {};
        var runsubquery = function (scoll, objids, callwhendone, success, error) {
            var q = { _id: { $in: objids }};
            var flds = { name: 1 };
            console.log('/db runsubquery find  ' + scoll + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(flds));

            db.collection(scoll).find(q, flds, function(err, resultCursor) {
                if (err) {
                    error(err);
                    callwhendone();
                }
                var fnProcessItem = function (err, item) {
                    console.log ('got ' + JSON.stringify(item));
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
                            alldonefn(docs);
                        }
                    });
                }
            }
        }


        meta.getFormMeta(function(FORM_DATA) {
            console.log('looking for fields in form : ' + formparam);
            form = meta.findFormById(FORM_DATA, formparam);

            console.log('looking for lookup fields in ' + form.name);
            findlookupfields(FORM_DATA, form);
            console.log('need to do additional queries to resolve lookups? ' + JSON.stringify(subqarray));


            // its find one!  TIMEBOM??
            if ("_id" in q || "provider.provider_id"  in q) {
                console.log('findOne for ' + form.collection + ' id: ' + JSON.stringify(q));
                if ("_id" in q)  q._id = new ObjectID(q._id);
                db.collection(form.collection).findOne(q, function (err, doc) {
                    if (err ) {
                        error (err);
                    } else {
                        console.log('got document ' + JSON.stringify(doc));

                        if (ignoreLookups) {
                            success({ documents: [doc]});
                        } else {
                            var lookupkeys = collectforignids([doc]);
                            console.log('got query for foriegn key lookup ' + JSON.stringify(lookupkeys));

                            runallsubqueries(lookupkeys, [doc], function (docs) {
                                success({ documents: docs, subq: subq_res});
                            });
                        }
                    }
                });

            } else {
                console.log('/db find ' + form.collection + ' : query : ' + JSON.stringify(q) + ' :  fields : ' + JSON.stringify(fields));
                db.collection(form.collection).find(q, fields, {}).toArray(function (err, docs) {
                    if (err) {
                        console.log('/db find ERROR :  ' + err);
                        error (err);
                    } else {

                        console.log('got documents ' + JSON.stringify(docs));

                        if (ignoreLookups) {
                            success({ documents: docs});
                        } else {
                            var lookupkeys = collectforignids(docs);
                            console.log('got query for foriegn key lookup ' + JSON.stringify(lookupkeys));

                            runallsubqueries(lookupkeys, docs, function (docs) {
                                success({ documents: docs, subq: subq_res});
                            });
                        }
                    }
                });
            }
        }, function (err) {
            error ('Cannot find form definitions ' + err);
        });
    };

    exps.delete = function(formparam, recid, parentfieldid, parentid, success, error ) {

        meta.getFormMeta(function(FORM_DATA) {
            form = meta.findFormById(FORM_DATA, formparam);

            if (!form) {
                error ("Not Found : " + formparam);
            } else {

                var coll = form.collection;
                var embedfield;

                if (form.type == "childform") {
                    console.log('Its a childform, get the collection & field from the parent form : ' + parentfieldid);
                    var parentmeta = meta.findFieldById(FORM_DATA, parentfieldid);

                    if (!parentmeta) {
                        error ('Cannot find parent form field for this childform: ' + parentfieldid);
                    } else if (!(new ObjectID(form._id)).equals(parentmeta.field.child_form)) {
                        error ('childform cannot be saved to parent (check your schema child_form): ' + parentfieldid);
                    } else {
                        coll = parentmeta.form.collection;
                        embedfield = parentmeta.field.name;
                        console.log('collection : ' + coll + ', field : ' + embedfield);
                    }
                }

                //callback gets two parameters - an error object (if an error occured) and the record if it was inserted or 1 if the record was updated.
                var callback = function (err, recs) {
                    if (err) error (err);
                    console.log('saved  : ' + recs + ' doc : ' + recid);
                    if (recs == 1) { // updated
                        success({_id: recid}); // updated top level
                    } else {
                        success(recs[0]); // inserted (has to be top level)
                    }
                };

                if (parentid) {
                  var query = {_id: new ObjectID(parentid)};
                  var update = { $pull: {} }
                  update["$pull"][embedfield] = { _id: new ObjectID(recid) };

                  console.log('/db/' + coll + ' query :' + JSON.stringify(query) + ' update :' + JSON.stringify(update));
                  db.collection(coll).update(query, update, callback);
                } else {
                  db.collection(coll).remove({_id: new ObjectID(recid)}, callback);
                }
            }
        }, function (err) {
            error ('Cannot find form definitions ' + err);
        });
    };


    exps.save = function (formparam, parentfieldid,parentid, userdoc, success, error) {

        meta.getFormMeta(function(FORM_DATA) {
            form = meta.findFormById(FORM_DATA, formparam);

            if (!form) {
                error ("Not Found : " + formparam);
            } else {

                console.log ('post:/db/' + formparam + ' : got form : ' + form.name);
                var coll = form.collection;
                var embedfield;

                if (form.type == "childform") {
                    console.log ('Its a childform, get the collection & field from the parent parentfieldid : ' + parentfieldid);
                    var  parentmeta = meta.findFieldById(FORM_DATA, parentfieldid);

                    if (!parentmeta) {
                        error ('Cannot find parent form field for this childform: ' + parentfieldid);
                        return;
                    } else if (!(new ObjectID (form._id)).equals(parentmeta.field.child_form)) {
                        error ('childform cannot be saved to parent (check your schema child_form): ' + parentfieldid);
                        return;
                    } else {
                        coll = parentmeta.form.collection;
                        embedfield = parentmeta.field.name;
                        console.log ('collection : ' + coll + ', field : ' + embedfield);
                    }
                }

                var savedEmbedDoc; // set later, used by callback

                console.log('/db/'+coll+' userdoc: ' + JSON.stringify(userdoc));

                //callback gets two parameters - an error object (if an error occured) and the record if it was inserted or 1 if the record was updated.
                var callback = function (err, recs) {
                    if (err) error (err);
                    console.log('saved  : ' + recs + ' doc : ' + JSON.stringify(userdoc));
                    if (recs == 1) { // updated
                        if (embedfield) { // embedded doc (insert or update)
                            success (savedEmbedDoc);
                        } else {
                            success ({_id: userdoc._id}); // updated top level
                        }
                    } else {
                        success ( recs[0]); // inserted (has to be top level)
                    }
                };

                // build the field set based on metadata - NOT the passed in JSON!
                // 'allowchildform'  if its a INSERT of a TOP LEVEL form, allow a childform to be passed in (used by auth.js)
                var validateSetFields = function (formFields, dataval, embedField, allowchildform) {
                    var setval = {};
                    for (var f in formFields) {
                        if (formFields[f].type !== 'childform' || allowchildform) {
                            var fname = formFields[f].name;
                            if (embedField) {
                                setval[embedfield+'.$.'+fname] = dataval[fname];
                            } else {
                                if (dataval.hasOwnProperty(fname)) {
                                  setval[fname] = dataval[fname];
                                }
                            }
                        }
                    }
                    return setval;
                }

                if (!embedfield) {
                    //console.log('/db/'+coll+'  saving or updating a top-level document :' + userdoc._id);

                    if (typeof userdoc._id !== 'undefined') {
                        //console.log('/db/'+coll+' got _id,  update doc, use individual fields : ' + userdoc._id);

                        var query = {_id: new ObjectID(userdoc._id)}
                        var update = { '$set': validateSetFields(form.fields, userdoc, null) };

                        //console.log('/db/'+coll+'  update verified data : ' + JSON.stringify (update));
                        db.collection(coll).update (query, update, callback);
                    } else {
                        //console.log('/db/'+coll+'  insert toplevel document, use individual fields');
                        var insert = validateSetFields(form.fields, userdoc, null, true);
                        //console.log('/db/'+coll+'  insert verified data : ' + JSON.stringify (insert));
                        db.collection(coll).insert (insert, callback);
                    }

                } else {  // its modifing a embedded document
                    if (!parentid)  {
                        error ("No Id Specified");
                    } else {
                        //console.log('/db/'+coll+'  set or push a embedded document :' + parentid);

                        var query = {_id: new ObjectID(parentid)}, update;

                        /***** TRYING TO DO EMBEDDED ARRAY inside EMBEDDED ARRAY, BUT MONGO DOESNT SUPPORT NESTED POSITIONAL OPERATORS
                         var embedsplit = embedfield.split('.');
                         if (embedsplit.length == 2) {
                            query['"' + embedsplit[0] + '._id"'] = new ObjectID(parentid);
                        }  else {
                            query = {_id: new ObjectID(parentid)};
                        }
                         */
                        if (!userdoc._id) { // its $push'ing a new entry
                            savedEmbedDoc = { _id: new ObjectID() };

                            var pushjson = {};
                            pushjson[embedfield] =  validateSetFields(form.fields, userdoc, null);
                            pushjson[embedfield]._id  = savedEmbedDoc._id;
                            // mongodb doesnt automatically provide a _Id for embedded docs!
                            update = {'$push': pushjson} ;
                        } else {
                            savedEmbedDoc = { _id: new ObjectID(userdoc._id) };
                            query[embedfield] = {'$elemMatch': { _id:  savedEmbedDoc._id}}
                            update = { '$set': validateSetFields(form.fields, userdoc, embedfield) };
                        }
                        //console.log('/db/'+coll+' query :' + JSON.stringify(query) +' update :' + JSON.stringify(update));
                        db.collection(coll).update(query, update, callback);
                    }
                }
            }
        }, function (err) {
            error ('Cannot find form definitions ' + err);
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
        var gs = new GridStore(db, filename, 'r');
        gs.open(function(err, gs){

            gs.on('close',function(){
              console.log ('getfile() finished');
            });

            if (err) {
              console.log ('getfile() cannot open GridStore: ' + JSON.stringify(err));
              res.end();
            } else {
              console.log ('getfile() open GridStore pipe to response');
              gs.stream([autoclose=false]).pipe(res);
            }
        });

    };

    exps.putfile = function (req, res) {
      var filename = 'profile-pic'+new ObjectID (),
          gfs = Grid(db, mongo);

      req.pipe(gfs.createWriteStream({
          filename: filename
      }));
      res.send(filename);
    };

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
