import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class Employee(models.Model):
    full_name = models.CharField(max_length=150)
    department = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.full_name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        SECURITY_OFFICER = 'security_officer', 'Security Officer'
        RECEPTIONIST = 'receptionist', 'Receptionist'
        EMPLOYEE = 'employee', 'Employee'

    role = models.CharField(max_length=20, choices=Role.choices)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class Visitor(models.Model):
    full_name = models.CharField(max_length=150)
    id_number = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)

    def __str__(self):
        return self.full_name


class Visit(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        CHECKED_IN = 'checked_in', 'Checked In'
        CHECKED_OUT = 'checked_out', 'Checked Out'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'

    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='visits')
    host_employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='hosted_visits')
    purpose = models.CharField(max_length=255)
    expected_date = models.DateField()
    expected_time = models.TimeField()
    is_group_visit = models.BooleanField(
        default=False,
        help_text="Check this if multiple visitors are intentionally scheduled to see this host at the same time."
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits_checked_in'
    )
    checked_out_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits_checked_out'
    )

    def __str__(self):
        return f"Visit: {self.visitor.full_name} -> {self.host_employee.full_name} ({self.status})"


class VisitorPass(models.Model):
    visit = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name='visitor_pass')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pass for {self.visit} ({'used' if self.is_used else 'active'})"