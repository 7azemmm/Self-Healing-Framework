from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, full_name, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None  # Remove username
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)

    objects = CustomUserManager()  # Use the custom manager

    USERNAME_FIELD = "email"  # Set email as the unique identifier
    REQUIRED_FIELDS = ["full_name"]  # Required when creating a superuser

    def __str__(self):
        return self.email

class Project(models.Model):
    project_id = models.AutoField(primary_key=True)
    project_name = models.CharField(max_length=50, null=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=False, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project'
        ordering = ['-created_at']

    def __str__(self):
        return self.project_name

class Execution(models.Model):
    execution_id = models.AutoField(primary_key=True)
    execution_name = models.CharField(max_length=25, null=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=False, related_name='executions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'execution'
        ordering = ['-created_at']

    def __str__(self):
        return self.execution_name

class Scenarios(models.Model):
    scenario_id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=False, related_name='scenarios')
    mapping_file = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'scenarios'
        ordering = ['-created_at']
        verbose_name_plural = 'Scenarios'

    def __str__(self):
        return f"Scenario {self.scenario_id} - {self.project.project_name}"

class Metrics(models.Model):
    metrics_id = models.AutoField(primary_key=True)
    execution = models.ForeignKey(Execution, on_delete=models.CASCADE, null=False, related_name='metrics')
    number_of_scenarios = models.IntegerField(null=False)
    number_of_healed_elements = models.IntegerField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'metrics'
        ordering = ['-created_at']
        verbose_name_plural = 'Metrics'

    def __str__(self):
        return f"Metrics {self.metrics_id} - {self.execution.execution_name}"

class HealedElements(models.Model):
    healed_element_id = models.AutoField(primary_key=True)
    execution = models.ForeignKey(Execution, on_delete=models.CASCADE, null=False, related_name='healed_elements')
    past_element_attribute = models.CharField(max_length=60, null=False)
    new_element_attribute = models.CharField(max_length=60, null=False)
    label = models.BooleanField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'healed_elements'
        ordering = ['-created_at']
        verbose_name_plural = 'Healed Elements'

    def __str__(self):
        return f"Healed Element {self.healed_element_id} - {self.execution.execution_name}"