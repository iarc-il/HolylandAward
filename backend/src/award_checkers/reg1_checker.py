from src.award_checkers.award_checker import AwardChecker


class Reg1Checker(AwardChecker):
    def __init__(self):
        super().__init__(100, 13, 12)

    def check_certificate(self):
        # Implement award checking logic here
        pass

    def check_sticker(self):
        # Implement sticker checking logic here
        pass
