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
        var formparam = req.params["form"],
            q = JSON.parse((req.query.q || '{}').replace(/<DOLLAR>/g, '$')); // replace required because angular $resource.query doesnt encode '$'
        orm.find(formparam, q, function success(j) {
            res.json(j);
        }, function error(e) {
            res.status(400).send(e);
        });
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

    router.get('/formdata', function(req, res) {
      res.setHeader('Content-Type', 'application/json');
      orm.getmeta (function success(j) {
            // filter formmeta based on user

            res.json({formdata: j, user: req.user});
        }, function error(e) {
            res.status(400).send(e);
        });
    });

    return router;
};
