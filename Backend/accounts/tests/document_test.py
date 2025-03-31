from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import Project, Scenarios, CustomUser
from accounts.controllers.mapping import MappingProcessor


### pre-requisite for this testcase : need to create auth user to make project to can be able to add docs to it

### goal : docs added to project successfully

class DocumentsAPITestCase(APITestCase):
    
    def setUp(self):
        """Setup test user, authentication, and project"""
        # Create test user
        self.user = CustomUser.objects.create_user(
            email="test@example.com", password="Test@1234", full_name="Test User"
        )
        
        
        self.access_token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        self.project = Project.objects.create(project_name="Test Project", user=self.user)

        self.url = '/api/documents/'  

    @patch.object(MappingProcessor, 'process_all_features', return_value=['mapping_result.json'])
    def test_documents_api(self, mock_process):
        """Test successful submission of BDD and test script files"""
        # file uploads
        bdd_file = SimpleUploadedFile("bdd_feature.feature", b"Feature: Sample feature")
        test_script_file = SimpleUploadedFile("test_script.py", b"print('Test Script')")

        # request payload
        data = {
            'project_id': 1,
            'bdd_feature': bdd_file,
            'test_script_.py': test_script_file
        }

        
        response = self.client.post(self.url, data, format='multipart')

      
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, "Added Successfully")

        # Ensure the mock method was called
        mock_process.assert_called_once()

        # Verify scenario is created
        self.assertEqual(Scenarios.objects.count(), 1)

    