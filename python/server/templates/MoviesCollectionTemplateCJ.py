import json
from collections import OrderedDict
from MoviesTemplateCJ import *


class MoviesCollectionTemplateCJ:
    """simple template to represent Collection+JSON Responses"""

    def __init__(self, root):
        self.container = dict()
        self.href = root + 'movies'
        self.version = '1.0'
        self.links = []
        self.template = {'data': MoviesTemplateCJ.create()}
        self.queries = []
        self.items = []

    def to_json(self):
        collection = OrderedDict([
            ('href', self.href),
            ('version', self.version),
        ])

        if len(self.links) > 0:
            collection['links'] = self.links

        if len(self.items) > 0:
            collection['items'] = self.items

        if len(self.queries) > 0:
            collection['queries'] = self.queries

        collection['template'] = self.template;
        self.container['collection'] = collection
        return json.dumps(self.container)

    def to_json_pretty(self):
        collection = OrderedDict([
            ('href', self.href),
            ('version', self.version),
        ])

        if len(self.links) > 0:
            collection['links'] = self.links

        if len(self.items) > 0:
            collection['items'] = self.items

        if len(self.queries) > 0:
            collection['queries'] = self.queries

        collection['template'] = self.template;
        self.container['collection'] = collection
        return json.dumps(self.container, sort_keys=False, indent=4, separators=(',', ': '))
