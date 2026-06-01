from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main as main_module
from database import Base, get_db
from main import app
from qsos.models import QSOLogs
from users import router as users_router_module
from users.models import LinkedCallsigns, Users
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
    user = create_user(db_session, callsign="4Z1ABC", region=1)
    qso = QSOLogs(
        date="20240101",
        freq=14.25,
        spotter="4Z1ABC",
        dx="W1ABC",
        area="H08HF",
    )
    db_session.add(qso)
    db_session.commit()

    response = client.patch(
        "/user/profile",
        json={"callsign": " n0call ", "region": 0},
    )

    assert response.status_code == 200
    assert response.json()["callsign"] == "N0CALL"
    assert response.json()["region"] == 0

    link = db_session.query(LinkedCallsigns).one()
    assert link.user_id == user.id
    assert link.old_callsign == "4Z1ABC"
    assert link.new_callsign == "N0CALL"

    db_session.refresh(qso)
    assert qso.spotter == "4Z1ABC"


def test_get_user_callsign_returns_current_user_details(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=2)

    response = client.get("/user/callsign")

    assert response.status_code == 200
    assert response.json() == {"callsign": "4Z1ABC", "region": 2}


def test_patch_user_profile_rejects_duplicate_callsign(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=1)
    db_session.add(
        Users(
            clerk_user_id="user_2",
            email="other@example.com",
            username="other",
            callsign="N0CALL",
            region=0,
        )
    )
    db_session.commit()

    response = client.patch(
        "/user/profile",
        json={"callsign": "n0call", "region": 1},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Callsign N0CALL is already taken"}


def test_patch_user_profile_rejects_linked_callsign_owned_by_another_user(
    client, db_session
):
    create_user(db_session, callsign="4Z1ABC", region=1)
    other_user = Users(
        clerk_user_id="user_2",
        email="other@example.com",
        username="other",
        callsign="K1NEW",
        region=0,
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)
    db_session.add(
        LinkedCallsigns(
            user_id=other_user.id,
            old_callsign="N0CALL",
            new_callsign="K1NEW",
        )
    )
    db_session.commit()

    response = client.patch(
        "/user/profile",
        json={"callsign": "n0call", "region": 1},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Callsign N0CALL is already taken"}


def test_patch_user_profile_rejects_invalid_payload(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=1)

    response = client.patch(
        "/user/profile",
        json={"callsign": "4Z1ABC", "region": 4},
    )

    assert response.status_code == 422


def test_patch_user_profile_returns_404_when_update_target_missing(
    client, db_session, monkeypatch
):
    create_user(db_session, callsign="4Z1ABC", region=1)
    monkeypatch.setattr(
        users_router_module.user_service,
        "update_user_profile",
        lambda **kwargs: None,
    )

    response = client.patch(
        "/user/profile",
        json={"callsign": "N0CALL", "region": 1},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


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


def test_get_qsos_by_user_counts_linked_callsigns_once(client, db_session):
    user = create_user(db_session, callsign="N0CALL", region=1)
    db_session.add(
        LinkedCallsigns(
            user_id=user.id,
            old_callsign="4Z1ABC",
            new_callsign="N0CALL",
        )
    )
    db_session.add_all(
        [
            QSOLogs(
                date="20240101",
                freq=14.25,
                spotter="4Z1ABC",
                dx="W1ABC",
                area="H08HF",
            ),
            QSOLogs(
                date="20240102",
                freq=7.1,
                spotter="N0CALL",
                dx="W2ABC",
                area="H08HF",
            ),
            QSOLogs(
                date="20240103",
                freq=21.3,
                spotter="N0CALL",
                dx="W3ABC",
                area="A22BS",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/qsos/by-user")

    assert response.status_code == 200
    body = response.json()
    assert body["callsign"] == "N0CALL"
    assert set(body["areas"]) == {"H08HF", "A22BS"}
    assert set(body["regions"]) == {"HF", "BS"}
    assert body["total_areas"] == 2
    assert body["total_regions"] == 2


def test_get_qsos_by_user_returns_404_for_missing_user(client):
    response = client.get("/qsos/by-user")

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


def test_get_qsos_by_user_requires_callsign(client, db_session):
    create_user(db_session, callsign=None, region=1)

    response = client.get("/qsos/by-user")

    assert response.status_code == 400
    assert response.json() == {"detail": "User has no callsign assigned"}


def test_get_areas_returns_distinct_areas_for_spotter(client, db_session):
    create_user(db_session, callsign="4Z1ABC", region=1)
    db_session.add_all(
        [
            QSOLogs(
                date="20240101",
                freq=14.25,
                spotter="4Z1ABC",
                dx="W1ABC",
                area="H08HF",
            ),
            QSOLogs(
                date="20240102",
                freq=7.1,
                spotter="4Z1ABC",
                dx="W2ABC",
                area="J05HF",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/areas/4Z1ABC")

    assert response.status_code == 200
    assert set(response.json()["areas"]) == {"H08HF", "J05HF"}


def test_upload_file_requires_user_callsign(client, db_session):
    create_user(db_session, callsign=None, region=1)

    response = client.post(
        "/read-file",
        files={"file": ("log.adi", b"<EOH>", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "User callsign not found. Please update your profile first."
    }


def test_upload_file_parses_and_returns_inserted_qsos(
    client, db_session, monkeypatch
):
    create_user(db_session, callsign="4Z1ABC", region=1)
    captured_qsos = []

    def fake_read_from_file(path):
        assert Path(path).exists()
        return (
            [
                (
                    "<QSO_DATE:8>20240101"
                    "<FREQ:6>14.250"
                    "<STATION_CALLSIGN:6>4Z1ABC"
                    "<CALL:5>W1ABC"
                    "<COMMENT:5>H08HF"
                )
            ],
            {},
        )

    def fake_insert_qsos(db, qsos):
        captured_qsos.extend(qsos)
        return [
            SimpleNamespace(
                id=10,
                date="20240101",
                freq=14.25,
                dx="W1ABC",
                area="H08HF",
            )
        ]

    monkeypatch.setattr(main_module.adif_io, "read_from_file", fake_read_from_file)
    monkeypatch.setattr(main_module, "insert_qsos", fake_insert_qsos)

    response = client.post(
        "/read-file",
        files={"file": ("unit_upload.adi", b"ignored", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "total_qsos": 1,
        "callsign": "4Z1ABC",
        "qsos": [
            {
                "id": 10,
                "date": "20240101",
                "freq": 14.25,
                "dx": "W1ABC",
                "area": "H08HF",
            }
        ],
    }
    assert len(captured_qsos) == 1
    assert captured_qsos[0].model_dump() == {
        "date": "20240101",
        "freq": 14.25,
        "spotter": "4Z1ABC",
        "dx": "W1ABC",
        "area": "H08HF",
    }
    assert not Path("temp_unit_upload.adi").exists()
