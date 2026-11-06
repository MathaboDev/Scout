from django.urls import path

from . import views

urlpatterns = [
    path("listings/pending/", views.pending_listings, name="admin-pending-listings"),
    path("listings/<int:opportunity_id>/verify/", views.verify_listing, name="admin-verify-listing"),
    path("activity/", views.activity, name="admin-activity"),
]
