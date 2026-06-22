from rest_framework import serializers

from accounts.serializers import MiniUserSerializer
from workspaces.models import WorkspaceMember
from .models import Department, DepartmentMember, JobTitle, OrgProfile, ReportingLine, Team, TeamMember


class JobTitleSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = JobTitle
        fields = ["id", "name", "level", "created_at"]
        read_only_fields = ["id", "created_at"]


class MiniJobTitleSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = JobTitle
        fields = ["id", "name", "level"]


class MiniDepartmentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "identifier", "color"]


class MiniMemberSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    user = MiniUserSerializer(read_only=True)

    class Meta:
        from workspaces.models import WorkspaceMember
        model = WorkspaceMember
        fields = ["id", "user", "role"]


class DepartmentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    head = MiniMemberSerializer(read_only=True)
    head_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    parent = MiniDepartmentSerializer(read_only=True)
    parent_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id", "name", "description", "color", "identifier",
            "parent", "parent_id", "head", "head_id",
            "member_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_member_count(self, obj):
        return len(obj.memberships.all())

    def create(self, validated_data):
        validated_data["workspace"] = self.context["workspace"]
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class DepartmentMemberSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    member = MiniMemberSerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    is_head = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentMember
        fields = ["id", "member", "member_id", "is_head", "joined_at"]
        read_only_fields = ["id", "joined_at"]

    def get_is_head(self, obj):
        # Derived from Department.head — single source of truth. Prefer the context
        # department (set by list/create views) to avoid a per-row FK fetch.
        dept = self.context.get("department") or obj.department
        return dept.head_id == obj.member_id

    def create(self, validated_data):
        validated_data["department"] = self.context["department"]
        return super().create(validated_data)


class MiniTeamSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "identifier", "color"]


class TeamSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    lead = MiniMemberSerializer(read_only=True)
    lead_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    department = MiniDepartmentSerializer(read_only=True)
    department_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id", "name", "description", "color", "identifier",
            "department", "department_id", "lead", "lead_id",
            "member_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_member_count(self, obj):
        return len(obj.memberships.all())

    def create(self, validated_data):
        validated_data["workspace"] = self.context["workspace"]
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class TeamMemberSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    member = MiniMemberSerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    is_lead = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ["id", "member", "member_id", "is_lead", "joined_at"]
        read_only_fields = ["id", "joined_at"]

    def get_is_lead(self, obj):
        # Derived from Team.lead — single source of truth. Prefer the context team
        # (set by list/create views) to avoid a per-row FK fetch.
        team = self.context.get("team") or obj.team
        return team.lead_id == obj.member_id

    def create(self, validated_data):
        validated_data["team"] = self.context["team"]
        return super().create(validated_data)


class OrgProfileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    job_title = MiniJobTitleSerializer(read_only=True)
    job_title_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    departments = serializers.SerializerMethodField()
    teams = serializers.SerializerMethodField()
    manager = serializers.SerializerMethodField()
    direct_reports_count = serializers.SerializerMethodField()

    class Meta:
        model = OrgProfile
        fields = [
            "id", "job_title", "job_title_id", "employment_type",
            "employee_id", "start_date", "location", "bio",
            "departments", "teams", "manager", "direct_reports_count",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at", "departments", "teams", "manager", "direct_reports_count"]

    def get_departments(self, obj):
        from .models import DepartmentMember
        memberships = DepartmentMember.objects.filter(member=obj.member).select_related("department")
        return [{"id": str(dm.department.id), "name": dm.department.name, "color": dm.department.color} for dm in memberships]

    def get_teams(self, obj):
        from .models import TeamMember
        memberships = TeamMember.objects.filter(member=obj.member).select_related("team")
        return [{"id": str(tm.team.id), "name": tm.team.name, "color": tm.team.color} for tm in memberships]

    def get_manager(self, obj):
        from .models import ReportingLine
        line = ReportingLine.objects.filter(report=obj.member).select_related("manager", "manager__user").first()
        if not line:
            return None
        mgr = line.manager
        return {"id": str(mgr.id), "name": mgr.user.full_name, "email": mgr.user.email}

    def get_direct_reports_count(self, obj):
        from .models import ReportingLine
        return ReportingLine.objects.filter(manager=obj.member).count()


class ReportingLineSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    manager = MiniMemberSerializer(read_only=True)
    report = MiniMemberSerializer(read_only=True)
    manager_id = serializers.UUIDField(write_only=True)
    report_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ReportingLine
        fields = ["id", "manager", "manager_id", "report", "report_id", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        workspace = self.context["workspace"]
        manager_id = attrs["manager_id"]
        report_id = attrs["report_id"]

        if manager_id == report_id:
            raise serializers.ValidationError("A member cannot report to themselves.")

        # Both endpoints must be members of this workspace.
        valid_ids = set(
            WorkspaceMember.objects.filter(
                workspace=workspace, id__in=[manager_id, report_id]
            ).values_list("id", flat=True)
        )
        if manager_id not in valid_ids:
            raise serializers.ValidationError({"manager_id": "Not a member of this workspace."})
        if report_id not in valid_ids:
            raise serializers.ValidationError({"report_id": "Not a member of this workspace."})

        # Adding manager → report closes a cycle iff `report` is already an ancestor
        # of `manager`. Walk up manager's chain (unique_together on report makes it a
        # simple chain); the `seen` guard also breaks any pre-existing bad cycle.
        current = manager_id
        seen = set()
        while current is not None and current not in seen:
            seen.add(current)
            if current == report_id:
                raise serializers.ValidationError("This reporting line would create a cycle.")
            current = (
                ReportingLine.objects.filter(workspace=workspace, report_id=current)
                .values_list("manager_id", flat=True)
                .first()
            )
        return attrs

    def create(self, validated_data):
        validated_data["workspace"] = self.context["workspace"]
        return super().create(validated_data)
