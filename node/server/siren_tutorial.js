var url =  require('url');
var http = require('http');
var port = process.env.PORT || 80;

var path = '';
var base = '';
var cType = 'application/vnd.collection+json';
var cj = {};
var friends = [];
var pathfilter = '/favicon.ico /sortbyemail /sortbyname /filterbyname';

function handler(req, res) {
    base = 'http://' + req.headers.host;
    path = url.parse(req.url).pathname;
    if (pathfilter.indexOf(path) !== -1) {
        path = '/';
    }

    getFriends();
    createCjTemplate();
    renderItems(friends);
    renderQueries();
    renderTemplate();

    res.writeHead(200, 'OK', {'content-type': cType});
    res.end(JSON.stringify(cj));
}

// render write template (POST, PUT)
function renderTemplate() {
    var template = {};
    var item = {};

    template.data = [];

    item = {};
    item.name = 'name';
    item.value = '';
    item.prompt = 'Name';
    template.data.push(item);

    item = {};
    item.name = 'email';
    item.value = '';
    item.prompt = 'Email';
    template.data.push(item);

    item = {};
    item.name = 'blog';
    item.value = '';
    item.prompt = 'Blog';
    template.data.push(item);

    cj.collection.template = template;
}

// the basic template for all Cj responses
function createCjTemplate() {
    cj.collection = {};
    cj.collection.version = "1.0";
    cj.collection.href = base + path;

    cj.collection.links = [];
    cj.collection.links.push({'rel': 'home', 'href': base});

    cj.collection.items = [];
    cj.collection.queries = [];
    cj.collection.template = {};
}

// render supported queries as valid Cj query elements
function renderQueries() {
    var query = {};

    query = {};
    query.rel = 'collection sort';
    query.prompt = 'Sort by Name';
    query.href = base + '/sortbyname';
    cj.collection.queries.push(query);

    query = {};
    query.rel = 'collection filter';
    query.prompt = 'Filter by Name';
    query.href = base + '/filterbyname';
    query.data = [];
    query.data[0] = {
        'name': 'name',
        'value': '',
        'prompt': 'Name'
    }
    cj.collection.queries.push(query);

    query = {};
    query.rel = 'collection sort';
    query.prompt = 'Sort by Email';
    query.href = base + '/sortbyemail';
    cj.collection.queries.push(query);
}


// render data object (friends) as valid Cj items
function renderItems(coll) {
    var i, x, item, p, d, l;

    for (i = 0, x = coll.length; i < x; i++) {
        if (path === '/' || path === '/' + coll[i].name) {
            item = {};
            item.href = base + '/' + coll[i].name;
            item.data = [];
            item.links = [];

            d = 0;
            l = 0
            for (p in friends[i]) {
                if (p === 'blog') {
                    item.links[l++] = {
                        'rel': 'alternate',
                        'href': friends[i][p],
                        'prompt': p
                    }
                }
                else {
                    item.data[d++] = {
                        'name': p,
                        'value': friends[i][p],
                        'prompt': p
                    }
                }
            }
            cj.collection.items.push(item);
        }
    }
}


// actual data to render
// // usually kept in external storage
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
http.createServer(handler).listen(port);


// sample collection object
/*
   {
   "collection" :
   {
   "version" : "1.0",
   "href" : URI,
   "links" : [ARRAY],
   "items" : [ARRAY],
   "queries" : [ARRAY],
   "template" : {OBJECT},
   "error" : {OBJECT}
   }
   }
*/
