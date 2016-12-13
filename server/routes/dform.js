"use strict";

const   
  express = require('express'),
  router = express.Router(),
  jp = require("jsonpath"),
  xpath = require('xpath'),
  dom = require('xmldom').DOMParser,
  meta = require('../libs/orm_mongo_meta')
/*
    , formidable = require('formidable')     // handle multipart post stream (already in express)
    , Grid = require('gridfs-stream')  // write to mongo grid filesystem
  //  , fs = require('fs') // TESTING ONLY
    , mongo = require('mongodb')
    , GridStore = require('mongodb').GridStore
    , ObjectID = require('mongodb').ObjectID;
*/
/*
 * Express Routes
 */
// node variables are file scoped, not block scoped like java (declaring a variable in a loop block makes it avaiable for the whole file
// to scope to a function, create a anonoumous function (function(){ ... })()


module.exports = function(options) {

  var orm = require ("../libs/orm_mongo")(options),
      orm_ams = require ("../libs/orm_ams")

  console.log ('setting up dform routes ')
  var db = options.db

  var queryURLtoJSON = (urlquery) => {
    if (!urlquery)
      return;

    let jsonQuery = {};
    if (urlquery.d) {
      if (urlquery.d.match(/^(primary|list|all|all_no_system)$/)) {
        jsonQuery.display = urlquery.d
      } else  {
        return jsonQuery = {error: `no valid display option provided (primary|list|all|all_no_system)`}
      }
    }

    if (urlquery._id)
      jsonQuery._id = urlquery._id.indexOf(",") > -1 && urlquery._id.split(",") || urlquery._id;
    else if (urlquery.p)
      jsonQuery.p = urlquery.p;
    else if (urlquery.q) try {
      jsonQuery.q = JSON.parse(urlquery.q);
    } catch (e) {
      jsonQuery = {error: `cannot parse request : ${urlquery.q}`};
    }
    return jsonQuery;
  }

  var idparams2meta = (form_id, parent, context) => {

    if (!context) context = {appMeta: meta.FORMMETA}

    if (!form_id) {
      return {error: `no form parameter provided`}
    } else {
      let form = context.appMeta.find((d) =>  String(d._id) === String (form_id))
      if (!form) {
        return {error: `Form definition not found :${form_id}`}
      } else {
        let ret = {form: form, store: form.store}
        if (!parent) {
          if (form.store === "fromparent") {
            return {error: `Childform, but no parent information supplied :${form.name}`}
          } else {
            return ret
          }
        } else {
          if (form.store !== "fromparent") {
            return {error: `Not a childform, but parent information supplied :${form.name}`}
          } else {
            try {
              let p = JSON.parse(parent);
              if (!p.record_id || !p.form_id || !p.field_id) {
                return {error: `cannot parse parent, missing [record_id|form_id|field_id] : ${parent}`};
              }
              let pform = context.appMeta.find((d) =>  String(d._id) === String (p.form_id))
              if (!pform) {
                return {error: `Parent form definition not found :${p.form_id}`}
              } else {
                let pform_fld = pform.fields.find((d) =>  String(d._id) === String (p.field_id))
                if (!pform_fld) {
                  return {error: `Parent field definition not found :${p.field_id}`}
                } else {

                  if (!(pform_fld.child_form && pform_fld.child_form._id === form._id)) {
                    return {error: `childform not assosiated to parent (check your schema child_form): ${pform_fld.name}`}
                  } else {
                    ret.store = pform.store
                    ret.parent = {form: pform, field: pform_fld, query: {_id: p.record_id}}
                    return ret
                  }
                }
              }
            } catch (e) {
              return {error: `Cannot parse parent : ${parent}`}
            }
          }
        }
      }
    }
  }

 /*
    $.content[0].m:properties[0].d:Id[0]
    $.content[0].m:properties[0].d:Name[0]
    $.content[0].m:properties[0].d:Uri[0]
    $.content[0].m:properties[0].d:StorageAccountName[0]

    /xmlns:feed/xmlns:entry

    string(./xmlns:content/m:properties/d:Id)
    string(./xmlns:id)
    string(./xmlns:content/m:properties/d:Name)
    string(./xmlns:content/m:properties/d:Uri)
*/
  var validate_store_xml_result = (form, store_data, single) => {
    //console.log (`validate_store_result:  ${store_data}`)
    let doc = new dom().parseFromString(store_data),
        select = xpath.useNamespaces({ 'xmlns': 'http://www.w3.org/2005/Atom', d: "http://schemas.microsoft.com/ado/2007/08/dataservices", m: "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" }),
        entries = single ? select("/xmlns:entry", doc) : select("/xmlns:feed/xmlns:entry", doc)

    let res = []
    for (let row of entries) {
      let r = {_id: select(form.externalid, row)}
      for (let fld of form.fields) {
        r[fld.name] = select(fld.source, row)
      }
      res.push(r)
    }
    return single ? res[0] : res
  }

  var returnJsonError = (res, strerr) => {
    console.log ("returnJsonError : " + strerr)
    return res.status(400).send({error: strerr})
  }

   var validate_store_json_result = (form, store_data, single, context) => {
    console.log (`validate_store_json_result: [${form.name}]: ${JSON.stringify(store_data)}`)
    let entries = single ? [store_data] : store_data.value

    let res = entries.map((row,i) => {
      let r = {_id: row.Id}
      if (row._saslocator) r._saslocator = row._saslocator

      for (let fld of form.fields) {
        if (fld.type === 'childform' && row[fld.name]) {
          let childform = fld.child_form && context.appMeta.find((d) => String(d._id) === String (fld.child_form._id));
          r[fld.name] = validate_store_json_result (childform, row[fld.name], false, context)
        } else {
          r[fld.name] = row[fld.name] == null ? null : row[fld.name].toString()
        }
      }
      return r
    })
    return single ? res[0] : res
  }

  var returnJsonError = (res, strerr) => {
    console.log ("returnJsonError : " + strerr)
    return res.status(400).send({error: strerr})
  }

//--------------------------------------------------------- FIND
  router.get('/db/:form', function(req, res) {
    let formparam = req.params["form"],
        query = queryURLtoJSON(req.query),
        formdef = idparams2meta (formparam, null, req.session.context)

    if (formdef.error) {
      return returnJsonError(res, `Form definition not found :${formdef.error}`)
    } else if (query && query.error) {
        return returnJsonError(res, query.error)
    } else if (formdef.store === "metadata") {
      return returnJsonError(res, `Form definition is metadata, find on client :${formparam}`)
    } else if (formdef.store === "mongo") {
      // TODO - implement a mongo childform find
      let parent = null;
      console.log (`/db/:form query : ${JSON.stringify(query)}`);
      orm.find(formdef, query, req.session.context).then((j) => { 
        res.json(j); 
      }, (e) => {
        return returnJsonError(res, e)
      }).catch((e)=> {
        return returnJsonError(res, e)
      })

    } else if (formdef.store === "ams_api") {

      orm_ams.find (formdef, query, req.session.context).then((j) => {
        res.json(validate_store_json_result (formdef.form, j, (query && query._id), req.session.context)); 
      }, (e) => {
        return returnJsonError(res, e)
      }).catch((e)=> {
        return returnJsonError(res, e)
      })
    } else {
      return returnJsonError(res, `unsupported form store ${formdef.store}`)
    }
  })

//--------------------------------------------------------- SAVE
  router.post('/db/:form',  function(req, res) {
    var formparam = req.params["form"],
        userdoc = req.body,
        formdef = idparams2meta (formparam, req.query.parent, req.session.context)

    if (!req.user)
      return returnJsonError(res, `Permission Denied`);
    else {
      console.log (`-----  post: calling save with ${formparam} ${req.query.parent}`);
      if (formdef.error) {
        return returnJsonError(res, `Form definition not found :${formdef.error}`)
      } else if (formdef.store === "mongo" || formdef.store === "metadata") {  
        orm.save (formdef, userdoc, req.session.context).then((j) => {
          console.log ('save() : responding : ' + JSON.stringify(j));
          return res.json(j);
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e) => {
          return returnJsonError(res, e)
        })
      } else if (formdef.store === "ams_api") {
        orm_ams.save (formdef, userdoc, req.session.context).then((j) => {
          res.json(validate_store_json_result (formdef.form, j, true, req.session.context))
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e) => {
          return returnJsonError(res, e)
        })
      } else {
      return returnJsonError(res, `unsupported form store ${formdef.store}`)
      }
    }
  });

//--------------------------------------------------------- DELETE
  router.delete('/db/:form',  function(req, res) {
    let formparam = req.params["form"],
        query = queryURLtoJSON(req.query),
        formdef = idparams2meta(formparam, req.query.parent, req.session.context)

     if (!req.user) {
      return returnJsonError(res, `Permission Denied`)
     } else {

      if (formdef.error) {
        return returnJsonError(res, `Form definition not found :${formdef.error}`)
      } else if (query && query.error) {
          return returnJsonError(res, query.error)
      } else if (formdef.store === "metadata") {
        return returnJsonError(res, `Form definition is metadata, delete on client :${formparam}`)
      } else if (formdef.store === "mongo") {

        orm.delete (formdef, query, req.session.context).then((j) => {
          return res.json(j);
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e) => {
          return returnJsonError(res, e)
        })
      } else if (formdef.store === "ams_api") {

        orm_ams.delete (formdef, query, req.session.context).then((j) => {
            res.json({'deleted': true})
          }, (e) => {
            return returnJsonError(res, e)
          }).catch((e) => {
            return returnJsonError(res, e)
          })
      } else {
        return returnJsonError(res, `unsupported form store ${formdef.store}`)
      }
    }
  });



  /* ------------------------------------- FILE HANDLING
   *
   */

  /* UNIX COMMAND
   mongofiles -d myapp_dev list
   mongofiles -d myapp_dev get profile-pic511a7c150c62fde30f000003
   */
  router.get('/file/:filename', function (req,res) {
      var filename = req.params["filename"];
      orm.getfile (filename, res);
  });

  // upload file into mongo, with help from formidable
  router.put ('/file/:filename', function(req,res) {
    var filename = req.params["filename"];
    console.log (`----------------  /file/${filename}:  user: ${JSON.stringify(req.user)}`);

    if (!req.user) {
      return returnJsonError(res,  "Permission Denied")
    } else {
      orm.putfile(req, res, filename)
    }
  });

  router.get('/filelist', function (req,res) {
    orm.listfiles( function success(j) {
      res.json(j);
    }, (e) => {
      return returnJsonError(res,  e)
    });
  });

  /* ------------------------------------- BOOT THE APP
   *
   */

  router.get('/loadApp', function(req, res) {
    let urlappid = req.query["appid"],
        appid = null

    console.log (`/loadApp: [requested urlappid: ${urlappid}] [user: ${req.user && req.user.name || 'none'}]`);

    if (req.user) {
      console.log (`/loadApp: logged in user ${req.user.name}`)
      if (req.user.role === "admin") {
        console.log (`/loadApp: user is a admin, add the AdinApp to their apps list`)
        req.user.apps.push({app: meta.AdminApp});
      }
      let userapps = req.user.apps  || [];
      if (urlappid) {
        console.log (`/loadApp: specific app requested, find it`)
        let app = userapps.find(ua => ua.app._id == urlappid);
        appid = app && app.app._id || userapps[0] && userapps[0].app._id;
      }  else {
        console.log (`/loadApp: no app requested, so get the default app, if no default, get admin app`)
        let app = userapps.find(ua => ua.app && ua.app.default === "yes");
        appid = app && app.app._id || null;
      }
    } else {
      // not logged on, get the default app, unless requested.
      if (urlappid)
        // app requested, so provide it.
        appid = urlappid;
    }

    let systemMetabyId = {}
    for (let v of meta.FORMMETA) {
      systemMetabyId[v._id.toString()] = v;
    }


    if (!appid || appid == meta.AdminApp._id) {
      // no user, no appid, return the admin app!
      req.session.context = {
        user: req.user,
        app: meta.AdminApp,
        appMeta: meta.AdminApp.appperms.map(ap => { return systemMetabyId[ap.form._id.toString()]})
      };
      res.json(req.session.context);
    } else {
      console.log ("/formdata: user logged on and authorised for the apps : " + appid);
      orm.find(idparams2meta(meta.Forms.App), { _id: appid}).then((apprec) => {
          let systemMeta = [], userMetaids = new Set();
          if (apprec && apprec.appperms) for (let perm of apprec.appperms) {
            console.log (`/formdata: adding form app [${perm.name}]: ${JSON.stringify(perm.form._id)}`);
            if (perm.form) {
              let sysmeta = systemMetabyId[String(perm.form._id)];
              if (sysmeta === undefined) {
                userMetaids.add(perm.form._id); //.add[perm.form];
              } else {
                systemMeta.push(sysmeta);
              }
            }
            //perm.crud
          }

          systemMeta.push(systemMetabyId[String(meta.Forms.FileMeta)]); // apps that need to work with files
          systemMeta.push(systemMetabyId[String(meta.Forms.iconSearch)]); // apps that need to work with icons
          systemMeta.push(systemMetabyId[String(meta.Forms.Users)]); // apps that need to work with users
          systemMeta.push(systemMetabyId[String(meta.Forms.App)]); // apps that need to work with users app-specific dynamic fields
          systemMeta.push(systemMetabyId[String(meta.Forms.ComponentMetadata)]); // needed for the router props

          console.log (`/formdata: getFormMeta ${userMetaids.size}`);

          if (userMetaids.size >0) {
            orm.find(idparams2meta(meta.Forms.formMetadata), {_id: Array.from(userMetaids)}).then(userMeta => {
              let allMeta = systemMeta.concat (userMeta);
              req.session.context = {user: req.user, app: apprec,  appMeta: allMeta};
              res.json(req.session.context);
            });
          } else {
            req.session.context = {user: req.user, app: apprec,  appMeta: systemMeta};
            res.json(req.session.context);
          }
      }, (e) => {
        return returnJsonError(res, e)
      }).catch((e) => {
        return returnJsonError(res, e)
      })
    }
  })
  return router
};
