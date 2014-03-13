class LinkCJ:
    """simple link class"""

    def __init__(self, href, prompt, rel):
        """

        :param url:
        :param prompt:
        :param link relation:
        """
        self.href = href
        self.prompt = prompt
        self.rel = rel

    def to_dict(self):
        return {'href': self.href, 'prompt': self.prompt, 'rel': self.rel}
