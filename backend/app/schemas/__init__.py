from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class APIResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    message: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: "UserOut"


class UserOut(BaseModel):
    id: UUID
    email: str
    roles: list[str]
    organization_id: UUID
    employee_id: UUID | None = None
    full_name: str | None = None

    model_config = {"from_attributes": True}


class OrganizationCreate(BaseModel):
    name: str
    slug: str
    timezone: str = "Asia/Kolkata"


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    slug: str
    timezone: str
    is_active: bool

    model_config = {"from_attributes": True}


class DepartmentCreate(BaseModel):
    name: str
    code: str | None = None


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    code: str | None
    organization_id: UUID

    model_config = {"from_attributes": True}


class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    employee_code: str
    full_name: str
    department_id: UUID | None = None
    designation: str | None = None
    mobile: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    location: str | None = None
    roles: list[str] = ["employee"]


class EmployeeOut(BaseModel):
    id: UUID
    employee_code: str
    full_name: str
    designation: str | None
    mobile: str | None
    department_id: UUID | None
    gender: str | None = None
    date_of_birth: date | None = None
    location: str | None = None
    face_enrolled: bool
    is_active: bool
    email: str | None = None

    model_config = {"from_attributes": True}


class EmployeeProfileOut(BaseModel):
    """Self-service profile used to autofill the face-capture form."""

    id: UUID
    employee_code: str
    full_name: str
    designation: str | None = None
    department_id: UUID | None = None
    department_name: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    age: int | None = None
    location: str | None = None
    email: str | None = None
    face_enrolled: bool = False


class EmployeeProfileUpdate(BaseModel):
    """Fields an employee may edit on the capture form (employee_code is locked)."""

    gender: str | None = None
    date_of_birth: date | None = None
    location: str | None = None


class OfficeLocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius_meters: int = 300


class OfficeLocationUpdate(BaseModel):
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    radius_meters: int | None = None
    is_active: bool | None = None


class OfficeLocationOut(BaseModel):
    id: UUID
    name: str
    latitude: float
    longitude: float
    radius_meters: int
    is_active: bool

    model_config = {"from_attributes": True}


class AttendanceRuleUpdate(BaseModel):
    work_start_time: str = "09:00"
    work_end_time: str = "18:00"
    late_threshold_minutes: int = 15
    half_day_threshold_hours: float = 4.0
    standard_hours: float = 8.0
    working_days: list[int] = [1, 2, 3, 4, 5]


class CheckInRequest(BaseModel):
    face_image: str
    latitude: float
    longitude: float
    accuracy: float | None = None
    device_info: dict | None = None


class CheckOutRequest(BaseModel):
    face_image: str
    latitude: float
    longitude: float
    device_info: dict | None = None


class AttendanceRecordOut(BaseModel):
    id: UUID
    date: str
    check_in_at: str | None
    check_out_at: str | None
    status: str
    working_minutes: int | None
    face_verified: bool | None
    geo_verified: bool | None

    model_config = {"from_attributes": True}


class LeaveCreate(BaseModel):
    leave_type: str
    start_date: str
    end_date: str
    reason: str


class TrainingCreate(BaseModel):
    title: str
    description: str | None = None
    trainer_name: str | None = None
    materials_url: str | None = None


class FeedbackCreate(BaseModel):
    session_id: UUID
    trainer_rating: int = Field(ge=1, le=5)
    content_rating: int = Field(ge=1, le=5)
    practical_rating: int = Field(ge=1, le=5)
    suggestions: str | None = None


class FeedbackQuestionDef(BaseModel):
    id: str
    type: str = Field(pattern="^(rating|text|choice)$")
    label: str
    required: bool = True
    options: list[str] | None = None


class FeedbackFormCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    questions: list[FeedbackQuestionDef] = Field(min_length=1)


class FeedbackFormUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    questions: list[FeedbackQuestionDef] | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class FeedbackFormSubmit(BaseModel):
    answers: dict[str, str | int | float]


class FeedbackFormOut(BaseModel):
    id: UUID
    title: str
    description: str | None
    questions: list
    is_active: bool
    response_count: int = 0
    created_at: str | None = None

    model_config = {"from_attributes": True}


class FaceEnrollRequest(BaseModel):
    front: str
    left: str
    right: str
    up: str
    down: str


class AttendanceRuleOut(BaseModel):
    work_start_time: str
    work_end_time: str
    late_threshold_minutes: int
    half_day_threshold_hours: float
    standard_hours: float
    working_days: list[int]
    timezone: str = "Asia/Kolkata"
    late_after_time: str = "09:15"
    check_in_opens_at: str = "08:00"
    check_in_early_buffer_minutes: int = 60
