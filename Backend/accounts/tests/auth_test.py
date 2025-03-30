from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

class AuthTestCase(APITestCase):
    def setUp(self):
        self.signup_url = "http://localhost:8000/api/signup/"  
        self.login_url = "http://localhost:8000/api/login/"  

       
        self.user = get_user_model().objects.create_user(
            email="hazem@yahoo.com",
            password="AnyThing@123",
            full_name="hazem"
        )

    def test_user_signup(self):
        data = {"full_name": "ali", "email": "ali@yahoo.com", "password": "ALi@123"}
        response = self.client.post(self.signup_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_login_successful(self):
        data = {"email": "hazem@yahoo.com", "password": "AnyThing@123"}
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_login_invalid_credentials(self):
        """Test if login fails with incorrect credentials"""
        data = {"email": "hazem123@yahoo.com", "password": "1234567"}
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


