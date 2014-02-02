/*
 * siren API Media Type Sample Implementation
 * siren Spec: https://github.com/kevinswiber/siren
 */

var url =  require('url');
var http = require('http');
var port = process.env.PORT || 80;
var path = '';
var base = '';
var mediaType = 'application/vnd.siren+json';
var sirenResponse = {};
var friends = [];
var pathfilter = '/favicon.ico /sortbyemail /sortbyname /filterbyname';

//http request handler
function handler(req, res) {
    base = 'http://' + req.headers.host;
    path = url.parse(req.url).pathname;
    if (pathfilter.indexOf(path) !== -1) {
        path = '/';
    }

    //populate data object friends
    getFriends();

    //create template siren response object
    createSirenTemplate();

    //populate response object
    renderClass();
    renderActions();
    renderProperties();
    renderEntities();
    renderActions();
    renderlinks();

    res.writeHead(200, 'OK', {'content-type': mediaType});
    res.end(JSON.stringify(sirenResponse));
}

function renderClass() {
    sirenResponse.class.push("order");
}

function renderProperties() {
    sirenResponse.properties.orderNumber = 42;
    sirenResponse.properties.itemCount = 3;
    sirenResponse.properties.status = "pending";
}

// render entities
function renderEntities() {
    sirenResponse.entities.push(
        {
            "class": [ "items", "collection" ],
            "rel": [ "http://x.io/rels/order-items" ],
            "href": "http://api.x.io/orders/42/items"
        }
    );

    sirenResponse.entities.push(
        {
            "class": [ "info", "customer" ],
            "rel": [ "http://x.io/rels/customer" ],
            "properties": {
                "customerId": "pj123",
                "name": "Peter Joseph"
            },
            "links": [
                { "rel": [ "self" ], "href": "http://api.x.io/customers/pj123" }
            ]
        }
    );
}

// render actions
function renderActions() {
    sirenResponse.actions.push(
        {
            "name": "add-item",
            "title": "Add Item",
            "method": "POST",
            "href": "http://api.x.io/orders/42/items",
            "type": "application/x-www-form-urlencoded",
            "fields": [
                { "name": "orderNumber", "type": "hidden", "value": "42" },
                { "name": "productCode", "type": "text" },
                { "name": "quantity", "type": "number" }
            ]
        }
    );
}

// render supported queries as valid Cj query elements
function renderlinks() {
    sirenResponse.links.push(
        { "rel": [ "self" ], "href": "http://api.x.io/orders/42" },
        { "rel": [ "previous" ], "href": "http://api.x.io/orders/41" },
        { "rel": [ "next" ], "href": "http://api.x.io/orders/43" }
    );
}

// the basic template for all Siren Responses
function createSirenTemplate() {
    sirenResponse.class = [];
    sirenResponse.properties = {};
    sirenResponse.entities = [];
    sirenResponse.actions = [];
    sirenResponse.links = [];
}

// actual data to render
// usually kept in external storage
// populate the friends array with items
function getFriends() {
    var item = {};
    friends = [];

    item = {};
    item.name = 'mildred';
    item.email = 'mildred@example.com';
    item.blog = 'http://example.com/blogs/mildred';
    friends.push(item);

    item = {};
    item.name = 'mike';
    item.email = 'mike@example.com';
    item.blog = 'http://example.com/blogs/mike';
    friends.push(item);

    item = {};
    item.name = 'mary';
    item.email = 'mary@example.com';
    item.blog = 'http://example.com/blogs/mary';
    friends.push(item);

    item = {};
    item.name = 'mark';
    item.email = 'mark@example.com';
    item.blog = 'http://example.com/blogs/mark';
    friends.push(item);

    item = {};
    item.name = 'muffin';
    item.email = 'muffin@example.com';
    item.blog = 'http://example.com/blogs/muffin';
    friends.push(item);
}


//initialize http server
http.createServer(handler).listen(port);


// sample siren object
/*
   {
   "class" : [ARRAY],
   "properties" : {},
   "entities" : [ARRAY],
   "actions" : [ARRAY],
   "links" : [ARRAY],
   }
*/
