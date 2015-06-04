"use strict";

var request = require('request'),
    http = require('http'),
    jsonld = require('jsonld'),
    extend = require('util')._extend;

// fancy print
function syntaxHighlight(json) {

    if(typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }

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


var processData = function(res) {

    var normalizedData = {};
    normalizedData.items = [];

    var ld_data = JSON.parse(res);

    if(ld_data.items) {
        for(var ld_item in ld_data.items) {
        
            // TODO - What fields actually matter here
            // How to get them if / when not provided in 

            // TODO - get MycoBank data to pull links

            var ld_fields = { "@context": "https://schema.org/",
                          "@type": "https://schema.org/ListItem" 
            };

            // not sure this is needed
            jsonld.compact(ld_data.items[ld_item], ld_fields, function(err, compacted) {
                if(null == err) {
                    var merged = extend(ld_data.items[ld_item], compacted);
                    normalizedData.items.push(merged);
                }
            }); 

            var merged = extend(ld_data.items[ld_item], ld_fields);
                normalizedData.items.push(merged);

        }
    } else {
        var ld_fields = { "@context": "https://schema.org/", "@type": "https://schema.org/ListItem"};
     
        jsonld.compact(ld_data, ld_fields, function(err, compacted) {
            if(null == err) {
                var merged = extend(ld_data, compacted);
                normalizedData.items.push(merged);
            }
        });

        var merged = extend(ld_data, ld_fields);
            normalizedData.items.push(merged);
    }

    return normalizedData;
}

module.exports = function(app, config) {

    return {

        push: function(req, res, next) {
            // TODO:
            // accept JSON, return iDigBio LD JSONLD 
            res.write(JSON.stringify(processData(req.data)));
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
                    var ld_data = processData(pageData);

                    res.render('index', { title: 'Returned Fungi JSON-LD', json: syntaxHighlight(ld_data)  });
                    res.end();
                });

            });


        },

        index: function(req, res, next) {

            // TODO - provide URL input for iDigBio Search API

            // TODO - Render HTML / JSON View (mocked up data
            // TODO - Stub code to query MongoDB fro output from iDigBioLD Taxonomic Linker            

            // query the iDigBio Search API
            var options = {
                host: 'beta-search.idigbio.org',
                port: 80,
                path: '/v2/search/records/?rq=%7B%22scientificname%22%3A+%22puma+concolor%22%7D&limit=5',
                method: 'GET'
            };

            var iDIGreq = http.get(options, function(r) {

                var pageData = "";
                r.setEncoding('utf8');
                r.on('data', function(chunk) {
                    pageData += chunk;
                });

                // parse the JSON results and rewrap or append the JSONLD markup 
                r.on('end', function() {

                    var ld_data = processData(pageData);

                    //res.write(JSON.stringify(ld_data));

                    res.render('index', { title: 'iDigBio JSONLD', json: ld_data });
                    res.end();
                });

            });
        }
    };

};
