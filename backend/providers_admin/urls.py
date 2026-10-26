from django.urls import path
from .views import ProviderOpportunityListView, ProviderOpportunityDetailView, ProviderApplicantsView

urlpatterns = [
    path("providers/opportunities/", ProviderOpportunityListView.as_view(), name="provider-opportunity-list"),
    path("providers/opportunities/<int:opportunity_id>/", ProviderOpportunityDetailView.as_view(), name="provider-opportunity-detail"),
    path("providers/opportunities/<int:opportunity_id>/applicants/", ProviderApplicantsView.as_view(), name="provider-applicants"),
]

# In scout_backend/urls.py, alongside your other app includes:
#   path("api/", include("opportunities.urls")),
#   path("api/", include("providers_admin.urls")),