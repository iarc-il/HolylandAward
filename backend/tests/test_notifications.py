import notifications


def _configure(monkeypatch):
    monkeypatch.setenv("SMTP_USER", "sender@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "abcd efgh ijkl mnop")
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "admin@example.com")


class FakeSMTP:
    instances = []

    def __init__(self, host, port, timeout=None):
        self.host, self.port = host, port
        self.sent = []
        self.logged_in = None
        FakeSMTP.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def starttls(self):
        self.tls = True

    def login(self, user, password):
        self.logged_in = (user, password)

    def send_message(self, message):
        self.sent.append(message)


def test_send_is_skipped_when_not_configured(monkeypatch):
    for name in ("SMTP_USER", "SMTP_PASSWORD", "ADMIN_NOTIFY_EMAIL"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr(
        notifications.smtplib, "SMTP", lambda *a, **k: (_ for _ in ()).throw(AssertionError)
    )

    assert notifications.send_admin_email("s", "b") is False


def test_send_uses_starttls_login_and_strips_app_password_spaces(monkeypatch):
    _configure(monkeypatch)
    FakeSMTP.instances.clear()
    monkeypatch.setattr(notifications.smtplib, "SMTP", FakeSMTP)

    assert notifications.send_admin_email("Subject", "Body") is True

    server = FakeSMTP.instances[0]
    assert (server.host, server.port) == ("smtp.gmail.com", 587)
    assert server.logged_in == ("sender@example.com", "abcdefghijklmnop")
    assert server.sent[0]["To"] == "admin@example.com"
    assert server.sent[0]["Subject"] == "Subject"


def test_send_never_raises_when_mail_server_fails(monkeypatch):
    _configure(monkeypatch)

    def boom(*a, **k):
        raise OSError("network down")

    monkeypatch.setattr(notifications.smtplib, "SMTP", boom)

    assert notifications.send_admin_email("s", "b") is False
