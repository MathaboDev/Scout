from django.urls import path

from . import views

urlpatterns = [
    # student
    path("", views.student_opportunities, name="opportunity-list"),
    path("<int:opportunity_id>/", views.student_opportunity_detail, name="opportunity-detail"),
    # provider
    path("provider/listings/", views.provider_listings, name="provider-listings"),
    path(
        "provider/listings/<int:opportunity_id>/",
        views.provider_listing_detail,
        name="provider-listing-detail",
    ),
]

