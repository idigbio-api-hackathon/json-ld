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

    // Start over with fresh data 
    db.collection('fungi').deleteMany();

    // Insert Data
    insertDocument(db, function() { 
        db.close();
    });
    
});

// Mongo Insert
var insertDocument = function(db, callback) {

    db.collection('fungi').insertMany([ 
        {idigbio_uuid : "db56a1f4-5227-444f-88f6-c1b45330d603", mycobank_id : "20001" },
        {idigbio_uuid : "77f2eeec-abf3-4dba-862a-b61ac5502a9d", mycobank_id : "19001" }
    ],
    {w:1, keepGoing:true},
    function(err, result) {
        assert.equal(err, null);
        console.log("Inserted documents into fungi collection");
        callback(result);
    });
};

// Mongo Find
findFungi = function(db, uuid, callback) {
    var cursor = db.collection('fungi').find({"idigbio_uuid": uuid});

    /*cursor.each(function(err, doc) {
        assert.equal(err, null);

        if(doc != null) { console.log('returning doc: ' + doc); return doc; }
        else { callback(); }
    });*/
};

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
