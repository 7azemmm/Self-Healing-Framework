# accounts/views.py
from rest_framework import generics, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model  # Import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer,ProjectSerializer
from .controllers.mapping import MappingProcessor
from .models import Project
import csv
from .controllers.bdd_processor import process_bdd
from .controllers.html_processor import process_html
from .controllers.mapping import map_bdd_to_html


User = get_user_model()  # Get the custom user model

def get_attribute_simple(attributes, key):
    value = attributes.get(key)
    if value is None:
        return "N/A"
    if isinstance(value, list):
        return ", ".join(value) if value else "N/A"
    return str(value)


class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()  # Use the custom user model
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
def get_user(self):
    users = User.objects.all() 
    return Response(UserSerializer(users,many=True).data)

@api_view(['POST'])
def documents(request):
    data = request.data
    processor = MappingProcessor()
    bdd = data.get('bdd')
    test_script = data.get('test_script')
    output = processor.process(bdd,test_script)
    return Response(output)

@api_view(['POST'])
def scenario(request):
    data = request.data
    bdd = data.get('bdd') 
    links = data.get('links')
    print("Starting the script...")

    print("Processing BDD scenario...")
    bdd_scenario = process_bdd(bdd)
    print("BDD scenario processed.")

    print("Processing HTML pages...")
    html_pages = process_html(links.split("\n"))
    print("HTML pages processed.")

    print("Performing mapping...")
    mappings = map_bdd_to_html(bdd_scenario, html_pages)
    print("Mapping completed.")

    print("Writing results to CSV...")
    response = [[
        "Step", "Page", "ID", "Class", "Name", "Value",
        "XPath (Absolute)", "XPath (Relative)", "CSS Selector"
    ]]
    for match in mappings:
        response.append([
            match["step"],  # Step
            match["page"],  # Page
            get_attribute_simple(match["element"]["attributes"], "id"),  # ID
            get_attribute_simple(match["element"]["attributes"], "class"),  # Class
            get_attribute_simple(match["element"]["attributes"], "name"),  # Name
            get_attribute_simple(match["element"]["attributes"], "value"),  # Value
            get_attribute_simple(match["element"]["attributes"], "xpath_absolute"),  # XPath (Absolute)
            get_attribute_simple(match["element"]["attributes"], "xpath_relative"),  # XPath (Relative)
            get_attribute_simple(match["element"]["attributes"], "css_selector"),  # CSS Selector
        ])

    return Response(response)



@api_view(['POST'])
def create_project(request):
    data = request.data
    project = Project.objects.create(name=data.get('name'),description=data.get('description'))
    return Response({"message":"Project created successfully"})

@api_view(['GET'])
def get_projects(request):
    projects = Project.objects.all()
    return Response(ProjectSerializer(projects,many=True).data)