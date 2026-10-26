from django.urls import path
from .views import OpportunityBrowseView

urlpatterns = [
    path("opportunities/", OpportunityBrowseView.as_view(), name="opportunity-browse"),
]