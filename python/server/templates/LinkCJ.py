class LinkCJ:
    """simple link class"""

    def __init__(self, href, prompt, rel):
        self.href = href
        self.prompt = prompt
        self.rel = rel

    def toDict(self):
        return {'href': self.href, 'prompt': self.prompt, 'rel': self.rel}
