# Ward 14 Voting Tracker

A web application for tracking voter turnout in Ward 14, built with Django (backend) and React (frontend).

## Technology Stack

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL
- Python 3.x

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios

## Project Structure

```
Ward14VotingTracker/
├── BackEnd/
│   ├── voting_tracker/      # Django project
│   ├── voters/              # Django app
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                 # Environment variables
├── Frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth, Language)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── lib/             # Utilities
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the BackEnd directory:
```bash
cd BackEnd
```

2. Activate virtual environment:
```bash
# Windows
.\backendenv\Scripts\activate
```

3. Install dependencies (if not already done):
```bash
pip install -r requirements.txt
```

4. Configure environment variables in `.env` file

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

Backend will be available at: http://localhost:8000

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## Features

### Phase 1 (Completed)
- ✅ Django backend with PostgreSQL configuration
- ✅ REST API setup with authentication
- ✅ React frontend with routing
- ✅ Authentication context
- ✅ Language switching (English/Malayalam)
- ✅ Red & White theme
- ✅ Responsive layout

### Phase 2 (In Progress)
- Database models for voters, volunteers
- Admin panel configuration
- CSV data import

### Phase 3 (Planned)
- Dashboard with statistics
- Voter list with filtering
- Volunteer management
- Individual voter details editing

## Development Status

Currently in **Phase 1** - Project setup and configuration complete.

See `ExecutionPlan.md` for detailed development roadmap.

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_NAME=voting_tracker_db
DATABASE_USER=voting_admin
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

## API Endpoints (Planned)

- `/api/auth/login/` - User login
- `/api/auth/logout/` - User logout
- `/api/voters/` - List/filter voters
- `/api/voters/<id>/` - Voter details
- `/api/volunteers/` - List volunteers
- `/api/dashboard/stats/` - Dashboard statistics

## Contributing

This is a private project for Ward 14 election tracking.

## License

Private - All rights reserved
