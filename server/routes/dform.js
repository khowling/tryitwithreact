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


    router.get('/db/:form', function(req, res) {
        console.log ("/db/:form: : " +  JSON.stringify(req.query));
        let formparam = req.params["form"],
            query;

        if (req.query) {
          if (req.query.id) {
            query =  {id: req.query.id.indexOf(",") > -1 && req.query.id.split(",") || req.query.id};
          } else if (req.query.p)
            query =  {p: req.query.p};
          else if (req.query.q)
            query =  {q: JSON.parse(req.query.q)};
        }
        console.log ("/db/:form query: " + JSON.stringify(query));
        orm.find(formparam, query, (query && query.id && !Array.isArray(query.id))).then(function success(j) {
            res.json(j);
        }, function error(e) {
          console.log ("find err : " + e);
          res.status(400).send(e);
        }).catch(function error(e) {
          console.log ("catch err : " + e);
          res.status(400).send(e);
        })
    });


    router.delete('/db/:form/:id',  function(req, res) {
        var formparam = req.params["form"],
            recid = req.params["id"],
            parentfieldid = req.query.parentfieldid,
            parentid = req.query.parentid;

        orm.delete (formparam, recid, parentfieldid, parentid, function success(j) {
            res.json(j);
        }, function error(e) {
            res.status(400).send(e);
        });
    });


    router.post('/db/:form',  function(req, res) {
    	var formparam = req.params["form"],
            parentfieldid = req.query.parentfieldid,
    	    parentid = req.query.parentid,
    		//userdoc = JSON.parse(JSON.stringify(req.body).replace(/<DOLLAR>/g,'$'));
    	    userdoc = req.body;
      orm.save (formparam, parentfieldid,parentid, userdoc).then(function success(j) {
        console.log ('save() : responding : ' + JSON.stringify(j));
        res.json(j);
      }, function error(e) {
        res.status(400).send(e);
      });
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
    router.put ('/file/:filename'
         //, ensureAuthenticated
        , function(req,res) {
            var filename = req.params["filename"];
            orm.putfile(req, res, filename);
        });

    router.get('/filelist', function (req,res) {
      orm.listfiles( function success(j) {
          res.json(j);
      }, function error(e) {
          res.status(400).send(e);
      });
    });

    router.get('/loadApp', function(req, res) {
      let urlappid = req.query["appid"],
          app = null,
          errfn = function (errval) {
                res.status(400).send(errval);
            };

      console.log ("/formdata: starting, requested app:  urlappid=" + urlappid);

      if (req.user) {
        let userapps = req.user.apps  || [];
        if (urlappid)
          app = userapps.find(ua => ua.app._id == urlappid).app;
        else
          app = userapps[0] && userapps[0].app;
      } else {
        // not logged on
      }
      //res.setHeader('Content-Type', 'application/json');
      if (app) {
        console.log ("/formdata: user logged on and authorised for the apps : " + app.name);
        orm.find(orm.forms.App, { id: app._id}, true, true).then((apprec) => {
            let objectids = [];
            if (apprec && apprec.appperms) for (let perm of apprec.appperms) {
              console.log ("/formdata: adding form app ["+apprec.name+"]: " + perm.form);
              objectids.push(perm.form); //.add[perm.form];
              //perm.crud
            }
            orm.getFormMeta(objectids).then (function (sucval) {
              res.json({user: req.user, app: apprec, appMeta: sucval});
            }, errfn).catch(errfn);
        }, errfn)
      } else {
        orm.getFormMeta([]).then (function (sucval) {
          res.json({user: req.user, appMeta: sucval});
        }, errfn).catch(errfn);
      }

    });

  router.get('/defaultData', function(req, res) {
    let id = req.query._id;
    if (id) {
      let d = {};
      for (let x of orm.defaultData) {
        if (x._id === id) { d = x; break; }
      }
      res.json(d);
    }  else
      res.json(orm.defaultData);
  });

    return router;
};
