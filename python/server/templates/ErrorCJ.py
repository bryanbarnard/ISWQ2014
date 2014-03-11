import json
from collections import OrderedDict


class ErrorCJ:
    """simple template to represent Collection+JSON Error """

    def __init__(self, href, title, code, message):
        self.container = dict()
        self.href = href
        self.version = '1.0'
        self.error = {
            'title': title,
            'code': code,
            'message': message
        }

    def to_json(self):
        collection = OrderedDict([
            ('href', self.href),
            ('version', self.version)
        ])

        collection['error'] = self.error;
        self.container['collection'] = collection
        return json.dumps(self.container)

    def to_json_pretty(self):
        collection = OrderedDict([
            ('href', self.href),
            ('version', self.version)
        ])

        collection['error'] = self.error;
        self.container['collection'] = collection
        return json.dumps(self.container, sort_keys=False, indent=4, separators=(',', ': '))
