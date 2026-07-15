import bcrypt

# Using the bcrypt library directly rather than passlib -- passlib's
# bcrypt backend has a known compatibility break with bcrypt>=4.1 (it
# depends on an internal `__about__.__version__` attribute that newer
# bcrypt releases removed), which throws at hash-time. Calling bcrypt
# directly sidesteps that fragile dependency entirely.
#
# bcrypt truncates/ignores anything past 72 bytes internally, so we cap
# input length ourselves first to avoid surprises with long passwords.
MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    password_bytes = plain_password.encode("utf-8")[:MAX_PASSWORD_BYTES]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:MAX_PASSWORD_BYTES]
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))