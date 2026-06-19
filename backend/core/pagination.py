from rest_framework.pagination import CursorPagination, PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "size"
    max_page_size = 100


class CommentPagination(CursorPagination):
    page_size = 20
    page_size_query_param = "size"
    max_page_size = 50
    ordering = "-id"


class ActivityPagination(CursorPagination):
    page_size = 32
    page_size_query_param = "size"
    max_page_size = 100
    ordering = "-id"
