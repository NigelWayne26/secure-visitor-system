from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Employee, Visitor, Visit, VisitorPass


class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Employee Link', {'fields': ('role', 'employee')}),
    )
    list_display = ('username', 'email', 'role', 'is_staff')


admin.site.register(User, UserAdmin)
admin.site.register(Employee)
admin.site.register(Visitor)
admin.site.register(Visit)
admin.site.register(VisitorPass)