from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError


class User(AbstractUser):
    """Custom user model with role-based access"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('level1', 'Level 1 Volunteer'),
        ('level2', 'Level 2 Volunteer'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='level2')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Volunteer(models.Model):
    """
    Volunteer model for Level 1 (bottom) and Level 2 (supervisors) volunteers
    Level 1: Bottom level volunteers who manage voters
    Level 2: Supervisors who oversee Level 1 volunteers
    """
    LEVEL_CHOICES = [
        ('level1', 'Level 1'),
        ('level2', 'Level 2'),
    ]
    
    volunteer_id = models.IntegerField(
        verbose_name="Volunteer ID",
        help_text="Unique ID to group voters and view stats/dashboard",
        unique=True
    )
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='volunteer_profile',
        help_text="Linked user account for login"
    )
    name = models.CharField(
        max_length=200, 
        verbose_name="Name",
        help_text="Volunteer name (English only)"
    )
    level = models.CharField(
        max_length=10, 
        choices=LEVEL_CHOICES,
        help_text="Level 1 = Bottom, Level 2 = Supervisor"
    )
    parent_volunteer = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='sub_volunteers',
        help_text="Level 2 Volunteer (only for Level 1 volunteers)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'volunteers'
        ordering = ['level', 'volunteer_id']
    
    def __str__(self):
        return f"{self.get_level_display()} - ID {self.volunteer_id}: {self.name}"
    
    def save(self, *args, **kwargs):
        # Ensure Level 2 volunteers don't have a parent
        if self.level == 'level2':
            self.parent_volunteer = None
        super().save(*args, **kwargs)


class Voter(models.Model):
    """Voter model based on CSV data structure"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('out_of_station', 'Out of Station'),
        ('deceased', 'Deceased'),
        ('postal_vote', 'Postal Vote'),
    ]
    
    PARTY_CHOICES = [
        ('ldf', 'LDF'),
        ('udf', 'UDF'),
        ('bjp', 'BJP'),
        ('other', 'Other'),
        ('unknown', 'Unknown'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    CATEGORY_CHOICES = [
        ('existing', 'Existing'),
        ('deletion', 'Deletion'),
    ]
    
    # CSV Fields
    serial_no = models.IntegerField(verbose_name="Serial No.")
    name_en = models.CharField(max_length=200, verbose_name="Name (English)")
    name_ml = models.CharField(max_length=200, verbose_name="Name (Malayalam)", blank=True)
    guardian_name_en = models.CharField(max_length=200, verbose_name="Guardian's Name (English)")
    guardian_name_ml = models.CharField(max_length=200, verbose_name="Guardian's Name (Malayalam)", blank=True)
    old_ward_house_no = models.CharField(max_length=50, verbose_name="Old Ward/House No.")
    house_name_en = models.CharField(max_length=200, verbose_name="House Name (English)")
    house_name_ml = models.CharField(max_length=200, verbose_name="House Name (Malayalam)", blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    age = models.IntegerField()
    sec_id = models.CharField(max_length=50, unique=True, verbose_name="SEC ID No.")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='existing')
    
    # Additional Tracking Fields
    level1_volunteer = models.ForeignKey(
        Volunteer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='level1_voters',
        limit_choices_to={'level': 'level1'},
        verbose_name="Level 1 In-charge"
    )
    level2_volunteer = models.ForeignKey(
        Volunteer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='level2_voters',
        limit_choices_to={'level': 'level2'},
        verbose_name="Level 2 In-charge"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    party = models.CharField(max_length=20, choices=PARTY_CHOICES, default='unknown')
    has_voted = models.BooleanField(default=False, verbose_name="Voted")
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    
    # Metadata
    notes = models.TextField(blank=True, null=True, help_text="Additional notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'voters'
        ordering = ['serial_no']
        indexes = [
            models.Index(fields=['sec_id']),
            models.Index(fields=['serial_no']),
            models.Index(fields=['has_voted']),
            models.Index(fields=['party']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.serial_no}. {self.name_en} ({self.sec_id})"
    
    @property
    def assigned_volunteer(self):
        """Returns the assigned volunteer (Level 2 if exists, else Level 1)"""
        return self.level2_volunteer or self.level1_volunteer


class AppSettings(models.Model):
    """Global application settings - Singleton model"""
    voting_enabled = models.BooleanField(
        default=False,
        verbose_name="Enable Voting",
        help_text="Enable this on polling day to allow volunteers to mark voters as voted"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'app_settings'
        verbose_name = 'Application Settings'
        verbose_name_plural = 'Application Settings'
    
    def __str__(self):
        return f"App Settings (Voting: {'Enabled' if self.voting_enabled else 'Disabled'})"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Prevent deletion
        pass
    
    @classmethod
    def load(cls):
        """Load or create the singleton settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
