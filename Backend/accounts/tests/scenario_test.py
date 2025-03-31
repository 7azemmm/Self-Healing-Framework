from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import Scenarios, CustomUser, Project

### pre-requisite for this testcase : need to create auth user to make project to can be able to add scenario to it

### goal : scenario added to project successfully

class ScenarioAPITestCase(APITestCase):  
    def setUp(self):
        """Setup test user, authentication, and project"""
        
        self.user = CustomUser.objects.create_user(
            email="test@example.com", password="Test@1234", full_name="Test User"
        )
        
        self.access_token = str(AccessToken.for_user(self.user))

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        self.project = Project.objects.create(project_name="Test Project", user=self.user)
    
    def test_scenario_api(self):
        url = reverse("scenario")  

        test_data = {
            "bdd": "Given user is on the login page\nWhen user enters credentials\nThen user should be logged in",
            "links": "http://127.0.0.1:5500/examples/html/login.html",
            "project_id": self.project.project_id,
            "mapping_file": []
        }       

        response = self.client.post(url, test_data, format="json")  
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, "Added Successfully")

        scenario_obj = Scenarios.objects.get(project_id=self.project.project_id)
        self.assertIsNotNone(scenario_obj)
        self.assertIsInstance(scenario_obj.mapping_file, list)
        self.assertGreater(len(scenario_obj.mapping_file), 0)
