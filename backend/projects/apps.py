from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    name = "projects"

    def ready(self):
        import projects.signals  # noqa: F401 — connects signal handlers
