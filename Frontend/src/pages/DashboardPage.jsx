import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const DashboardPage = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">
          {language === 'en' ? 'Loading...' : 'ലോഡ് ചെയ്യുന്നു...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare volunteer data for bar chart
  const volunteerData = stats.level1_volunteer_stats.map(v => ({
    name: v.name,
    voted: v.voted_count,
    notVoted: v.not_voted_count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {language === 'en' ? 'Dashboard' : 'ഡാഷ്‌ബോർഡ്'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'en' ? 'Overview of voting progress' : 'വോട്ടിംഗ് പുരോഗതിയുടെ അവലോകനം'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Voters */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Total Voters' : 'ആകെ വോട്ടർമാർ'}
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.total_voters}</p>
            </div>
            <Users className="w-12 h-12 text-primary opacity-20" />
          </div>
        </div>

        {/* Voted */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തവർ'}
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.voted_count}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        {/* Not Voted */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Not Voted' : 'വോട്ട് ചെയ്യാത്തവർ'}
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.not_voted_count}</p>
            </div>
            <XCircle className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>

        {/* Voting Percentage */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Turnout' : 'പങ്കാളിത്തം'}
              </p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.voting_percentage}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'en' ? 'Voter Status Distribution' : 'വോട്ടർ സ്റ്റാറ്റസ് വിതരണം'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.status_stats).map(([key, value]) => (
            <div key={key} className="bg-accent/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{value.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{value.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Level 1 Volunteers Progress */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'en' ? 'Volunteer Progress' : 'സന്നദ്ധപ്രവർത്തകരുടെ പുരോഗതി'}
        </h2>
        {volunteerData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volunteerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="voted" fill="#22c55e" name={language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തവർ'} />
              <Bar dataKey="notVoted" fill="#f97316" name={language === 'en' ? 'Not Voted' : 'വോട്ട് ചെയ്യാത്തവർ'} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {language === 'en' ? 'No volunteer data available' : 'സന്നദ്ധപ്രവർത്തക ഡാറ്റ ലഭ്യമല്ല'}
          </p>
        )}
      </div>

      {/* Level 1 Volunteer Stats Table */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'en' ? 'Volunteer Statistics' : 'സന്നദ്ധപ്രവർത്തക സ്ഥിതിവിവരക്കണക്കുകൾ'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">
                  {language === 'en' ? 'Volunteer' : 'സന്നദ്ധപ്രവർത്തകൻ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'Total Voters' : 'ആകെ വോട്ടർമാർ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തവർ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'Percentage' : 'ശതമാനം'}
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.level1_volunteer_stats.map((volunteer) => (
                <tr key={volunteer.id} className="border-b border-border hover:bg-accent/50">
                  <td className="py-3 px-4">{volunteer.name}</td>
                  <td className="text-right py-3 px-4">{volunteer.total_voters}</td>
                  <td className="text-right py-3 px-4 text-green-600 font-medium">{volunteer.voted_count}</td>
                  <td className="text-right py-3 px-4 font-semibold text-primary">{volunteer.voting_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Level 2 Volunteer Stats Table */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'en' ? 'Thara Statistics' : 'തറ സ്ഥിതിവിവരക്കണക്കുകൾ'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">
                  {language === 'en' ? 'Secretary' : 'സെക്രട്ടറി'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'Total Voters' : 'ആകെ വോട്ടർമാർ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'LDF Voters' : 'LDF വോട്ടർമാർ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'Total Voted' : 'ആകെ വോട്ട് ചെയ്തവർ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'LDF Voted' : 'LDF വോട്ട് ചെയ്തവർ'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'Total %' : 'ആകെ %'}
                </th>
                <th className="text-right py-3 px-4 font-semibold">
                  {language === 'en' ? 'LDF %' : 'LDF %'}
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.level2_volunteer_stats && stats.level2_volunteer_stats.length > 0 ? (
                stats.level2_volunteer_stats.map((volunteer) => (
                  <tr key={volunteer.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4">{volunteer.name}</td>
                    <td className="text-right py-3 px-4">{volunteer.total_voters}</td>
                    <td className="text-right py-3 px-4 text-red-600">{volunteer.ldf_total}</td>
                    <td className="text-right py-3 px-4 text-green-600">{volunteer.voted_count}</td>
                    <td className="text-right py-3 px-4 text-green-700 font-medium">{volunteer.ldf_voted}</td>
                    <td className="text-right py-3 px-4 font-semibold">{volunteer.voting_percentage}%</td>
                    <td className="text-right py-3 px-4 font-semibold text-red-600">{volunteer.ldf_percentage}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted-foreground">
                    {language === 'en' ? 'No Thara data available' : 'തറ ഡാറ്റ ലഭ്യമല്ല'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
