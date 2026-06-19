import pytest

from app.services import GeofenceService


def test_haversine_same_point():
    svc = GeofenceService()
    assert svc.haversine_distance_m(28.6139, 77.2090, 28.6139, 77.2090) == 0.0


def test_haversine_within_300m():
    svc = GeofenceService()
    # ~111m north
    dist = svc.haversine_distance_m(28.6139, 77.2090, 28.6149, 77.2090)
    assert dist < 300


def test_haversine_far_away():
    svc = GeofenceService()
    dist = svc.haversine_distance_m(28.6139, 77.2090, 19.0760, 72.8777)
    assert dist > 100_000
