from django.urls import path

from . import views

urlpatterns = [
    # FR3 / FR4: assisted apply
    path("review/", views.review_application, name="review-application"),
    path("confirm/", views.confirm_application, name="confirm-application"),
    # FR5 / FR6: student dashboard
    path("mine/", views.my_applications, name="my-applications"),
    path("mine/summary/", views.application_summary, name="application-summary"),
    path("mine/summary/pdf/", views.application_summary_pdf, name="application-summary-pdf"),
    path("mine/<int:application_id>/receipt/", views.application_receipt, name="application-receipt"),
    # FR7: bookmarks
    path("bookmarks/", views.bookmarks, name="bookmarks"),
    path("bookmarks/<int:opportunity_id>/", views.remove_bookmark, name="remove-bookmark"),
    # FR10: provider
    path(
        "provider/listings/<int:opportunity_id>/applicants/",
        views.listing_applicants,
        name="listing-applicants",
    ),
    path(
        "provider/applicants/<int:application_id>/",
        views.applicant_detail,
        name="applicant-detail",
    ),
]

