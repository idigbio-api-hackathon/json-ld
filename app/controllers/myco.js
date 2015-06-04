"use strict";

var request = require('request'),
    http = require('http'),
    jsonld = require('jsonld'),
    extend = require('util')._extend,
    parseString = require('xml2js').parseString;


module.exports = function(app, config) {

    return {
        index: function(req, res, next) {

            // Pull MycoBank Number from URL
            var myco_num = req.params.myco_num;

            var options = {
                host: 'www.mycobank.org',
                port: 80,
                path: '/Services/Generic/SearchService.svc/rest/xml?layout=14682616000000161&filter=MycoBankNr_=%22' + myco_num + '%22',
                method: 'GET'
            };

            var Myco_req = http.get(options, function(r) {

                var pageData = "";
                r.setEncoding('utf8');
                r.on('data', function(chunk) {
                    pageData += chunk;
                });

                r.on('end', function() {

                    console.log('MycoBank XML Response');

                    // TODO: Parse Myco Result for ID to pass to Cassandra Lookup table
                    parseString(pageData, function(err, result) {
                        res.write(JSON.stringify(result));
                    });

                    res.end();
                });

            });
        }
    };

};
