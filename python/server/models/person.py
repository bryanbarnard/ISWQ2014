from mongoengine import *

# mongoengine class
class Person(Document):
    familyName = StringField(required=True)
    meta = {'collection': 'persons'}