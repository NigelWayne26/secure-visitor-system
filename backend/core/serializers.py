from datetime import datetime
from django.utils import timezone
from rest_framework import serializers
from .models import Visitor, Visit, Employee, VisitorPass


class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = ['id', 'full_name', 'id_number', 'phone', 'email']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'department', 'position', 'email', 'phone']


class VisitSerializer(serializers.ModelSerializer):
    visitor_detail = VisitorSerializer(source='visitor', read_only=True)
    host_employee_detail = EmployeeSerializer(source='host_employee', read_only=True)
    has_pass = serializers.SerializerMethodField()

    class Meta:
        model = Visit
        fields = [
            'id', 'visitor', 'visitor_detail', 'host_employee', 'host_employee_detail',
            'purpose', 'expected_date', 'expected_time', 'is_group_visit', 'status',
            'check_in_time', 'check_out_time', 'checked_in_by', 'checked_out_by',
            'has_pass',
        ]
        read_only_fields = ['status', 'check_in_time', 'check_out_time', 'checked_in_by', 'checked_out_by']

    def get_has_pass(self, obj):
        return hasattr(obj, 'visitor_pass')

    def validate(self, data):
        expected_date = data.get('expected_date', getattr(self.instance, 'expected_date', None))
        expected_time = data.get('expected_time', getattr(self.instance, 'expected_time', None))
        host_employee = data.get('host_employee', getattr(self.instance, 'host_employee', None))
        is_group_visit = data.get('is_group_visit', getattr(self.instance, 'is_group_visit', False))

        if expected_date and expected_time:
            expected_datetime = timezone.make_aware(datetime.combine(expected_date, expected_time))
            if expected_datetime < timezone.now():
                raise serializers.ValidationError(
                    {"expected_date": "Cannot schedule a visit in the past."}
                )

        if expected_date and expected_time and host_employee and not is_group_visit:
            conflicting_visits = Visit.objects.filter(
                host_employee=host_employee,
                expected_date=expected_date,
                expected_time=expected_time,
            ).exclude(status=Visit.Status.CANCELLED)

            if self.instance:
                conflicting_visits = conflicting_visits.exclude(pk=self.instance.pk)

            if conflicting_visits.exists():
                raise serializers.ValidationError(
                    {
                        "expected_time": (
                            "This host already has a visit scheduled at this exact date and time. "
                            "If multiple visitors are meant to see them together, check 'is_group_visit'."
                        )
                    }
                )

        return data


class VisitorPassSerializer(serializers.ModelSerializer):
    visit_detail = VisitSerializer(source='visit', read_only=True)

    class Meta:
        model = VisitorPass
        fields = ['id', 'visit', 'visit_detail', 'token', 'is_used', 'expires_at', 'created_at']
        read_only_fields = ['token', 'is_used', 'created_at']