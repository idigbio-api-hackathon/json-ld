var jsonld      = require('jsonld'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID    = require('mongodb').ObjectID,
    assert      = require('assert'),
    express     = require('express'),
    config      = require('./config/config'),
    path        = require('path');

// TODO: Move mongo out of here??

// MongoDB Connection
MongoClient.connect(config.mongo_url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to Mongo server.");
});

var app = express();
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

require('./config/routes')(app, config);

var server;
server = app.listen(config.port, function() {
    console.log('Express server listening on port ' + server.address().port);
});

module.exports = {
    app: app,
    server: server,
    config: config,
    MongoClient: MongoClient
}
