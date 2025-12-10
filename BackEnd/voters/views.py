from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q, Count, Case, When, IntegerField
from django.middleware.csrf import get_token
from .models import User, Volunteer, Voter, AppSettings
from .serializers import (
    UserSerializer, VolunteerSerializer, VoterListSerializer,
    VoterDetailSerializer, VoterUpdateSerializer, DashboardStatsSerializer
)


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'message': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response({
            'message': 'Login successful',
            'user': serializer.data
        })
    else:
        return Response(
            {'message': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout endpoint"""
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Get current authenticated user with role and volunteer info"""
    user = request.user
    data = UserSerializer(user).data
    
    # Add volunteer information if user is a volunteer
    if hasattr(user, 'volunteer_profile'):
        volunteer = user.volunteer_profile
        data['volunteer'] = {
            'id': volunteer.id,
            'volunteer_id': volunteer.volunteer_id,
            'name': volunteer.name,
            'level': volunteer.level,
            'is_read_only': volunteer.level == 'level1'
        }
    else:
        data['volunteer'] = None
    
    # Overview users are read-only
    if user.role == 'overview':
        data['is_read_only'] = True
    
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    """Get CSRF token"""
    return Response({'csrfToken': get_token(request)})


@api_view(['GET'])
@permission_classes([AllowAny])
def app_settings_view(request):
    """Get application settings"""
    settings = AppSettings.load()
    return Response({
        'voting_enabled': settings.voting_enabled,
        'updated_at': settings.updated_at
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for deployment platforms"""
    return Response({
        'status': 'healthy',
        'service': 'Ward 14 Voting Tracker'
    }, status=status.HTTP_200_OK)


# Voter ViewSet
class VoterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Voter CRUD operations with role-based access:
    - Admin: Full access to all voters
    - Level 2: Can view and edit their assigned voters
    - Level 1: Can only view their assigned voters (read-only)
    """
    queryset = Voter.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name_en', 'name_ml', 'serial_no', 'house_name_en', 'house_name_ml']
    ordering_fields = ['serial_no', 'name_en', 'age', 'has_voted']
    ordering = ['serial_no']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VoterDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return VoterUpdateSerializer
        return VoterListSerializer
    
    def get_permissions(self):
        """
        Level 1 volunteers can only view (list, retrieve)
        Level 2 volunteers can view and edit (list, retrieve, update, partial_update)
        Overview users can only view (read-only)
        Admin can do everything
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Only admin and level2 can edit
            user = self.request.user
            if hasattr(user, 'volunteer_profile'):
                volunteer = user.volunteer_profile
                if volunteer.level == 'level1':
                    # Level 1 cannot edit
                    return [IsAuthenticated()]
        return super().get_permissions()
    
    def update(self, request, *args, **kwargs):
        """Override update to prevent Level 1 and Overview users from editing"""
        user = request.user
        if user.role == 'overview':
            return Response(
                {'detail': 'Overview users have read-only access.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if hasattr(user, 'volunteer_profile'):
            volunteer = user.volunteer_profile
            if volunteer.level == 'level1':
                return Response(
                    {'detail': 'Level 1 volunteers have read-only access.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to prevent Level 1 and Overview users from editing"""
        user = request.user
        if user.role == 'overview':
            return Response(
                {'detail': 'Overview users have read-only access.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if hasattr(user, 'volunteer_profile'):
            volunteer = user.volunteer_profile
            if volunteer.level == 'level1':
                return Response(
                    {'detail': 'Level 1 volunteers have read-only access.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().partial_update(request, *args, **kwargs)
    
    def get_queryset(self):
        queryset = Voter.objects.select_related('level1_volunteer', 'level2_volunteer')
        user = self.request.user
        
        # Filter based on user role
        if hasattr(user, 'volunteer_profile'):
            volunteer = user.volunteer_profile
            if volunteer.level == 'level1':
                # Level 1 sees only their assigned voters
                queryset = queryset.filter(level1_volunteer=volunteer)
            elif volunteer.level == 'level2':
                # Level 2 sees all voters assigned to them
                queryset = queryset.filter(level2_volunteer=volunteer)
        # Admin sees all voters (no filter)
        
        # Filter by voting status
        has_voted = self.request.query_params.get('has_voted')
        if has_voted is not None:
            queryset = queryset.filter(has_voted=has_voted.lower() == 'true')
        
        # Filter by party
        party = self.request.query_params.get('party')
        if party:
            queryset = queryset.filter(party=party)
        
        # Filter by status
        voter_status = self.request.query_params.get('status')
        if voter_status:
            queryset = queryset.filter(status=voter_status)
        
        # Filter by volunteer
        level1_volunteer = self.request.query_params.get('level1_volunteer')
        if level1_volunteer:
            queryset = queryset.filter(level1_volunteer_id=level1_volunteer)
        
        level2_volunteer = self.request.query_params.get('level2_volunteer')
        if level2_volunteer:
            queryset = queryset.filter(level2_volunteer_id=level2_volunteer)
        
        # Filter by gender
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # Filter by age range
        min_age = self.request.query_params.get('min_age')
        if min_age:
            queryset = queryset.filter(age__gte=min_age)
        
        max_age = self.request.query_params.get('max_age')
        if max_age:
            queryset = queryset.filter(age__lte=max_age)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_update_voted(self, request):
        """Bulk update voted status"""
        voter_ids = request.data.get('voter_ids', [])
        has_voted = request.data.get('has_voted', True)
        
        if not voter_ids:
            return Response(
                {'message': 'No voter IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated = Voter.objects.filter(id__in=voter_ids).update(has_voted=has_voted)
        
        return Response({
            'message': f'Updated {updated} voters',
            'updated_count': updated
        })


# Volunteer ViewSet
class VolunteerViewSet(viewsets.ModelViewSet):
    """ViewSet for Volunteer CRUD operations"""
    queryset = Volunteer.objects.all()
    serializer_class = VolunteerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'user__username']
    ordering_fields = ['volunteer_id', 'name', 'level', 'created_at']
    ordering = ['volunteer_id']
    
    def get_queryset(self):
        queryset = Volunteer.objects.select_related('parent_volunteer', 'user')
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def voters(self, request, pk=None):
        """Get all voters assigned to this volunteer"""
        volunteer = self.get_object()
        
        if volunteer.level == 'level1':
            voters = Voter.objects.filter(level1_volunteer=volunteer)
        else:
            voters = Voter.objects.filter(level2_volunteer=volunteer)
        
        # Apply filters
        has_voted = request.query_params.get('has_voted')
        if has_voted is not None:
            voters = voters.filter(has_voted=has_voted.lower() == 'true')
        
        party = request.query_params.get('party')
        if party:
            voters = voters.filter(party=party)
        
        voter_status = request.query_params.get('status')
        if voter_status:
            voters = voters.filter(status=voter_status)
        
        serializer = VoterListSerializer(voters, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for this volunteer"""
        volunteer = self.get_object()
        
        if volunteer.level == 'level1':
            voters = Voter.objects.filter(level1_volunteer=volunteer)
        else:
            voters = Voter.objects.filter(level2_volunteer=volunteer)
        
        total = voters.count()
        voted = voters.filter(has_voted=True).count()
        
        return Response({
            'volunteer_id': volunteer.id,
            'volunteer_name': volunteer.name,
            'total_voters': total,
            'voted_count': voted,
            'not_voted_count': total - voted,
            'voting_percentage': round((voted / total * 100) if total > 0 else 0, 2)
        })


# Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get overall dashboard statistics - Admin and Overview users only"""
    # Only admin and overview users can access dashboard
    if request.user.role not in ['admin', 'overview']:
        return Response(
            {'detail': 'Dashboard is only accessible to administrators and overview users.'},
            status=status.HTTP_403_FORBIDDEN
        )
    # Exclude deleted voters from all counts
    active_voters = Voter.objects.exclude(status='deleted')
    total_voters = active_voters.count()
    voted_count = active_voters.filter(has_voted=True).count()
    not_voted_count = total_voters - voted_count
    voting_percentage = round((voted_count / total_voters * 100) if total_voters > 0 else 0, 2)
    
    # Party-wise stats
    party_stats = {}
    for party_code, party_name in Voter.PARTY_CHOICES:
        count = Voter.objects.filter(party=party_code, has_voted=True).count()
        party_stats[party_code] = {
            'name': party_name,
            'voted_count': count
        }
    
    # Status-wise stats (exclude deleted from display)
    status_stats = {}
    for status_code, status_name in Voter.STATUS_CHOICES:
        if status_code != 'deleted':  # Don't show deleted in status stats
            count = Voter.objects.filter(status=status_code).count()
            status_stats[status_code] = {
                'name': status_name,
                'count': count
            }
    
    # Level 1 volunteer stats
    level1_volunteers = Volunteer.objects.filter(level='level1', is_active=True)
    level1_stats = []
    for volunteer in level1_volunteers:
        # Exclude deleted voters
        voters = Voter.objects.filter(level1_volunteer=volunteer).exclude(status='deleted')
        total = voters.count()
        voted = voters.filter(has_voted=True).count()
        
        # LDF specific stats
        ldf_voters = voters.filter(party='ldf')
        ldf_total = ldf_voters.count()
        ldf_voted = ldf_voters.filter(has_voted=True).count()
        
        level1_stats.append({
            'id': volunteer.id,
            'name': volunteer.name,
            'total_voters': total,
            'voted_count': voted,
            'not_voted_count': total - voted,
            'voting_percentage': round((voted / total * 100) if total > 0 else 0, 2),
            'ldf_total': ldf_total,
            'ldf_voted': ldf_voted,
            'ldf_percentage': round((ldf_voted / ldf_total * 100) if ldf_total > 0 else 0, 2)
        })
    
    # Level 2 volunteer stats
    level2_volunteers = Volunteer.objects.filter(level='level2', is_active=True)
    level2_stats = []
    for volunteer in level2_volunteers:
        # Exclude deleted voters
        voters = Voter.objects.filter(level2_volunteer=volunteer).exclude(status='deleted')
        total = voters.count()
        voted = voters.filter(has_voted=True).count()
        
        # LDF specific stats
        ldf_voters = voters.filter(party='ldf')
        ldf_total = ldf_voters.count()
        ldf_voted = ldf_voters.filter(has_voted=True).count()
        
        level2_stats.append({
            'id': volunteer.id,
            'name': volunteer.name,
            'total_voters': total,
            'voted_count': voted,
            'not_voted_count': total - voted,
            'voting_percentage': round((voted / total * 100) if total > 0 else 0, 2),
            'ldf_total': ldf_total,
            'ldf_voted': ldf_voted,
            'ldf_percentage': round((ldf_voted / ldf_total * 100) if ldf_total > 0 else 0, 2)
        })
    
    data = {
        'total_voters': total_voters,
        'voted_count': voted_count,
        'not_voted_count': not_voted_count,
        'voting_percentage': voting_percentage,
        'party_stats': party_stats,
        'status_stats': status_stats,
        'level1_volunteer_stats': level1_stats,
        'level2_volunteer_stats': level2_stats,
    }
    
    serializer = DashboardStatsSerializer(data)
    return Response(serializer.data)
