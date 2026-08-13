from django.test import TestCase
from rest_framework.test import APIClient


class StudentProfileEndpointTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_profile_requires_authentication(self):
        response = self.client.get(
            "/api/accounts/profile/"
        )

        self.assertEqual(response.status_code, 401)