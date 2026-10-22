from django.urls import path
from .views import review_application, confirm_application


urlpatterns = [
    path("review/", review_application, name="review-application"),
    path("confirm/", confirm_application, name="confirm-application"),
]