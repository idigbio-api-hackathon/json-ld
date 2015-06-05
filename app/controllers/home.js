"use strict";

var request = require('request'),
    http = require('http'),
    jsonld = require('jsonld'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    assert = require('assert'),
    extend = require('util')._extend;

var onErr = function(err, callback) {
    db.close();
    callback(err);
}

// fancy print JSON from: http://jsfiddle.net/KJQ9K/554/
function syntaxHighlight(json) {

    if(typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }

    console.log('syntax json: ');
    console.log(json);

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if(/^"/.test(match)) {
            if(/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if(/true|false/.test(match)) {
            cls = 'boolean';
        } else if(/null/.test(match)) {
            cls = 'null';
        }

        return '<span class="' + cls + '">' + match + '</span>';
    });
}


var processData = function(res, sci_name) {

    var normalizedData = {};
    normalizedData.items = [];
  
    var ld_fields;
    var ld_data = JSON.parse(res);

    MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
        assert.equal(null, err);

        var gbif_ids = [];

        sci_name = sci_name[0].toUpperCase() + sci_name.slice(1);

        db.collection('gbif').find( {scientificName: sci_name} ).toArray(function(err,docs) {
            if(!err) {
                db.close();

                var intCount = docs.length;
                if(intCount > 0) {
                    for(var i = 0; i < intCount;) {
                        var gbif_id = docs[i].matchTaxonID


                        gbif_ids.push(gbif_id);

                         i = i+1;
                    }
                }
            }  else {
                onErr(err, callback);
            }

           console.log('gbif_ids');
           console.log(gbif_ids);

           // Now iterate our stuff?
           var ld_data = JSON.parse(res);
           for(var ld_item in ld_data.items) {

               console.log('ld item: ');
               console.log(ld_data.items[ld_item]);

               // Mocked up JSON-LD fields we want
               var global_names_id = null;
               var global_names_url = null;
               var gbif_id = gbif_ids[0];
               var gbif_url = null;
               var gbif_img_url = null;
               var genbank_uuid = null;
               var genbank_url = null;

               ld_fields = { "iDigBio-LD": {
                   "@GlobalNamesID": global_names_id,
                   "@GlobalNames_URL" : "http://gni.globalnames.org/name_strings/" + global_names_id,
                   "@GBIFID" : gbif_id,
                   "@GBIF": "http://gbif.org/species/" + gbif_id,
                   "@GBIFImage_URL": "http://api.globalbioticinteractions.org/images/GBIF:" + gbif_id,
                   "@GenBank_ID": genbank_uuid,
                   "@GenBank_URL": genbank_url, 
                  
               }};

               console.log('MONGO LD ITEMS');
               console.log(ld_fields);


               var merged = extend(ld_data.items[ld_item], ld_fields);
                   normalizedData.items.push(merged);

           }

           console.log('find normal');
           console.log(normalizedData);

        }); // end collection.find

    });

    for(var ld_item in ld_data.items) {

                // Mocked up JSON-LD fields we want
                var global_names_id = '813583ad-c364-5c15-b01a-43eaa1446fee';
                var gbif_id = 215;

                ld_fields = { "iDigBio-LD": {
                    "@GlobalNamesID": global_names_id,
                    "@GlobalNames_URL" : "http://gni.globalnames.org/name_strings/" + global_names_id,
                    "@GBIFID" : gbif_id,
                    "@GBIF": "http://gbif.org/species/" + gbif_id,
                    "@GBIFImage_URL": "http://api.globalbioticinteractions.org/images/GBIF:" + gbif_id,
                }};


                var merged = extend(ld_data.items[ld_item], ld_fields);
                    normalizedData.items.push(merged);

    }

    return normalizedData;
}

module.exports = function(app, config) {

    return {

        push: function(req, res, next) {
            // TODO:
            // accept JSON, return iDigBio LD JSONLD 
            res.write(JSON.stringify(processData(req.data), req));
            res.end();
        },

        uuid: function(req, res, next) {

            var uuid = req.params.uuid;
            var options = {
                host: 'beta-search.idigbio.org',
                port: 80,
                path: '/v2/view/records/' + uuid,
                method: 'GET'
            };

            var iDigRequest = http.get(options, function(r) {

                var pageData = "";
                r.setEncoding('utf8');
                r.on('data', function(chunk) {
                    pageData += chunk;
                });

                r.on('end', function() {

                    var mycobank_id = null;

                    // Get our ID from Mongo
                    MongoClient.connect(config.mongo_url, function(err, db) {
                        assert.equal(null, err);

                        console.log('Find MycoBank # by UUID');

                        db.collection('fungi').find( {"idigbio_uuid": uuid} ).toArray(function(err,docs) {
                            if(!err) {
                                db.close();
                  
                                var intCount = docs.length;
                                if(intCount > 0) {
                                    var strJson = "";
                                    for(var i = 0; i < intCount;) {

                                        strJson += '{"mycobank_id":"' + docs[i].mycobank_id + '"}'
                                        i = i+1;
                                        if(i < intCount) {
                                            strJson += ',';
                                        }
                                    }

                                    // Set MycoBank #
                                    mycobank_id = JSON.parse(strJson).mycobank_id;

                                    // TODO: remove hardcoding ( but it makes it work )
                                    var myco_options = {
                                        host: 'localhost',
                                        port: 3000,
                                        path: '/mycolookup/' + mycobank_id,
                                        method: 'GET'
                                    };

                                    var MycoRequest = http.get(myco_options, function(myco_r) {
                                    
                                        var mycodata = "";
                                        myco_r.setEncoding('utf8');
                                        myco_r.on('data', function(chunk) {
                                            mycodata += chunk;
                                        });

                                        myco_r.on('end', function() {

                                            var ld_data = processData(pageData, mycodata);
                                          
                                            res.render('index', { title: 'Returned Fungi JSON-LD', json: syntaxHighlight(ld_data)  });
                                            res.end();
                                        });
                                    });

                                }
                            } else {
                                onErr(err, callback);
                            }
                        }); // end collection.find
                    }); 
                });

            });


        },

        index: function(req, res, next) {
            res.render('index', { title: 'iDigBio JSON-LD', json: ''});
            res.end(); 
        },

        sci_name: function(req, res, next) {

            var sci_name = encodeURIComponent(req.params.scientific_name);

            var options = {
                host: 'beta-search.idigbio.org',
                port: 80,
                path: '/v2/search/records/?rq=%7b"scientificname"%3A+"' + sci_name + '"%7D&limit=5',
                method: 'GET'
            };

            var iDigRequest = http.get(options, function(r) {
                    var pageData = "";
                    r.setEncoding('utf8');
                    r.on('data', function(chunk) { pageData += chunk; });
                    r.on('end', function() {         

                        var ld_data = processData(pageData, req.params.scientific_name);

                        res.write("<div style='text-align: left;'><pre>" + syntaxHighlight(ld_data) + "</pre></div>");
                        res.end();
                    });
           });

        }

    }
};
