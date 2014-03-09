import json
import sys

sys.path.append('models')

from bottle import *
from person import *
from movie import *
import mongoengine

# application
app = default_app();
app.config['autojson'] = False


# setup response Content-Type
def determine_response_content_type(acceptHeader):
    if acceptHeader and 'application/vnd.collection+json' in acceptHeader:
        return 'application/vnd.collection+json'
    else:
        return 'application/json'

# routes
# default
@app.route('/')
def callback():
    abort(404, "not found")


# billboard route - '^\/api$'
@app.route(path='/api', method='GET')
def callback():
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))
    response.status = 200

    with open('billboard.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)


# movies collection route - '^\/api\/movies$'
@app.route(path='/api/movies', method='GET')
def callback():
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))
    response.status = 200

    # connect to mongodb
    mongoengine.connect('api')

    # iterate movies
    for movie in Movie.objects:
        print movie.name

    with open('movie_collection.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)


# movies collection route - '^\/api\/movies$'
@app.route(path='/api/movies', method='POST')
def callback():
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))
    response.set_header('Location', request.url + '/1234')
    response.status = 201


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<id:re:.*>', method='GET')
def callback(id):
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))
    response.status = 200

    with open('movie_item.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<id:re:.*>', method='PUT')
def callback(id):
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))
    response.status = 204

    with open('movie_item.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)


    return json.dumps(response_body)

# main
run(app, host='localhost', port=1337, debug=True)
