//imports

var http = require('http');
var url = require('url');
var crypto = require('crypto');
var uuid = require('node-uuid');
var querystring = require('querystring');
var movieCollectionStatic = require('./movie_collection.json');
var movieItemStatic = require('./movie_item.json');
var billboardResponseStatic = require('./billboard.json');
var mongoose = require('mongoose');
var fs = require('fs');
var bunyan = require('bunyan');

//variables
var port = (process.env.PORT || 1337);
var root = '';
var path = '';
var base = '/';
var contentType = '';
var responseCj = {};
var responseBody = '';
var responseHeaders = null;
var responseStatus = null;
var requestBody = null;
var log = bunyan.createLogger({name: "api"});


/**
 * Setup DB Connection
 */

// Connect to mongodb
var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } }
    mongoose.connect('mongodb://localhost/api', options)
}
connect();

// Error handler
mongoose.connection.on('error', function (err) {
    log.info(err)
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
    connect()
});

// On Connection
mongoose.connection.once('open', function callback () {
    log.info('mongod connected successfully');
});


// Bootstrap models
fs.readdirSync('../models').forEach(function (file) {
    if (~file.indexOf('.js')) {
      require('../models/' + file);
    }
});


/**
 * Lets Run Some Tests with Mongoose
 */

// create and save movie
var instance = new mongoose.models.Movie({ name: 'Red Dawn'});
log.info('instance.name: ' + instance.name);

/*
instance.save(function (err, instance) {
    if (err) {
        return console.error(err);
    }
    console.log('instance.name: ' + instance.name + ' saved');
});
*/

// lets run a query
mongoose.models.Movie.find(function (err, movies) {
    if (err) {
        return console.error(err);
    }

    if (movies && movies.length > 0) {
        for (var i = 0; i < movies.length; i++) {
            log.info({movie: movies[i]});
        }
    }
});


/**
 * Route Patterns
 */
var reAPIBillboard = new RegExp('^\/api\/$','i');
var reAPIListMovies = new RegExp('^\/api\/movies$','i');
var reAPIItemMovies = new RegExp('^\/api\/movies\/.*','i');

/**
 * Create Collection JSON Response Template
 */
var createResponseCjTemplate = function() {
    responseCj.collection = {};
    responseCj.version = "1.0";
    responseCj.href = base + path;

    responseCj.links = [];
    responseCj.links.push({'rel': 'home', 'href': base});

    responseCj.items = [];
    responseCj.queries = [];
    responseCj.template = {};
};

/**
 * Handle incoming requests
 * @param req
 * @param res
 */
var handler = function (req, res) {
    //some simple content negotiation
    if (req.headers.accept && req.headers.accept.indexOf('application/vnd.collection+json') != -1) {
        contentType = 'application/vnd.collection+json';
    } else {
        contentType = 'application/json';
    }

    var flg = false;
    root = 'http://' + req.headers.host;
    base = 'http://' + req.headers.host;
    path = url.parse(req.url).pathname;


    //capture request body
    requestBody = '';
    req.on('data', function (chunk) {
        requestBody += chunk;
    });

    //billboard route - RegExp('^\/api\/$','i')
    if (reAPIBillboard.test(req.url)) {
        flg = true;
        console.log('reAPIBillboard true');

        switch(req.method) {
            case 'GET':
                sendBillboardResponse(req, res);
                break;
            default:
                break;
        }
    }

    //movies collection route - RegExp('^\/api\/movies$','i')
    if (flg === false && reAPIListMovies.test(req.url)) {
        flg = true;
        console.log('reAPIListMovies true');

        switch(req.method) {
            case 'GET':
                sendListResponseMovies(req, res);
                break;
            case 'POST':
                sendAddMovieResponse(req, res);
                break;
            case 'DELETE':
                sendDeleteResponse(req, res);
                break;
            default:
                break;
        }
    }

    //movie item route - RegExp('^\/api\/movies\/.*','i')
    if (flg === false && reAPIItemMovies.test(req.url)) {
        flg = true;
        console.log('reAPIItemMovies true');

        switch(req.method) {
            case 'GET':
                sendItemResponseMovies(req, res);
                break;
            case 'POST':
                //sendNotAcceptedResponse
            case 'PUT':
                //sendItemUpdateResponseMovies(req, res);
                break;
            case 'DELETE':
                sendDeleteResponse(req, res);
                break;
            default:
                break;
        }
    }


    //not found
    if (flg === false) {
        console.log('send not found');
        sendNotFoundResponse(req, res);
    }
};

var sendAddMovieResponse = function (req, res) {
    req.on('end', function () {

        //TODO: add validation and add functionality


        //build response
        var id = uuid();
        id = id.replace(/-/g,'');

        //responseCj = billboardResponseStatic;
        responseBody = '';
        responseHeaders = {
            'Location': base + 'movies/' + id
        }
        responseStatus = 201;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};

var sendBillboardResponse = function (req, res) {
    req.on('end', function () {
        //build response

        responseCj = billboardResponseStatic;
        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        }
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};


var sendDeleteResponse = function (req, res) {
    responseBody = '';
    responseHeaders = {};
    responseStatus = 204;
    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
};

var sendNotFoundResponse = function (req, res) {
    responseBody = '';
    responseHeaders = {};
    responseStatus = 404;
    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
};

/**
 * Render Movie Write Template (POST, PUT)
 */
var renderMovieCollectionTemplate = function () {
    var template = {};
    var item = {};

    template.data = [];

    item = {};
    item.name = 'name';
    item.value = '';
    item.prompt = 'title of movie';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'description';
    item.value = '';
    item.prompt = 'description of movie';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'datePublished';
    item.value = '';
    item.prompt = 'date movie was published';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'about';
    item.value = '';
    item.prompt = 'short description of film';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'genre';
    item.value = '';
    item.prompt = 'movie genre';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'version';
    item.value = '';
    item.prompt = 'version of thie release';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'timeRequired';
    item.value = '';
    item.prompt = 'time required to view this movie aka duration';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'contentRating';
    item.value = '';
    item.prompt = 'movie content rating';
    item.required = 'true';
    template.data.push(item);

    responseCj.collection.template = template;
};

/**
 * Render movie collection queries
 */
var renderMovieCollectionQueries = function () {
    var query = {};

    query = {};
    query.rel = 'collection sort';
    query.prompt = 'Sort by Name';
    query.href = base + '/sortbyname';
    responseCj.queries.push(query);

};

/**
 * Render movie collection items
 */
var renderMovieCollectionItems = function (coll) {

    var item = {};
    var dataItem = {};

    id = '613856331910938';
    item.href = base + '/' + id;
    item.data = [];
    item.links = [];


    dataItem = {};
    dataItem.name = 'description';
    dataItem.value = 'An exclusive golf course has to deal with a brash new member and a destructive dancing gopher.';
    dataItem.prompt = 'description of movie';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'datePublished'
    dataItem.value = '2013-03-28T21:51:08.406Z';
    dataItem.prompt = 'date movie was published';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'name'
    dataItem.value = 'Caddyshack';
    dataItem.prompt = 'title of the movie';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'about'
    dataItem.value = 'An exclusive golf course has to deal with a brash new member and a destructive dancing gopher.';
    dataItem.prompt = 'short description of this item';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'genre';
    dataItem.value = 'comedy';
    dataItem.prompt = 'movie genre';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'version';
    dataItem.value = '1';
    dataItem.prompt = 'version of this release';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'timeRequired';
    dataItem.value = 'PT180M';
    dataItem.prompt = 'time required to view this movie, aka duration';
    item.data.push(dataItem);

    dataItem = {};
    dataItem.name = 'contentRating';
    dataItem.value = 'R';
    dataItem.prompt = 'rating of the movie';
    item.data.push(dataItem);

    linkItem = {};
    linkItem.name = "harold ramis";
    linkItem.rel = 'directory';
    linkItem.prompt = 'director of the movie';
    linkItem.href = base + path + '/' + id;
    linkItem.render = 'link';
    item.links.push(linkItem);

    responseCj.collection.items.push(item);

};

var sendListResponseMovies = function (req, res) {
    req.on('end', function () {

        var coll = []; //fix this

        //build response
        createResponseCjTemplate();
        renderMovieCollectionTemplate();
        renderMovieCollectionQueries();
        renderMovieCollectionItems(coll);





        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        }
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};

var sendItemResponseMovies = function (req, res) {
    req.on('end', function () {
        //build response

        responseCj = movieItemStatic;
        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        }
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};

var sendResponse = function (req, res, responseStatus, responseHeaders, responseBody) {
    res.writeHead(responseStatus, responseHeaders);
    res.end(responseBody);
};


//main
http.createServer(handler).listen(port);

var cjTemplate = {
    "collection":
    {
        "version":"0.1",
        "href": base,
        "links":[
            base + "/movies",
            base + "/actors"
        ],
        "items":[],
        "queries":[],
        "template":{},
        "error":{}
    }
};

/*
 var server = http.createServer(function(request, response) {
 var body = '';

 request.on('data', function (chunk) {
 body += chunk;
 });

 request.on('end', function () {
 var now = new Date();
 var msg = '';

 console.log('request received: ' + now.toISOString());
 console.log('request.method: ' + request.method);
 console.log('request.url: ' + request.url);
 console.log('request.httpVersion: ' + request.httpVersion);
 console.log('request.headers:');

 //log headers
 for (var header in request.headers) {
 console.log('  ' + header + ': ' + request.headers[header]);
 }

 console.log('request.body:');
 //console.log('  ' + body);

 try {
 msg = JSON.parse(body);
 console.log(JSON.stringify(msg, null, 4)); //4 is the spacer arg
 }
 catch(ex) {
 console.log('error parsing body as JSON');
 }

 console.log(); //insert line break
 response.writeHead(200);
 response.end();
 });
 }).listen(port, 'localhost');
 console.log('server listening at http://localhost:8080');
 */

/**
 * Sample Requests
 */
//curl -X POST -v -H "Content-Type: application/vnd.collection+json" -H "Connection: close" -H "Cache-Control: no-cache" -d '{"template":{"data":[{"name":"text","value":"testing"},{"name":"junk","value":""}]}}' http://localhost:8080/api/
