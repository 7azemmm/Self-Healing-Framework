# accounts/views.py
from rest_framework import generics, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model  # Import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer,ProjectSerializer,ScenarioSerializer,MetricsSerializer,ProjectMetricsSerializer
from .controllers.mapping import MappingProcessor
from .models import Project,Scenarios,Metrics,Execution,HealedElements,ExecutionSequence,SequenceScenario
from .controllers.bdd_processor import process_bdd
from .controllers.html_processor import process_html
from .controllers.mapping import map_bdd_to_html
from .controllers.heal import SelfHealingFramework
import json
from datetime import datetime
from django.db.models import Sum

from . import models
from django.db.models import F



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

# @api_view(['POST'])
# def documents(request):
#     data = request.data
#     processor = MappingProcessor()
#     project_id = data.get('project_id')
#     bdd_files = []
#     test_script_files = {}

#     # Process uploaded files
#     for key in request.FILES:
#         if key.startswith('bdd_'):
#             bdd_files.append((request.FILES[key].name, request.FILES.get(key).read().decode('utf-8')))
#         elif key.startswith('test_script_'):
#             test_script_files[request.FILES[key].name] = request.FILES.get(key).read().decode('utf-8')

#     # Process BDD and test script files
#     outputs = processor.process_all_features(bdd_files, test_script_files)


#     # Save the output to the database
#     for output in outputs:
#         # Use get_or_create to ensure that we don't create duplicate entries
#         scenario_obj,created= Scenarios.objects.get_or_create(
#             project_id=project_id,
#             defaults={"mapping_file": []}
#         )

#         # If the scenario already exists, we add the new output without causing issues
#         print("creeeeeeeeeeeeeeeeeeeeeeeeee")
#         print(created)
#         if not created:
#             existing_mapping = scenario_obj.mapping_file
#             if isinstance(existing_mapping, list):
#                 existing_mapping.extend(output[1:])  # Append new output to the list
#         else:
#             existing_mapping = output  # Convert to a list if it isn't
#         scenario_obj.mapping_file = existing_mapping
#         print(output)
#         scenario_obj.save()

#     return Response("Added Successfully")


@api_view(['POST'])
def documents(request):
    data = request.data
    processor = MappingProcessor()

    project_id = data.get('project_id')
    execution_sequence_number = data.get('execution_sequence_number')

    if not project_id or not execution_sequence_number:
        return Response({"error": "Missing project_id or execution_sequence_number"}, status=400)

    bdd_files = []
    test_script_files = {}

    # Process uploaded files in order
    for key in request.FILES:  # Sort to maintain upload order
        file = request.FILES[key]
        content = file.read().decode('utf-8')
        if key.startswith('bdd_'):
            bdd_files.append((file.name, content))
        elif key.startswith('test_script_'):
            test_script_files[file.name] = content

    # Create ExecutionSequence
    try:
        project = Project.objects.get(project_id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Invalid project_id"}, status=404)

    execution_sequence = ExecutionSequence.objects.create(
        number=execution_sequence_number,
        project=project
    )

    # Process BDD and test script mapping
    outputs = processor.process_all_features(bdd_files, test_script_files)

    for idx, output in enumerate(outputs):
        # Save Scenario
        scenario_obj = Scenarios.objects.create(
            project=project,
            mapping_file=output
        )

        # Add to SequenceScenario with order preserved
        SequenceScenario.objects.create(
            execution_sequence=execution_sequence,
            scenario=scenario_obj,
            order=idx + 1  # 1-based index
        )

    return Response({"message": "Added Successfully", "execution_sequence_id": execution_sequence.execution_sequence_id}, status=201)






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
#     project_id = data.get('project_id')

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
    
   
#     scenario_obj, created = Scenarios.objects.get_or_create(project_id=project_id ,  defaults={"mapping_file": []})

   
#     if not created:
#         existing_mapping = scenario_obj.mapping_file
#         if isinstance(existing_mapping, list): 
#             existing_mapping.extend(response[1:])  
#         else:
#             existing_mapping = response  

#         scenario_obj.mapping_file = existing_mapping
#         scenario_obj.save()
#     else:
#         scenario_obj.mapping_file = response
#         scenario_obj.save()

#     return Response("Added Successfully")


@api_view(['POST'])
def scenario(request):
    data = request.data
    bdd = data.get('bdd')
    links = data.get('links')
    project_id = data.get('project_id')
    execution_sequence_number = data.get('execution_sequence_number')
    order = data.get('order')

    # Validate basic fields
    if not all([bdd, links, project_id]):
        return Response({"error": "Missing bdd, links, or project_id"}, status=400)

    print("Starting the script...")
    print("Processing BDD scenario...")
    bdd_scenario = process_bdd(bdd)
    print("BDD scenario processed.")

    print("Processing HTML pages...")
    clean_links = [link.strip() for link in links.split("\n") if link.strip()]
    html_pages = process_html(clean_links)
    print("HTML pages processed.")

    print("Performing mapping...")
    mappings = map_bdd_to_html(bdd_scenario, html_pages)
    print("Mapping completed.")

    print("Writing results to CSV format...")
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

    try:
        project = Project.objects.get(project_id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Invalid project_id"}, status=404)

    # Get or create the execution sequence
    if execution_sequence_number:
        execution_sequence, _ = ExecutionSequence.objects.get_or_create(
            project=project,
            number=execution_sequence_number
        )
    else:
        # Get the latest sequence number and add 1
        last_sequence = ExecutionSequence.objects.filter(project=project).order_by('-number').first()
        next_sequence_number = last_sequence.number + 1 if last_sequence else 1
        execution_sequence = ExecutionSequence.objects.create(
            project=project,
            number=next_sequence_number
        )

    # Create Scenario object
    scenario_obj = Scenarios.objects.create(
        project=project,
        mapping_file=response
    )

  # Determine the order and shift if necessary
    if order:
     order_value = int(order)

    # Shift existing scenarios at or after this order
     SequenceScenario.objects.filter(
         execution_sequence=execution_sequence,
         order__gte=order_value
     ).update(order=F('order') + 1)

    else:
      last_order = SequenceScenario.objects.filter(
         execution_sequence=execution_sequence
      ).order_by('-order').first()
      order_value = last_order.order + 1 if last_order else 1

     # Create SequenceScenario at the correct order
    SequenceScenario.objects.create(
     execution_sequence=execution_sequence,
     scenario=scenario_obj,
     order=order_value
    )


    return Response({
        "message": "Added Successfully",
        "scenario_id": scenario_obj.scenario_id,
        "execution_sequence_id": execution_sequence.execution_sequence_id,
        "order": order_value
    }, status=201)




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



# @api_view(['POST'])
# def execute_tests(request):
#     """
#     Execute tests endpoint with full healing report compatibility.
#     Returns standardized response for frontend consumption.
#     """
#     # Request validation
#     data = request.data
#     project_id = data.get('project_id')
#     execution_name = data.get('execution_name', 'Default Execution')
#     execution_name = data.get('execution_name', 'Default Execution')

#     if not project_id:
#         return Response({
#             "success": False,
#             "message": "project_id is required",
#             "healed_elements": [],
#             "broken_elements": [],
#             "metrics": {
#                 "total_scenarios": 0,
#                 "healed_count": 0,
#                 "broken_count": 0
#             }
#         }, status=400)

#     try:
#         # Create execution record
#         execution = Execution.objects.create(
#             execution_name=execution_name,
#             project_id=project_id,
#         )

#         # Retrieve scenarios
#         try:
#             scenarios = Scenarios.objects.get(project_id=project_id)
#             mapping = scenarios.mapping_file
#             header = mapping[0]
#             test_steps = [dict(zip(header, row)) for row in mapping[1:]]
            
#             # Count scenarios (steps starting with "When")
#             scenario_count = sum(1 for row in test_steps if row.get("Step", "").strip().startswith("When"))
#         except Scenarios.DoesNotExist:
#             return Response({
#                 "success": False,
#                 "message": "Scenarios not found for this project",
#                 "healed_elements": [],
#                 "broken_elements": [],
#                 "metrics": {
#                     "total_scenarios": 0,
#                     "healed_count": 0,
#                     "broken_count": 0
#                 }
#             }, status=404)

#         # Initialize and execute framework
#         framework = SelfHealingFramework(test_steps)
#         framework.scenario_count = scenario_count  # Make sure your framework can store this
        
#         try:
#             framework.start_browser()
#             framework.execute_all_steps(delay=3.5)
            
#             # Get standardized report
#             report = framework.get_healing_report()
            
#             # Store healed elements in database
#             for element in report['healed_elements']:
#                 HealedElements.objects.create(
#                     execution=execution,
#                     past_element_attribute=element['original_element_id'],
#                     new_element_attribute=element['new_strategies'].get('id', ''),
#                     label=True,
#                     created_at=element.get('timestamp'),
                    
#                 )

#             # Store metrics
#             Metrics.objects.create(
#                 execution=execution,
#                 number_of_scenarios=report['metrics']['total_scenarios'],
#                 number_of_healed_elements=report['metrics']['healed_count'],
#             )

#             # Finalize execution record
#             execution.status = 'COMPLETED' if report['success'] else 'COMPLETED_WITH_ERRORS'
#             execution.save()

#             # Return standardized response
#             return Response({
#                 "success": report['success'],
#                 "message": report.get('message', 'Execution completed'),
#                 "healed_elements": report['healed_elements'],
#                 "broken_elements": report['broken_elements'],
#                 "metrics": report['metrics']
#             })

#         except Exception as e:
#             # Framework execution failed
#             execution.status = 'FAILED'
#             execution.error_message = str(e)
#             execution.save()
            
#             return Response({
#                 "success": False,
#                 "message": f"Test execution failed: {str(e)}",
#                 "healed_elements": [],
#                 "broken_elements": [],
#                 "metrics": {
#                     "total_scenarios": scenario_count,
#                     "healed_count": 0,
#                     "broken_count": 0
#                 }
#             }, status=500)

#         finally:
#             # Ensure browser is closed
#             if hasattr(framework, 'close'):
#                 framework.close()

#     except Exception as e:
#         # Top-level failure (setup, etc.)
#         return Response({
#             "success": False,
#             "message": f"Execution setup failed: {str(e)}",
#             "healed_elements": [],
#             "broken_elements": [],
#             "metrics": {
#                 "total_scenarios": 0,
#                 "healed_count": 0,
#                 "broken_count": 0
#             }
#         }, status=500)



@api_view(['POST'])
def execute_tests(request):
    """
    Execute test steps for a given project and execution_sequence_number.
    Steps are executed in the order defined in SequenceScenario.
    """
    data = request.data
    execution_name = data.get('execution_name', 'Default Execution')
    project_id = data.get('project_id')
    execution_sequence_number = data.get('execution_sequence_number')

    if not project_id or execution_sequence_number is None:
        return Response({
            "success": False,
            "message": "Both project_id and execution_sequence_number are required.",
            "healed_elements": [],
            "broken_elements": [],
            "metrics": {
                "total_scenarios": 0,
                "healed_count": 0,
                "broken_count": 0
            }
        }, status=400)

    try:
        # Validate and fetch the ExecutionSequence object
        try:
            execution_sequence = ExecutionSequence.objects.get(
                project_id=project_id,
                number=execution_sequence_number
            )
        except ExecutionSequence.DoesNotExist:
            return Response({
                "success": False,
                "message": f"Execution sequence number {execution_sequence_number} not found for project_id {project_id}",
                "healed_elements": [],
                "broken_elements": [],
                "metrics": {
                    "total_scenarios": 0,
                    "healed_count": 0,
                    "broken_count": 0
                }
            }, status=404)

        # Create execution record
        execution = Execution.objects.create(
            execution_name=execution_name,
            project_id=project_id,
        )

        # Fetch the scenarios for that exact execution sequence
        sequence_entries = SequenceScenario.objects.filter(
            execution_sequence_id=execution_sequence.execution_sequence_id
        ).order_by('order')

        if not sequence_entries.exists():
            return Response({
                "success": False,
                "message": f"No scenarios found in the selected execution sequence.",
                "healed_elements": [],
                "broken_elements": [],
                "metrics": {
                    "total_scenarios": 0,
                    "healed_count": 0,
                    "broken_count": 0
                }
            }, status=404)

        # Build the combined test steps
        all_steps = []
        for entry in sequence_entries:
            scenario = entry.scenario
            mapping = scenario.mapping_file
            header = mapping[0]
            test_steps = [dict(zip(header, row)) for row in mapping[1:]]
            all_steps.extend(test_steps)

        scenario_count = sum(1 for row in all_steps if row.get("Step", "").strip().startswith("When"))

        # Initialize and run the test framework
        framework = SelfHealingFramework(all_steps)
        framework.scenario_count = scenario_count

        try:
            framework.start_browser()
            framework.execute_all_steps(delay=3.5)
            report = framework.get_healing_report()

            # Store healed elements
            for element in report['healed_elements']:
                HealedElements.objects.create(
                    execution=execution,
                    past_element_attribute=element['original_element_id'],
                    new_element_attribute=element['new_strategies'].get('id', ''),
                    label=True,
                    created_at=element.get('timestamp'),
                )

            # Store metrics
            Metrics.objects.create(
                execution=execution,
                number_of_scenarios=report['metrics']['total_scenarios'],
                number_of_healed_elements=report['metrics']['healed_count'],
            )

            execution.status = 'COMPLETED' if report['success'] else 'COMPLETED_WITH_ERRORS'
            execution.save()

            return Response({
                "success": report['success'],
                "message": report.get('message', 'Execution completed'),
                "healed_elements": report['healed_elements'],
                "broken_elements": report['broken_elements'],
                "metrics": report['metrics']
            })

        except Exception as e:
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
            if hasattr(framework, 'close'):
                framework.close()

    except Exception as e:
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