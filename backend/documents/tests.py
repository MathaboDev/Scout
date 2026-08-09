from django.test import TestCase

# Create your tests here.
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db import connection

user = User.objects.create_user(username="test_student", password="TempPass123!")
token = Token.objects.create(user=user)
print(token.key)

with connection.cursor() as cursor:
    cursor.execute(
        "INSERT INTO student (firstname, lastname, email, authuserid) VALUES (%s, %s, %s, %s)",
        ["Test", "Student", "test.student@example.com", user.id],
    )