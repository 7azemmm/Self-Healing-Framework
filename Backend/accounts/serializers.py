from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Project,Scenarios,Metrics,HealedElements,FineTuningData

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password']
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token
        token['email'] = user.email
        token['full_name'] = user.full_name
        return token

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenarios
        fields = '__all__'

class MetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metrics
        fields = ['metrics_id', 'execution', 'number_of_scenarios', 'number_of_healed_elements', 'created_at']
        
        
class HealedElementsSerializer(serializers.ModelSerializer):
    execution_name = serializers.CharField(source='execution.execution_name')
    past_id = serializers.CharField(source='past_element_attribute')
    new_id = serializers.CharField(source='new_element_attribute')

    class Meta:
        model = HealedElements
        fields = ['execution_name', 'past_id', 'new_id', 'created_at']

class MetricsSerializer(serializers.ModelSerializer):
    execution_id = serializers.IntegerField(source='execution.execution_id')
    execution_name = serializers.CharField(source='execution.execution_name')
    created_at = serializers.DateTimeField(source='execution.created_at')

    class Meta:
        model = Metrics
        fields = ['execution_id', 'execution_name', 'number_of_scenarios', 'number_of_healed_elements', 'created_at']

class ProjectMetricsSerializer(serializers.Serializer):
    total_scenarios = serializers.IntegerField()
    total_healed_elements = serializers.IntegerField()
    execution_data = MetricsSerializer(many=True)
    healed_elements = HealedElementsSerializer(many=True)

class FineTuningDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FineTuningData
        fields = ['data_id', 'execution', 'original_attributes', 'matched_attributes', 'label', 'created_at']
