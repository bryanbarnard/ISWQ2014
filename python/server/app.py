from bottle import default_app, abort, response, request, run
import json

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
@app.route('/api')
def callback():

    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))

    with open('billboard.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)


# movies collection route - '^\/api\/movies$'
@app.route('/api/movies')
def callback():

    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))

    with open('movie_collection.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)


# movie item route - '^\/api\/movies\/.*'
@app.route('/api/movies/<id:re:.*>')
def callback(id):

    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')
    response.set_header('Content-Type', determine_response_content_type(accept))

    with open('movie_item.json') as json_data:
        response_body = json.load(json_data)
        json_data.close()
    return json.dumps(response_body)






# main
run(app, host='localhost', port=1337, debug=True)
