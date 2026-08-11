from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Profile, Student


class StudentProfileEndpointTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="teststudent",
            password="TestPassword123!",
        )

        self.token = Token.objects.create(
            user=self.user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

    def test_profile_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(
            "/api/students/profile/"
        )

        self.assertEqual(response.status_code, 401)