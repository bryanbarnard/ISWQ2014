

from bottle import Bottle, run, route, abort, redirect, request, response

# application
app = Bottle()

# routes

# default
@app.route('/')
def default():
    abort(404, "not found")


# billboard route
@app.route('/api')
def billboard():
    # check accepts and content type

    # return billboard
    return "billboard"


run(app, host='localhost', port=8080, debug=True)
