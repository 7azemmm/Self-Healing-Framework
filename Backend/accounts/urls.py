from django.urls import path
from .views import SignupView, LoginView, get_user,documents,create_project,get_projects,scenario,healing,execute_tests

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
]