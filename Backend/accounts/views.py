# accounts/views.py
from rest_framework import generics, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model  # Import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer,ProjectSerializer,ScenarioSerializer
from .controllers.mapping import MappingProcessor
from .models import Project,Scenarios
from .controllers.bdd_processor import process_bdd
from .controllers.html_processor import process_html
from .controllers.mapping import map_bdd_to_html
from .controllers.heal import SelfHealingFramework

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
    uploaded_file = request.FILES.get('bdd')
    binary_data = uploaded_file.read()
    bdd = binary_data.decode('utf-8')
    uploaded_file = request.FILES.get('test_script')
    binary_data = uploaded_file.read()
    test_script = binary_data.decode('utf-8')
    project_id = data.get('project_id')
    output = processor.process(bdd,test_script)
    Scenarios.objects.create(
            project_id=project_id, 
            mapping_file=output
        )
    return Response("Added Successfully")

@api_view(['POST'])
def healing(request):
    data = request.data
    mapping = data.get('mapping')
    header = mapping[0]
    result = [dict(zip(header, row)) for row in mapping[1:]]
    framework = SelfHealingFramework(result)
    framework.start_browser()
    try:
        framework.driver.get(mapping[1][1])
        framework.execute_all_steps(delay=0.0)
        return Response(framework.report())
    finally:
        framework.close()


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



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Project

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project(request):
    """
    Create a new project associated with the authenticated user.
    """
    data = request.data
    Response({"message": request.user.id,})
                
    try:
        project = Project.objects.create(
            project_name=data.get('project_name'), 
            user_id=request.user.id
        )

        return Response(
            {
                "message": "Project created successfully",
                "project": {
                    "id": project.project_id,
                    "name": project.project_name,
                    "created_at": project.created_at,
                }
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {"error": "Error creating project: " + str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
def get_projects(request):
    projects = Project.objects.all()
    return Response(ProjectSerializer(projects,many=True).data)