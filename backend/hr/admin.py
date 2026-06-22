from django.contrib import admin
from .models import LeaveBalance, LeavePolicy, LeaveRequest

admin.site.register(LeavePolicy)
admin.site.register(LeaveBalance)
admin.site.register(LeaveRequest)
