# accounts/views.py
from rest_framework import generics, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model  # Import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer,ProjectSerializer,ScenarioSerializer,MetricsSerializer,ProjectMetricsSerializer,ExecutionFlowSerializer,ExecutionFlowSequenceSerializer
from .controllers.mapping import MappingProcessor
from .models import Project,Scenarios,Metrics,Execution,HealedElements,ExecutionFlow,ExecutionFlowSequence
from .controllers.bdd_processor import process_bdd
from .controllers.html_processor import process_html
from .controllers.mapping import map_bdd_to_html
from .controllers.heal import SelfHealingFramework
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Project

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

    # Process uploaded files
    for key in request.FILES:
        if key.startswith('bdd_'):
            bdd_files.append((request.FILES[key].name, request.FILES.get(key).read().decode('utf-8')))
        elif key.startswith('test_script_'):
            test_script_files[request.FILES[key].name] = request.FILES.get(key).read().decode('utf-8')

    # Process BDD and test script files
    outputs = processor.process_all_features(bdd_files, test_script_files)


    # Save the output to the database
    for output in outputs:
        scenario_obj= Scenarios.objects.create(
            project_id=project_id,
            mapping_file=output
        )
        scenario_obj.save()

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
    
   
    scenario_obj = Scenarios.objects.create(project_id=project_id ,  mapping_file=response)
    scenario_obj.save()

    return Response("Added Successfully")


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
    """
    Execute tests endpoint with full healing report compatibility.
    Returns standardized response for frontend consumption.
    """
    # Request validation
    data = request.data
    execution_flow_id = data.get('execution_flow_id')
    execution_name = data.get('execution_name', 'Default Execution')

    if not execution_flow_id:
        return Response({
            "success": False,
            "message": "execution_flow_id is required",
            "healed_elements": [],
            "broken_elements": [],
            "metrics": {
                "total_scenarios": 0,
                "healed_count": 0,
                "broken_count": 0
            }
        }, status=400)

    try:
        execution = Execution.objects.create(
            execution_name=execution_name,
            project_id=1,
        )

        try:
            flow = ExecutionFlow.objects.get(id=execution_flow_id)
            flow_lines = ExecutionFlowSequence.objects.filter(scenario_sequence=flow)
            scenarios = []
            for item in flow_lines:
                scenarios.append(Scenarios.objects.get(scenario_id=item.scenario_id).mapping_file)

            # scenarios = Scenarios.objects.filter(scenario_id__in=[item.scenario_id for item in flow_lines]).values_list('mapping_file', flat=True)


            if not scenarios:
                return Response({
                    "success": False,
                    "message": "No scenarios found for the given execution flow",
                    "healed_elements": [],
                    "broken_elements": [],
                    "metrics": {
                        "total_scenarios": 0,
                        "healed_count": 0,
                        "broken_count": 0
                    }
                }, status=404)
            header = scenarios[0][0]
            test_steps = [header]
            print("test_steps")
            for i in range(len(scenarios)):
                for j in range(len(scenarios[i])):
                    if j == 0:
                        continue
                    test_steps.append(scenarios[i][j])
            test_steps = test_steps
            print(test_steps)
            headers = test_steps[0]
            test_steps = [dict(zip(headers, row)) for row in test_steps[1:]]

            scenario_count = sum(1 for row in test_steps if row.get("Step", "").strip().startswith("When"))
        except Scenarios.DoesNotExist:
            return Response({
                "success": False,
                "message": "Scenarios not found for this project",
                "healed_elements": [],
                "broken_elements": [],
                "metrics": {
                    "total_scenarios": 0,
                    "healed_count": 0,
                    "broken_count": 0
                }
            }, status=404)

        framework = SelfHealingFramework(test_steps)
        # framework.scenario_count = scenario_count  # Make sure your framework can store this
        
        try:
            framework.start_browser()
            framework.execute_all_steps(delay=3.5)
            
            report = framework.get_healing_report()
            
            # Store healed elements in database
            # for element in report['healed_elements']:
            #     HealedElements.objects.create(
            #         execution=execution,
            #         past_element_attribute=element['original_element_id'],
            #         new_element_attribute=element['new_strategies'].get('id', ''),
            #         label=True,
            #         created_at=element.get('timestamp'),
                    
            #     )

            # Store metrics
            Metrics.objects.create(
                execution=execution,
                number_of_scenarios=report['metrics']['total_scenarios'],
                number_of_healed_elements=report['metrics']['healed_count'],
            )

            # Finalize execution record
            execution.status = 'COMPLETED' if report['success'] else 'COMPLETED_WITH_ERRORS'
            execution.save()

            # Return standardized response
            return Response({
                "success": report['success'],
                "message": report.get('message', 'Execution completed'),
                "healed_elements": report['healed_elements'],
                "broken_elements": report['broken_elements'],
                "metrics": report['metrics']
            })

        except Exception as e:
            # Framework execution failed
            execution.status = 'FAILED'
            execution.error_message = str(e)
            execution.save()
            
            return Response({
                "success": False,
                "message": f"Test execution failed: {str(e)}",
                "healed_elements": [],
                "broken_elements": [],
                "metrics": {
                    "total_scenarios": scenario_count,
                    "healed_count": 0,
                    "broken_count": 0
                }
            }, status=500)

        finally:
            # Ensure browser is closed
            if hasattr(framework, 'close'):
                framework.close()

    except Exception as e:
        # Top-level failure (setup, etc.)
        return Response({
            "success": False,
            "message": f"Execution setup failed: {str(e)}",
            "healed_elements": [],
            "broken_elements": [],
            "metrics": {
                "total_scenarios": 0,
                "healed_count": 0,
                "broken_count": 0
            }
        }, status=500)

@api_view(['GET'])
def get_metrics(request, project_id):
    metrics = Metrics.objects.filter(execution__project_id=project_id)
    serializer = MetricsSerializer(metrics, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_project_metrics(request, project_id):
    try:
        project = Project.objects.get(project_id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)

    # Fetch executions and related data
    executions = Execution.objects.filter(project=project)
    metrics = Metrics.objects.filter(execution__in=executions).select_related('execution')
    healed_elements = HealedElements.objects.filter(execution__in=executions).select_related('execution')

    # Calculate totals
    total_scenarios = metrics.aggregate(total=Sum('number_of_scenarios'))['total'] or 0
    total_healed_elements = metrics.aggregate(total=Sum('number_of_healed_elements'))['total'] or 0

    # Serialize data
    data = {
        'total_scenarios': total_scenarios,
        'total_healed_elements': total_healed_elements,
        'execution_data': metrics,
        'healed_elements': healed_elements
    }
    serializer = ProjectMetricsSerializer(data)
    return Response(serializer.data, status=200)

@api_view(['GET'])
def get_all_scenarios(request):
    try:
        project_id = request.query_params.get('project_id')
        scenarios = Scenarios.objects.filter(project_id=project_id)
        serializer = ScenarioSerializer(scenarios, many=True)
        return Response(serializer.data, status=200)
    except Scenarios.DoesNotExist:
        return Response({"error": "Scenarios not found"}, status=404)

@api_view(['GET'])
def get_all_executions(request, project_id):
    try:
        executions = Execution.objects.filter(project_id=project_id)
        serializer = MetricsSerializer(executions, many=True)
        return Response(serializer.data, status=200)
    except Execution.DoesNotExist:
        return Response({"error": "Executions not found"}, status=404)

@api_view(['POST'])
def create_execution_flow(request):
    data = request.data
    project_id = data.get('project_id')
    name = data.get('name', 'Default Execution')

    if not project_id:
        return Response({"error": "project_id is required"}, status=400)

    try:
        execution = ExecutionFlow.objects.create(
            name=name,
            project_id=project_id,
        )

        return Response(
            {
                "message": "Execution created successfully",
                "execution": {
                    "name": execution.name,
                    "created_at": execution.created_at,
                }
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {"error": "Error creating execution: " + str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['GET'])
def get_execution_flow(request):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=400)

    try:
        executionFlow = ExecutionFlow.objects.filter(project_id=project_id)
        return Response(ExecutionFlowSerializer(executionFlow,many=True).data ,status=200)
    except Execution.DoesNotExist:
        return Response({"error": "Execution Flow not found"}, status=404)

@api_view(['POST'])
def update_execution_flow_items(request):
    flow_id = request.data.get('flow_id', [])
    try:
        flow = ExecutionFlow.objects.get(id=flow_id)
    except ExecutionFlow.DoesNotExist:
        return Response({"error": "ExecutionFlow not found"}, status=404)

    items = request.data.get('items', [])

    if not isinstance(items, list):
        return Response({"error": "items should be a list"}, status=400)

    ExecutionFlowSequence.objects.filter(scenario_sequence=flow).delete()

    new_items = []
    for item in items:
        scenario_id = item.get('scenario_id')
        sequence = item.get('sequence')

        if not scenario_id or sequence is None:
            continue

        new_items.append(ExecutionFlowSequence(
            scenario_sequence=flow,
            scenario_id=scenario_id,
            sequence=sequence
        ))

    ExecutionFlowSequence.objects.bulk_create(new_items)

    return Response({"message": "Scenarios updated successfully."}, status=200)

@api_view(['GET'])
def get_execution_flow_items(request):
    flow_id = request.query_params.get('flow_id')
    if not flow_id:
        return Response({"error": "flow_id is required"}, status=400)

    try:
        flow = ExecutionFlow.objects.get(id=flow_id)
        items = ExecutionFlowSequence.objects.filter(scenario_sequence=flow)
        return Response(ExecutionFlowSequenceSerializer(items,many=True).data ,status=200)
    except ExecutionFlow.DoesNotExist:
        return Response({"error": "ExecutionFlow not found"}, status=404)
    except ExecutionFlowSequence.DoesNotExist:
        return Response({"error": "ExecutionFlowSequence not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    