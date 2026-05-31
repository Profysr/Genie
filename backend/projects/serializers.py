from rest_framework import serializers
from .models import Project, TaskStatus, Task, SubTask, TaskComment
from accounts.serializers import UserSerializer


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = ["id", "name", "color", "order"]


class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ["id", "title", "is_done", "order"]


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ["id", "author", "body", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    status_detail = TaskStatusSerializer(source="status", read_only=True)
    status_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    subtask_count = serializers.SerializerMethodField()
    done_subtask_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "priority", "order", "due_date",
            "status_id", "status_detail",
            "assignee_id", "assignee",
            "created_by", "created_at", "updated_at",
            "subtask_count", "done_subtask_count", "comment_count",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_done_subtask_count(self, obj):
        return obj.subtasks.filter(is_done=True).count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class TaskDetailSerializer(TaskSerializer):
    """Full task with subtasks and comments — used in the task detail panel."""
    subtasks = SubTaskSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)

    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ["subtasks", "comments"]


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    statuses = TaskStatusSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "name", "description", "status", "created_by", "statuses", "task_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_by", "statuses", "created_at", "updated_at"]

    def get_task_count(self, obj):
        return obj.tasks.count()

    def create(self, validated_data):
        request = self.context["request"]
        workspace = self.context["workspace"]
        project = Project.objects.create(
            workspace=workspace,
            created_by=request.user,
            **validated_data,
        )
        # Create default Kanban columns
        defaults = [
            {"name": "Backlog", "color": "#94a3b8", "order": 0},
            {"name": "In Progress", "color": "#6366f1", "order": 1},
            {"name": "In Review", "color": "#f59e0b", "order": 2},
            {"name": "Done", "color": "#22c55e", "order": 3},
        ]
        TaskStatus.objects.bulk_create([
            TaskStatus(project=project, **s) for s in defaults
        ])
        return project
