from django.urls import path
from .views import SignupView, LoginView, get_user, documents, create_project, get_projects, scenario, healing, execute_tests, get_metrics, get_project_metrics, get_execution_sequences, get_execution_sequence_scenarios, update_scenario_order, get_execution_sequences_exe, create_execution_sequence, update_profile, get_scenario_mapping, update_scenario_mapping

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('get_user/', get_user, name='get_user'),
    path('documents/', documents, name='documents'),
    path('scenario/', scenario, name='scenario'),
    path('healing/', healing, name='healing'),
    path('create_project/', create_project, name='create_project'),
    path('get_projects/', get_projects, name='get_projects'),
    path('execute_tests/', execute_tests, name='execute_tests'),
    path('metrics/<int:project_id>/', get_metrics, name='get_metrics'),
    path('project_metrics/<int:project_id>/', get_project_metrics, name='get_project_metrics'),
    path('get_execution_sequences/<int:project_id>/', get_execution_sequences, name='get_execution_sequences'),
    path('get_execution_sequence_scenarios/<int:project_id>/<str:execution_sequence_number>/', get_execution_sequence_scenarios, name='get_execution_sequence_scenarios'), 
    path('update_scenario_order/', update_scenario_order, name='update_scenario_order'),
    path('get_execution_sequences_exe/<int:project_id>/', get_execution_sequences_exe, name='get_execution_sequences_exe'),
    path('create_execution_sequence/', create_execution_sequence, name='create_execution_sequence'),
    path('update_profile/', update_profile, name='update_profile'),
    path('get_scenario_mapping/<int:scenario_id>/', get_scenario_mapping, name='get_scenario_mapping'),
    path('update_scenario_mapping/<int:scenario_id>/', update_scenario_mapping, name='update_scenario_mapping'),
]
