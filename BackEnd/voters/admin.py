from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Volunteer, Voter, AppSettings


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin with role field"""
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number')}),
    )


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    """Volunteer admin configuration"""
    list_display = ['volunteer_id', 'name', 'get_username', 'level', 'parent_volunteer', 'is_active', 'created_at']
    list_filter = ['level', 'is_active', 'created_at']
    search_fields = ['volunteer_id', 'name', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['level', 'volunteer_id']
    
    fieldsets = (
        ('Identification', {
            'fields': ('volunteer_id', 'level'),
            'description': 'Volunteer ID is globally unique and used to group voters and view stats'
        }),
        ('Basic Information', {
            'fields': ('name',)
        }),
        ('Login Account', {
            'fields': ('user',),
            'description': 'Create a User account first, then link it here. Username and password are managed in the User model.'
        }),
        ('Hierarchy', {
            'fields': ('parent_volunteer',),
            'description': 'Level 1 volunteers can have a Level 2 supervisor. Level 2 volunteers have no parent.'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_username(self, obj):
        """Display the linked username"""
        return obj.user.username if obj.user else '-'
    get_username.short_description = 'Username'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('parent_volunteer', 'user')


@admin.register(Voter)
class VoterAdmin(admin.ModelAdmin):
    """Voter admin configuration"""
    list_display = [
        'serial_no', 'name_en', 'age', 'gender', 'party', 
        'has_voted', 'status', 'level1_volunteer', 'level2_volunteer'
    ]
    list_filter = [
        'has_voted', 'party', 'status', 'gender', 'category',
        'level1_volunteer', 'level2_volunteer'
    ]
    search_fields = [
        'name_en', 'name_ml', 'sec_id', 'house_name_en', 
        'house_name_ml', 'phone_number', 'serial_no'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'serial_no', 'sec_id', 'category',
                ('name_en', 'name_ml'),
                ('guardian_name_en', 'guardian_name_ml'),
                ('house_name_en', 'house_name_ml'),
                'old_ward_house_no',
                'gender', 'age'
            )
        }),
        ('Volunteer Assignment', {
            'fields': ('level1_volunteer', 'level2_volunteer')
        }),
        ('Tracking Information', {
            'fields': ('status', 'party', 'has_voted', 'phone_number')
        }),
        ('Additional Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    list_per_page = 50
    
    actions = ['mark_as_voted', 'mark_as_not_voted']
    
    def mark_as_voted(self, request, queryset):
        updated = queryset.update(has_voted=True)
        self.message_user(request, f'{updated} voters marked as voted.')
    mark_as_voted.short_description = "Mark selected voters as voted"
    
    def mark_as_not_voted(self, request, queryset):
        updated = queryset.update(has_voted=False)
        self.message_user(request, f'{updated} voters marked as not voted.')
    mark_as_not_voted.short_description = "Mark selected voters as not voted"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('level1_volunteer', 'level2_volunteer')


@admin.register(AppSettings)
class AppSettingsAdmin(admin.ModelAdmin):
    """Application Settings admin - Singleton"""
    list_display = ['voting_enabled', 'updated_at', 'updated_by']
    readonly_fields = ['updated_at']
    
    fieldsets = (
        ('Voting Control', {
            'fields': ('voting_enabled',),
            'description': 'Enable this toggle on polling day to allow volunteers to mark voters as voted from the frontend.'
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not AppSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion
        return False
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
