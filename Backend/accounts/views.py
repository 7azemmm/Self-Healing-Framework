# accounts/views.py
from rest_framework import generics, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model  # Import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer,ProjectSerializer,ScenarioSerializer,MetricsSerializer
from .controllers.mapping import MappingProcessor
from .models import Project,Scenarios,Metrics,Execution
from .controllers.bdd_processor import process_bdd
from .controllers.html_processor import process_html
from .controllers.mapping import map_bdd_to_html
from .controllers.heal import SelfHealingFramework
import json

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
    project_id = data.get('project_id')
    bdd_files = []
    test_script_files = {}
    for key in request.FILES:
        if key.startswith('bdd_'):
            bdd_files.append((request.FILES[key].name, request.FILES.get(key).read().decode('utf-8')))
        elif key.startswith('test_script_'):
            test_script_files[request.FILES[key].name] = request.FILES.get(key).read().decode('utf-8')
            
        
    outputs = processor.process_all_features(bdd_files,test_script_files)
    for output in outputs:
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


# @api_view(['POST'])
# def scenario(request):
#     data = request.data
#     bdd = data.get('bdd')
#     links = data.get('links')
#     print("Starting the script...")

#     print("Processing BDD scenario...")
#     bdd_scenario = process_bdd(bdd)
#     print("BDD scenario processed.")

#     print("Processing HTML pages...")
#     html_pages = process_html(links.split("\n"))
#     print("HTML pages processed.")

#     print("Performing mapping...")
#     mappings = map_bdd_to_html(bdd_scenario, html_pages)
#     print("Mapping completed.")

#     print("Writing results to CSV...")
#     response = [[
#         "Step", "Page", "ID", "Class", "Name", "Value",
#         "XPath (Absolute)", "XPath (Relative)", "CSS Selector"
#     ]]
#     for match in mappings:
#         response.append([
#             match["step"],
#             match["page"],
#             get_attribute_simple(match["element"]["attributes"], "id"),
#             get_attribute_simple(match["element"]["attributes"], "class"),
#             get_attribute_simple(match["element"]["attributes"], "name"),
#             get_attribute_simple(match["element"]["attributes"], "value"),
#             get_attribute_simple(match["element"]["attributes"], "xpath_absolute"),
#             get_attribute_simple(match["element"]["attributes"], "xpath_relative"),
#             get_attribute_simple(match["element"]["attributes"], "css_selector"),
#         ])
    
#     project_id = data.get('project_id')
#     Scenarios.objects.create(
#             project_id=project_id, 
#             mapping_file=response
#         )

#     return Response("Added Successfully")


@api_view(['POST'])
def scenario(request):
    data = request.data
    bdd = data.get('bdd')
    links = data.get('links')
    project_id = data.get('project_id')

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
            match["step"],
            match["page"],
            get_attribute_simple(match["element"]["attributes"], "id"),
            get_attribute_simple(match["element"]["attributes"], "class"),
            get_attribute_simple(match["element"]["attributes"], "name"),
            get_attribute_simple(match["element"]["attributes"], "value"),
            get_attribute_simple(match["element"]["attributes"], "xpath_absolute"),
            get_attribute_simple(match["element"]["attributes"], "xpath_relative"),
            get_attribute_simple(match["element"]["attributes"], "css_selector"),
        ])
    
   
    scenario_obj, created = Scenarios.objects.get_or_create(project_id=project_id)

   
    if not created:
        existing_mapping = scenario_obj.mapping_file
        if isinstance(existing_mapping, list): 
            existing_mapping.extend(response[1:])  
        else:
            existing_mapping = response  

        scenario_obj.mapping_file = existing_mapping
        scenario_obj.save()
    else:
        scenario_obj.mapping_file = response
        scenario_obj.save()

    return Response("Added Successfully")



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



@api_view(['POST'])
def execute_tests(request):
    data = request.data
    project_id = data.get('project_id')
    execution_name = data.get('execution_name', 'Default Execution')  # Default name if not provided

    # Create a new execution entry
    execution = Execution.objects.create(
        execution_name=execution_name,
        project_id=project_id
    )

    # Get the scenario and execute tests
    scenarios = Scenarios.objects.get(project_id=project_id)
    mapping = scenarios.mapping_file
    header = mapping[0]
    result = [dict(zip(header, row)) for row in mapping[1:]]
    framework = SelfHealingFramework(result)
    framework.start_browser()
    try:
        framework.driver.get(mapping[1][1])
        framework.execute_all_steps(delay=0.0)
        report = framework.report()

        # Parse the report to extract metrics
        # Assuming report is a JSON string; adjust based on actual report structure
        report_data = json.loads(report) if isinstance(report, str) else report
        number_of_scenarios = len(result)  # Example: number of scenario rows in mapping
        number_of_healed_elements = len(report_data) if isinstance(report_data, dict) else 0  # Adjust based on report

        # Save metrics to the Metrics model
        Metrics.objects.create(
            execution=execution,
            number_of_scenarios=number_of_scenarios,
            number_of_healed_elements=number_of_healed_elements
        )

        return Response({"message": report, "success": True})
    finally:
        framework.close()
        
        
@api_view(['GET'])
def get_metrics(request, project_id):
    metrics = Metrics.objects.filter(execution__project_id=project_id)
    serializer = MetricsSerializer(metrics, many=True)
    return Response(serializer.data)