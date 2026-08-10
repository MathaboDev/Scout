"""
scout_backend/urls.py

Top-level URL router. This file does not define feature endpoints itself —
it delegates to each app's own urls.py, so a developer working on
applications/ never needs to touch this file to add a new endpoint under
/api/applications/.

As each teammate builds out their app, they:
  1. Create <app>/urls.py with their app's own urlpatterns.
  2. Uncomment the matching include() line below.

Leaving the not-yet-built ones commented (rather than deleting them) keeps
the intended API shape visible to the whole team from day one, and avoids
Django raising an ImportError on startup for an app whose urls.py doesn't
exist yet.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("admin/", admin.site.urls),

    # DRF's built-in token endpoint: POST {username, password} -> {token}.
    # students/ will likely wrap this with its own register/login views
    # (e.g. to also return profile-completion status), but this gives the
    # team a working auth endpoint to test against immediately.

    #Authentication token endpoint
    path("api/auth/token/", obtain_auth_token, name="api-token-auth"),

    # Uncomment each line once that app has a urls.py:
    #Student endpoints
    path("api/students/", include("students.urls")),
    # path("api/opportunities/", include("opportunities.urls")),
    # path("api/applications/", include("applications.urls")),
    # path("api/notifications/", include("notifications.urls")),
    # path("api/providers-admin/", include("providers_admin.urls")),
]
