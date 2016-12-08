"use strict";

const   
  express = require('express'),
  router = express.Router(),
  jp = require("jsonpath"),
  xpath = require('xpath'),
  dom = require('xmldom').DOMParser
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

  var parentURLtoJSON = (parent) => {
    if (!parent)
      return;
    else try {
      let p = JSON.parse(parent);
      if (p.record_id) p.query = {_id: p.record_id};
      return p;
    } catch (e) {
      return {error: `cannot parse parent : ${parent}`};
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
  var validate_store_result = (form, store_data, single) => {
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

//--------------------------------------------------------- FIND
  router.get('/db/:form', function(req, res) {
    let formparam = req.params["form"],
        query = queryURLtoJSON(req.query);

    let form = req.session.context.appMeta.find((d) =>  String(d._id) === String (formparam))
    
    if (!form) {
      return returnJsonError(res, `Form definition not found :${formparam}`)
    } else if (form.store === "metadata") {
      return returnJsonError(res, `Form definition is metadata, find on client :${formparam}`)
    } else if (form.store === "mongo") {
      if (query && query.error) {
        return returnJsonError(res, query.error)
      } else {
        let parent = null;
        console.log (`/db/:form query : ${JSON.stringify(query)}`);
        orm.find(formparam, parentURLtoJSON(req.query.parent), query, req.session.context).then((j) => { 
          res.json(j); 
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e)=> {
          return returnJsonError(res, e)
        })
      }
    } else if (form.store === "ams_api") {
      orm_ams.find (form.collection, query, req.session.context).then((j) => {
        res.json(validate_store_result (form, j, (query && query._id))); 
      }, (e) => {
        return returnJsonError(res, e)
      }).catch((e)=> {
        return returnJsonError(res, e)
      })
    } else {
      return returnJsonError(res, `unsupported form store ${form.store}`)
    }
  })

//--------------------------------------------------------- SAVE
  router.post('/db/:form',  function(req, res) {
    var formparam = req.params["form"],
        userdoc = req.body

    if (!req.user)
      return returnJsonError(res, `Permission Denied`);
    else {
      let form = req.session.context.appMeta.find((d) =>  String(d._id) === String (formparam))
      console.log (`-----  post: calling save with ${formparam} ${req.query.parent}`);
      if (!form) {
        return returnJsonError(res, `Form definition not found :${formparam}`)
      } else if (form.store === "mongo" || form.store === "metadata" || form.store === "fromparent") {  
        orm.save (formparam, parentURLtoJSON(req.query.parent), userdoc, req.session.context).then((j) => {
          console.log ('save() : responding : ' + JSON.stringify(j));
          return res.json(j);
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e) => {
          return returnJsonError(res, e)
        })
      } else if (form.store === "ams_api") {
        orm_ams.save (form.collection, parentURLtoJSON(req.query.parent), userdoc, req.session.context).then((j) => {
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e) => {
          return returnJsonError(res, e)
        })
      } else {
      return returnJsonError(res, `unsupported form store ${form.store}`)
      }
    }
  });

//--------------------------------------------------------- DELETE
  router.delete('/db/:form',  function(req, res) {
      let formparam = req.params["form"],
          query = queryURLtoJSON(req.query);

      if (query && query.error) {
        return returnJsonError(res, query.error)
      } else if (!req.user)
        return returnJsonError(res, 'Permission Denied');
      else {
        orm.delete (formparam, parentURLtoJSON(req.query.parent), query, req.session.context).then((j) => {
          return res.json(j);
        }, (e) => {
          return returnJsonError(res, e)
        }).catch((e) => {
          return returnJsonError(res, e)
        })
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

    console.log (`----------------  /loadApp: [urlappid: ${urlappid}] [user: ${req.user && req.user.name || 'none'}]`);

    if (req.user) {

      if (req.user.role === "admin") req.user.apps.push({app: orm.adminApp});
      let userapps = req.user.apps  || [];
      if (urlappid) {
        // app requested, so provide it.
        let app = userapps.find(ua => ua.app._id == urlappid);
        appid = app && app.app._id || userapps[0] && userapps[0].app._id;
      }  else {
        // no app requested, so get the default  app, if no default, get admin app
        let app = userapps.find(ua => ua.app.default == "yes");
        appid = app && app.app._id || null;
      }
    } else {
      // not logged on, get the default app, unless requested.
      if (urlappid)
        // app requested, so provide it.
        appid = urlappid;
    }

    let systemMetabyId = orm.systemMetabyId();
    if (!appid || appid == orm.adminApp._id) {
      // no user, no appid, return the admin app!
      req.session.context = {
        user: req.user,
        app: orm.adminApp,
        appMeta: orm.adminApp.appperms.map(ap => { return systemMetabyId[ap.form._id.toString()]})
      };
      res.json(req.session.context);
    } else {
      console.log ("/formdata: user logged on and authorised for the apps : " + appid);
      orm.find(orm.forms.App, null, { _id: appid}).then((apprec) => {
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

          systemMeta.push(systemMetabyId[String(orm.forms.FileMeta)]); // apps that need to work with files
          systemMeta.push(systemMetabyId[String(orm.forms.iconSearch)]); // apps that need to work with icons
          systemMeta.push(systemMetabyId[String(orm.forms.Users)]); // apps that need to work with users
          systemMeta.push(systemMetabyId[String(orm.forms.App)]); // apps that need to work with users app-specific dynamic fields
          systemMeta.push(systemMetabyId[String(orm.forms.ComponentMetadata)]); // needed for the router props

          console.log (`/formdata: getFormMeta ${userMetaids.size}`);

          if (userMetaids.size >0) {
            orm.find(orm.forms.formMetadata, null, {_id: Array.from(userMetaids)}).then(userMeta => {
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
