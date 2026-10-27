from django.urls import path

from . import views

urlpatterns = [
    path("", views.list_notifications, name="notification-list"),
    path("read-all/", views.mark_all_read, name="notification-read-all"),
    path("<int:notification_id>/read/", views.mark_read, name="notification-read"),
]

