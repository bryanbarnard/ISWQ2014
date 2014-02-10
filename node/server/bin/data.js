//load some static data
var getFriends = function () {
    var friends = [];
    var item = null;

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

    return friends;
};

exports.friends = getFriends();