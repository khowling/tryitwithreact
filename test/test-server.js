var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server/app');
var should = chai.should();

chai.use(chaiHttp);


describe('MyApp', function() {
  it('should wait until db is ready');
  it('should refreive my app on /loadApp GET');
});


it('should wait until db is ready', function(done) {
  chai.request(server)
    .get('/dbready')
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.have.property('gotdb');
      done();
    });
});

it('should refreive my app on /loadApp GET', function(done) {
  chai.request(server)
    .get('/dform/loadApp')
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      //res.body.should.have.property('user');
      res.body.should.have.property('app');
      res.body.should.have.property('appMeta');
      done();
    });
});
