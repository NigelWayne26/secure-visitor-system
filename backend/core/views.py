import io
import uuid
from datetime import datetime, timedelta

import qrcode
from django.core.mail import EmailMessage
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response

from .permissions import IsAdmin
from .models import Visitor, Visit, Employee, VisitorPass
from .serializers import VisitorSerializer, VisitSerializer, EmployeeSerializer, VisitorPassSerializer


class IsAdminOrReceptionist(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ['admin', 'receptionist']
        )


class IsSecurityOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role == 'security_officer'
        )


def _get_valid_pass_or_error(token):
    """
    Shared validation logic used by both verify_pass and check_in.
    Returns (visitor_pass, None) on success, or (None, Response) on failure.
    """
    if not token:
        return None, Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token_uuid = uuid.UUID(str(token))
    except ValueError:
        return None, Response({"valid": False, "reason": "Malformed token."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        visitor_pass = VisitorPass.objects.select_related('visit', 'visit__visitor', 'visit__host_employee').get(
            token=token_uuid
        )
    except VisitorPass.DoesNotExist:
        return None, Response({"valid": False, "reason": "Pass not found."}, status=status.HTTP_404_NOT_FOUND)

    if visitor_pass.is_used:
        return None, Response(
            {"valid": False, "reason": "Pass has already been used."}, status=status.HTTP_400_BAD_REQUEST
        )

    if timezone.now() > visitor_pass.expires_at:
        return None, Response({"valid": False, "reason": "Pass has expired."}, status=status.HTTP_400_BAD_REQUEST)

    if visitor_pass.visit.status != Visit.Status.SCHEDULED:
        return None, Response(
            {"valid": False, "reason": f"Visit status is '{visitor_pass.visit.status}', not scheduled."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return visitor_pass, None


def _send_pass_email(visitor_pass):
    """
    Emails the QR pass image to the visitor, if they have an email on file.
    Returns True if an email was sent, False if skipped (no email on file).
    Does not raise on failure - logs to console via Django's email backend.
    """
    visit = visitor_pass.visit
    visitor = visit.visitor

    if not visitor.email:
        return False

    token_str = str(visitor_pass.token)
    img = qrcode.make(token_str)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    subject = f"Your visitor pass for {visit.expected_date}"
    body = (
        f"Hello {visitor.full_name},\n\n"
        f"Your visit has been scheduled:\n"
        f"Host: {visit.host_employee.full_name}\n"
        f"Purpose: {visit.purpose}\n"
        f"Date: {visit.expected_date}\n"
        f"Time: {visit.expected_time}\n\n"
        f"Please present the attached QR code at the security desk on arrival.\n"
        f"This pass expires: {visitor_pass.expires_at}\n"
    )

    email = EmailMessage(subject=subject, body=body, to=[visitor.email])
    email.attach(f"visitor_pass_{visit.id}.png", buffer.getvalue(), "image/png")
    email.send(fail_silently=True)
    return True


class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all().order_by('-id')
    serializer_class = VisitorSerializer
    permission_classes = [IsAdminOrReceptionist]


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all().order_by('-id')
    serializer_class = VisitSerializer
    permission_classes = [IsAdminOrReceptionist]

    @action(detail=True, methods=['post'], url_path='generate-pass')
    def generate_pass(self, request, pk=None):
        visit = self.get_object()

        if hasattr(visit, 'visitor_pass'):
            return Response(
                {"detail": "A pass already exists for this visit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if visit.status != Visit.Status.SCHEDULED:
            return Response(
                {"detail": f"Cannot generate a pass for a visit with status '{visit.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expires_at = datetime.combine(visit.expected_date, visit.expected_time)
        expires_at = timezone.make_aware(expires_at) + timedelta(hours=24)

        visitor_pass = VisitorPass.objects.create(visit=visit, expires_at=expires_at)
        email_sent = _send_pass_email(visitor_pass)

        serializer = VisitorPassSerializer(visitor_pass)
        response_data = serializer.data
        response_data['email_sent'] = email_sent
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='qr')
    def qr_code(self, request, pk=None):
        visit = self.get_object()

        if not hasattr(visit, 'visitor_pass'):
            return Response({"detail": "No pass exists for this visit yet."}, status=status.HTTP_404_NOT_FOUND)

        token_str = str(visit.visitor_pass.token)
        img = qrcode.make(token_str)
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return HttpResponse(buffer.getvalue(), content_type='image/png')

    @action(detail=True, methods=['post'], url_path='check-out', permission_classes=[IsSecurityOfficer])
    def check_out(self, request, pk=None):
        visit = self.get_object()

        if visit.status != Visit.Status.CHECKED_IN:
            return Response(
                {"detail": f"Cannot check out a visit with status '{visit.status}'. Visitor must be checked in first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        visit.status = Visit.Status.CHECKED_OUT
        visit.check_out_time = timezone.now()
        visit.checked_out_by = request.user
        visit.save()

        serializer = VisitSerializer(visit)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='currently-inside', permission_classes=[IsSecurityOfficer])
    def currently_inside(self, request):
        visits = Visit.objects.filter(status=Visit.Status.CHECKED_IN).order_by('-check_in_time')
        serializer = VisitSerializer(visits, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('full_name')
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsSecurityOfficer])
def verify_pass(request):
    token = request.data.get('token')
    visitor_pass, error_response = _get_valid_pass_or_error(token)
    if error_response:
        return error_response

    serializer = VisitorPassSerializer(visitor_pass)
    return Response({"valid": True, "pass": serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsSecurityOfficer])
def check_in(request):
    token = request.data.get('token')
    visitor_pass, error_response = _get_valid_pass_or_error(token)
    if error_response:
        return error_response

    visit = visitor_pass.visit
    visitor_pass.is_used = True
    visitor_pass.save()

    visit.status = Visit.Status.CHECKED_IN
    visit.check_in_time = timezone.now()
    visit.checked_in_by = request.user
    visit.save()

    serializer = VisitSerializer(visit)
    return Response({"success": True, "visit": serializer.data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_only_test(request):
    return Response({"message": f"Hello {request.user.username}, you are an admin."})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_summary(request):
    user = request.user
    role = user.role
    today = timezone.localdate()

    if role == 'admin':
        data = {
            "role": "admin",
            "total_visitors": Visitor.objects.count(),
            "todays_visits": Visit.objects.filter(expected_date=today).count(),
            "active_visitors": Visit.objects.filter(status=Visit.Status.CHECKED_IN).count(),
            "completed_visits": Visit.objects.filter(status=Visit.Status.CHECKED_OUT).count(),
        }

    elif role == 'receptionist':
        todays_visits = Visit.objects.filter(expected_date=today).order_by('expected_time')
        recent_visitors = Visitor.objects.all().order_by('-id')[:5]
        active_visits = Visit.objects.filter(status=Visit.Status.CHECKED_IN)
        data = {
            "role": "receptionist",
            "todays_visits": VisitSerializer(todays_visits, many=True).data,
            "recent_visitors": VisitorSerializer(recent_visitors, many=True).data,
            "active_visits_count": active_visits.count(),
        }

    elif role == 'security_officer':
        currently_inside = Visit.objects.filter(status=Visit.Status.CHECKED_IN)
        todays_checkins = Visit.objects.filter(check_in_time__date=today)
        todays_checkouts = Visit.objects.filter(check_out_time__date=today)
        pending_verification = Visit.objects.filter(status=Visit.Status.SCHEDULED, expected_date=today)
        data = {
            "role": "security_officer",
            "currently_inside_count": currently_inside.count(),
            "todays_checkins_count": todays_checkins.count(),
            "todays_checkouts_count": todays_checkouts.count(),
            "pending_verification_count": pending_verification.count(),
        }

    elif role == 'employee':
        if user.employee:
            their_visits = Visit.objects.filter(host_employee=user.employee).order_by('-expected_date')
            data = {
                "role": "employee",
                "profile": EmployeeSerializer(user.employee).data,
                "their_visitors": VisitSerializer(their_visits, many=True).data,
            }
        else:
            data = {
                "role": "employee",
                "profile": None,
                "their_visitors": [],
                "detail": "This account is not linked to an Employee record.",
            }

    else:
        data = {"role": role, "detail": "No dashboard defined for this role."}

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminOrReceptionist])
def visit_report(request):
    period = request.query_params.get('period', 'daily')
    today = timezone.localdate()

    if period == 'daily':
        start_date = today
    elif period == 'weekly':
        start_date = today - timedelta(days=7)
    elif period == 'monthly':
        start_date = today - timedelta(days=30)
    else:
        return Response(
            {"detail": "Invalid period. Use 'daily', 'weekly', or 'monthly'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    visits = Visit.objects.filter(expected_date__gte=start_date, expected_date__lte=today).order_by('-expected_date')

    data = {
        "period": period,
        "start_date": str(start_date),
        "end_date": str(today),
        "total_visits": visits.count(),
        "scheduled": visits.filter(status=Visit.Status.SCHEDULED).count(),
        "checked_in": visits.filter(status=Visit.Status.CHECKED_IN).count(),
        "checked_out": visits.filter(status=Visit.Status.CHECKED_OUT).count(),
        "cancelled": visits.filter(status=Visit.Status.CANCELLED).count(),
        "visits": VisitSerializer(visits, many=True).data,
    }

    return Response(data, status=status.HTTP_200_OK)