
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import Project  


### pre-requisite for this testcase : need to create auth user to create project

### goal : test creating project in both successfull and failure scenario
User = get_user_model()

class ProjectTestCase(APITestCase):
    def setUp(self):
       
        self.user = User.objects.create_user(
            email="test@example.com", password="Test@1234", full_name="Test User"
        )
        self.access_token = str(AccessToken.for_user(self.user))

        # URL for project creation
        self.create_project_url = reverse("create_project")  

    def test_create_project_success(self):
        """Test project creation with authentication"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        data = {"project_name": "Test Project"}

        response = self.client.post(self.create_project_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("project", response.data)
        self.assertEqual(response.data["project"]["name"], "Test Project")

        
        self.assertTrue(Project.objects.filter(project_name="Test Project").exists())

    def test_create_project_unauthenticated(self):
        """Test project creation without authentication (should fail)"""
        data = {"project_name": "Unauthorized Project"}
        response = self.client.post(self.create_project_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)  # Ensure error message is returned