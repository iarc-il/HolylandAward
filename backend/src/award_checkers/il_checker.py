from src.award_checkers.award_checker import AwardChecker


class ILChecker(AwardChecker):
    def __init__(self):
        super().__init__(150, 18, 10)

    def check_certificate(self):
        # Implement award checking logic here
        pass

    def check_sticker(self):
        # Implement sticker checking logic here
        pass
