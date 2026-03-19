"""User domain exceptions."""


class UserAlreadyExistsError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class TokenExpiredError(Exception):
    pass


class InvalidTokenError(Exception):
    pass
