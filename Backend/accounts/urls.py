from django.urls import path
from .views import SignupView, LoginView, get_user,documents,create_project,get_projects,scenario,healing,execute_tests,get_metrics,get_project_metrics,get_all_scenarios,create_execution_flow,get_execution_flow,update_execution_flow_items,get_execution_flow_items

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', get_user, name='get_user'),
    path('documents/', documents, name='documents'),
    path('scenario/', scenario, name='scenario'),
    path('healing/', healing, name='healing'),
    path('create_project/', create_project, name='create_project'),
    path('get_projects/', get_projects, name='get_projects'),
    path('execute_tests/', execute_tests, name='execute_tests'),
    path('metrics/<int:project_id>/', get_metrics, name='get_metrics'),
    path('project_metrics/<int:project_id>/', get_project_metrics, name='get_project_metrics'),
    path('scenarios/', get_all_scenarios, name='scenarios'),
    path('execution_flows/', create_execution_flow, name='create_execution_flow'),
    path('get_execution_flows/', get_execution_flow, name='get_execution_flow'),
    path('execution_flows_items/', update_execution_flow_items, name='update_execution_flow_items'),
    path('get_execution_flow_items/', get_execution_flow_items, name='get_execution_flow_items'),
]