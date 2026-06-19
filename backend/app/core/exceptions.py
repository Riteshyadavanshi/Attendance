from fastapi import HTTPException, status


class AppHTTPException(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(
            status_code=status_code,
            detail={"success": False, "error": {"code": code, "message": message}},
        )


class FaceNotMatchedError(AppHTTPException):
    def __init__(self):
        super().__init__("FACE_NOT_MATCHED", "Face verification failed", status.HTTP_403_FORBIDDEN)


class LivenessFailedError(AppHTTPException):
    def __init__(self):
        super().__init__(
            "LIVENESS_FAILED", "Liveness check failed", status.HTTP_403_FORBIDDEN
        )


class GeofenceError(AppHTTPException):
    def __init__(self, message: str = "You are outside the allowed check-in area"):
        super().__init__("GEOFENCE_OUT_OF_RANGE", message, status.HTTP_403_FORBIDDEN)


class AlreadyCheckedInError(AppHTTPException):
    def __init__(self):
        super().__init__(
            "ALREADY_CHECKED_IN", "You have already checked in today", status.HTTP_409_CONFLICT
        )


class ForbiddenError(AppHTTPException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


class NotFoundError(AppHTTPException):
    def __init__(self, resource: str = "Resource"):
        super().__init__("NOT_FOUND", f"{resource} not found", status.HTTP_404_NOT_FOUND)
