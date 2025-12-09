from rest_framework import serializers
from .models import User, Volunteer, Voter


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number']
        read_only_fields = ['id']


class VolunteerSerializer(serializers.ModelSerializer):
    """Serializer for Volunteer model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    parent_volunteer_name = serializers.CharField(source='parent_volunteer.name', read_only=True)
    voter_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Volunteer
        fields = [
            'id', 'volunteer_id', 'name', 'level',
            'parent_volunteer', 'parent_volunteer_name', 'user', 'user_username',
            'is_active', 'voter_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_voter_count(self, obj):
        """Get count of voters assigned to this volunteer"""
        if obj.level == 'level1':
            return obj.level1_voters.count()
        else:
            return obj.level2_voters.count()


class VoterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for voter lists"""
    level1_volunteer_name = serializers.CharField(source='level1_volunteer.name', read_only=True)
    level2_volunteer_name = serializers.CharField(source='level2_volunteer.name', read_only=True)
    
    class Meta:
        model = Voter
        fields = [
            'id', 'serial_no', 'name_en', 'name_ml', 'age', 'gender',
            'house_name_en', 'house_name_ml', 'sec_id',
            'level1_volunteer', 'level1_volunteer_name',
            'level2_volunteer', 'level2_volunteer_name',
            'status', 'party', 'has_voted', 'phone_number'
        ]


class VoterDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual voter"""
    level1_volunteer_name = serializers.CharField(source='level1_volunteer.name', read_only=True)
    level2_volunteer_name = serializers.CharField(source='level2_volunteer.name', read_only=True)
    
    class Meta:
        model = Voter
        fields = [
            'id', 'serial_no', 'sec_id', 'category',
            'name_en', 'name_ml',
            'guardian_name_en', 'guardian_name_ml',
            'house_name_en', 'house_name_ml',
            'old_ward_house_no', 'gender', 'age',
            'level1_volunteer', 'level1_volunteer_name',
            'level2_volunteer', 'level2_volunteer_name',
            'status', 'party', 'has_voted', 'phone_number',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'serial_no', 'sec_id', 'created_at', 'updated_at']


class VoterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating voter tracking fields"""
    class Meta:
        model = Voter
        fields = ['status', 'party', 'has_voted', 'phone_number', 'notes', 
                  'level1_volunteer', 'level2_volunteer']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_voters = serializers.IntegerField()
    voted_count = serializers.IntegerField()
    not_voted_count = serializers.IntegerField()
    voting_percentage = serializers.FloatField()
    
    # Party-wise stats
    party_stats = serializers.DictField()
    
    # Status-wise stats
    status_stats = serializers.DictField()
    
    # Volunteer-wise stats
    level1_volunteer_stats = serializers.ListField()
    level2_volunteer_stats = serializers.ListField()


class VolunteerStatsSerializer(serializers.Serializer):
    """Serializer for volunteer-specific statistics"""
    volunteer_id = serializers.IntegerField()
    volunteer_name = serializers.CharField()
    total_voters = serializers.IntegerField()
    voted_count = serializers.IntegerField()
    not_voted_count = serializers.IntegerField()
    voting_percentage = serializers.FloatField()
