from mongoengine import *

# mongoengine class
class Movie(Document):
    name = StringField(required=True)
    description = StringField(required=True)
    meta = {'collection': 'movies'}


