from django.urls import path
from .views import MeView, EmailVerifiedCheckView
from .social_views import GoogleLogin

urlpatterns = [
    path("users/me/", MeView.as_view(), name="me"),
    path("auth/google/", GoogleLogin.as_view(), name="google-login"),
    path("auth/email-verified/", EmailVerifiedCheckView.as_view(), name="email-verified-check"),
]
