"use strict"

var   express = require('express')
    , router = express.Router();
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

  var orm = require ("../libs/orm_mongo")(options);
  console.log ('setting up dform routes ');
  var db = options.db;

  var queryURLtoJSON = (urlquery) => {
    if (!urlquery)
      return;

    let jsonQuery = {};
    if (urlquery && urlquery.d)
      jsonQuery.d = urlquery.d;

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

//--------------------------------------------------------- FIND
  router.get('/db/:form', function(req, res) {
    let formparam = req.params["form"],
        query = queryURLtoJSON(req.query);
    if (query && query.error) {
      res.status(400).send(query.error);
    } else {
      let parent = null, findOne = query && query._id && !Array.isArray(query._id), ingorelookups = false;
      console.log (`/db/:form query <${findOne}>: ${JSON.stringify(query)}`);
      orm.find(formparam, parent, query, findOne, ingorelookups, req.session.context).then((j) => { res.json(j); }, (e) => {
        console.log ("find err : " + e);
        res.status(400).send(e);
      }).catch(function error(e) {
        console.log ("catch err : " + e);
        res.status(400).send(e);
      })
    }
  });

//--------------------------------------------------------- DELETE
  router.delete('/db/:form',  function(req, res) {
      let formparam = req.params["form"],
          query = queryURLtoJSON(req.query);

      if (query && query.error) {
        res.status(400).send(query.error);
      } else if (!req.user)
        res.status(400).send("Permission Denied");
      else {
        orm.delete (formparam, parentURLtoJSON(req.query.parent), query, req.session.context).then((j) => {
            res.json(j);
        }, (e) => {
            res.status(400).send(e);
        });
      }
  });

//--------------------------------------------------------- SAVE
  router.post('/db/:form',  function(req, res) {
  	var formparam = req.params["form"],
  	    userdoc = req.body;

    if (!req.user)
      res.status(400).send("Permission Denied");
    else {
      console.log (`-----  post: calling save with ${formparam} ${req.query.parent}`);
      orm.save (formparam, parentURLtoJSON(req.query.parent), userdoc, req.session.context).then((j) => {
        console.log ('save() : responding : ' + JSON.stringify(j));
        res.json(j);
      }, (e) => {
        console.log ("reject error : " + e);
        res.status(400).send(e);
      }).catch(function error(ce) {
        console.log ("catch err : " + ce);
        res.status(400).send(ce);
      });
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

    if (!req.user)
      res.status(400).send({error:"Permission Denied"});
    else {
      orm.putfile(req, res, filename);
    }
  });

  router.get('/filelist', function (req,res) {
    orm.listfiles( function success(j) {
        res.json(j);
    }, function error(e) {
        res.status(400).send(e);
    });
  });

  /* ------------------------------------- BOOT THE APP
   *
   */

  router.get('/loadApp', function(req, res) {
    let urlappid = req.query["appid"],
        appid = null,
        errfn = function (errval) {
          console.log ('/loadApp error: ' + errval);
          res.status(400).send(errval);
        };

    console.log (`----------------  /loadApp: [urlappid: ${urlappid}] [user: ${req.user && req.user.name || 'none'}]`);

    if (req.user) {

      if (req.user.role === "manager") req.user.apps.push({app: orm.adminApp});
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
      orm.find(orm.forms.App, null, { _id: appid}, true, true).then((apprec) => {
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
            orm.find(orm.forms.formMetadata, null, {_id: Array.from(userMetaids), d: 'all' }, false, true).then(userMeta => {
              let allMeta = systemMeta.concat (userMeta);
              req.session.context = {user: req.user, app: apprec,  appMeta: allMeta};
              res.json(req.session.context);
            });
          } else {
            req.session.context = {user: req.user, app: apprec,  appMeta: systemMeta};
            res.json(req.session.context);
          }
      }, errfn).catch((e) => {
        console.error ('/loadApp program error retrieving application for user', e);
        res.status(400).send(e);
      });
    }
  });

  return router;
};
