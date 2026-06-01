import os


os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["CLERK_SECRET_KEY"] = "sk_test_dummy"
