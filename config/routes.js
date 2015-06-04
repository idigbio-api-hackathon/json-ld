module.exports = function(app, config) {

    //home route
    var home = require('../app/controllers/home')(app, config);
    var myco = require('../app/controllers/myco')(app, config);
 
    app.route('/')
        .get(home.index);

    app.route('/uuid_lookup/:uuid')
        .get(home.uuid);

    app.route('/push')
        .get(home.push);

    app.route('/mycolookup/:myco_num')
        .get(myco.index);

    app.use(function(err, req, res, next) {
        if(err) { next(err); }
        else { 
            res.status(404).json({"error": "Not Found"});
            next();
        }
    });
};
