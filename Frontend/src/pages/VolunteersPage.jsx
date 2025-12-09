import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { volunteersAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, TrendingUp } from 'lucide-react';

export const VolunteersPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('level1');

  useEffect(() => {
    fetchVolunteers();
  }, [selectedLevel]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const response = await volunteersAPI.getAll({ level: selectedLevel });
      setVolunteers(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load volunteers');
      console.error('Volunteers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerClick = (volunteerId) => {
    navigate(`/volunteers/${volunteerId}/voters`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {language === 'en' ? 'Volunteers' : 'സന്നദ്ധപ്രവർത്തകർ'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'en' ? 'View voters assigned to each volunteer' : 'ഓരോ സന്നദ്ധപ്രവർത്തകനും നൽകിയിരിക്കുന്ന വോട്ടർമാരെ കാണുക'}
        </p>
      </div>

      {/* Level Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setSelectedLevel('level1')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedLevel === 'level1'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-accent'
          }`}
        >
          {language === 'en' ? 'Level 1 Volunteers' : 'ലെവൽ 1 സന്നദ്ധപ്രവർത്തകർ'}
        </button>
        <button
          onClick={() => setSelectedLevel('level2')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedLevel === 'level2'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-accent'
          }`}
        >
          {language === 'en' ? 'Level 2 Volunteers' : 'ലെവൽ 2 സന്നദ്ധപ്രവർത്തകർ'}
        </button>
      </div>

      {/* Volunteers Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">
            {language === 'en' ? 'Loading...' : 'ലോഡ് ചെയ്യുന്നു...'}
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-4 rounded-md">
          {error}
        </div>
      ) : volunteers.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {language === 'en' ? 'No volunteers found' : 'സന്നദ്ധപ്രവർത്തകരെ കണ്ടെത്തിയില്ല'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((volunteer) => (
            <div
              key={volunteer.id}
              onClick={() => handleVolunteerClick(volunteer.id)}
              className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {volunteer.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {volunteer.volunteer_id}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-20" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Voters' : 'ആകെ വോട്ടർമാർ'}
                  </span>
                  <span className="text-lg font-bold">{volunteer.voter_count || 0}</span>
                </div>

                {volunteer.parent_volunteer_name && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {language === 'en' ? 'Under: ' : 'കീഴിൽ: '}
                      {volunteer.parent_volunteer_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {language === 'en' ? 'View Voters' : 'വോട്ടർമാരെ കാണുക'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
