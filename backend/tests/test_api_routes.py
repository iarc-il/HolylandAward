import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from qsos.models import QSOLogs
from users.models import Users
from utils import verify_clerk_session


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    async def override_verify_clerk_session():
        return "user_1"

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_clerk_session] = override_verify_clerk_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def create_user(db_session, callsign="4Z1ABC", region=1):
    user = Users(
        clerk_user_id="user_1",
        email="user@example.com",
        username="tester",
        callsign=callsign,
        region=region,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_get_user_profile_returns_current_user(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=1)

    response = client.get("/user/profile")

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "clerk_user_id": "user_1",
        "email": "user@example.com",
        "username": "tester",
        "callsign": "4Z1ABC",
        "region": 1,
    }


def test_patch_user_profile_updates_callsign_and_region(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=1)

    response = client.patch(
        "/user/profile",
        json={"callsign": " n0call ", "region": 0},
    )

    assert response.status_code == 200
    assert response.json()["callsign"] == "N0CALL"
    assert response.json()["region"] == 0


def test_get_qsos_by_user_returns_area_and_region_totals(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=1)
    db_session.add_all(
        [
            QSOLogs(date="20240101", freq=14.25, spotter="4Z1ABC", dx="W1ABC", area="H08HF"),
            QSOLogs(date="20240102", freq=7.1, spotter="4Z1ABC", dx="W2ABC", area="J05HF"),
            QSOLogs(date="20240103", freq=21.3, spotter="4Z1ABC", dx="W3ABC", area="A22BS"),
        ]
    )
    db_session.commit()

    response = client.get("/qsos/by-user")

    assert response.status_code == 200
    body = response.json()
    assert body["callsign"] == "4Z1ABC"
    assert set(body["areas"]) == {"H08HF", "J05HF", "A22BS"}
    assert set(body["regions"]) == {"HF", "BS"}
    assert body["total_areas"] == 3
    assert body["total_regions"] == 2
