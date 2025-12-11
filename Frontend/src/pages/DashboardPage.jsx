import { useEffect, useState } from 'react';
import { dashboardAPI, votersAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, CheckCircle, XCircle, TrendingUp, FileDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateVotingStatusPDF } from '@/utils/pdfExport';

export const DashboardPage = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats) {
      console.log('Dashboard stats:', stats);
    }
  }, [stats]);

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

  const handleExportPDF = async (ldfOnly = false) => {
    try {
      setExporting(true);
      
      // Fetch ALL voted voters by making multiple requests if needed
      let allVotedVoters = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await votersAPI.getAll({ 
          has_voted: true,
          page: page,
          page_size: 100 // Fetch 100 at a time
        });
        
        const voters = response.data.results || response.data;
        allVotedVoters = [...allVotedVoters, ...voters];
        
        // Check if there are more pages
        if (response.data.next) {
          page++;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Fetched ${allVotedVoters.length} voted voters`);
      
      // Generate PDF
      generateVotingStatusPDF(allVotedVoters, stats, ldfOnly, language);
      
    } catch (err) {
      console.error('Export error:', err);
      alert(language === 'en' 
        ? 'Failed to export PDF. Please try again.'
        : 'PDF എക്സ്പോർട്ട് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.');
    } finally {
      setExporting(false);
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
      {/* Header with Export Buttons */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {language === 'en' ? 'Dashboard' : 'ഡാഷ്‌ബോർഡ്'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'en' ? 'Overview of voting progress' : 'വോട്ടിംഗ് പുരോഗതിയുടെ അവലോകനം'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExportPDF(false)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? (
              language === 'en' ? 'Exporting...' : 'എക്സ്പോർട്ട് ചെയ്യുന്നു...'
            ) : (
              language === 'en' ? 'Export All Voters' : 'എല്ലാ വോട്ടർമാരെയും എക്സ്പോർട്ട്'
            )}
          </button>
          <button
            onClick={() => handleExportPDF(true)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? (
              language === 'en' ? 'Exporting...' : 'എക്സ്പോർട്ട് ചെയ്യുന്നു...'
            ) : (
              language === 'en' ? 'Export LDF Only' : 'LDF മാത്രം എക്സ്പോർട്ട്'
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Voters */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Total Voters' : 'ആകെ വോട്ടർമാർ'}
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.total_voters}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>♂ {stats.male_total}</span>
                <span>♀ {stats.female_total}</span>
              </div>
            </div>
            <Users className="w-12 h-12 text-primary opacity-20" />
          </div>
        </div>

        {/* Voted */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തവർ'}
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.voted_count}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>♂ {stats.male_voted}</span>
                <span>♀ {stats.female_voted}</span>
              </div>
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
            <tfoot>
              <tr className="border-t-2 border-border bg-accent/30">
                <td className="py-3 px-4 font-bold">
                  {language === 'en' ? 'Total' : 'ആകെ'}
                </td>
                <td className="text-right py-3 px-4 font-bold">
                  {stats.level1_volunteer_stats.reduce((sum, v) => sum + v.total_voters, 0)}
                </td>
                <td className="text-right py-3 px-4 font-bold text-green-600">
                  {stats.level1_volunteer_stats.reduce((sum, v) => sum + v.voted_count, 0)}
                </td>
                <td className="text-right py-3 px-4 font-bold text-primary">
                  {stats.level1_volunteer_stats.length > 0
                    ? (
                        (stats.level1_volunteer_stats.reduce((sum, v) => sum + v.voted_count, 0) /
                        stats.level1_volunteer_stats.reduce((sum, v) => sum + v.total_voters, 0) * 100)
                      ).toFixed(2)
                    : 0}%
                </td>
              </tr>
            </tfoot>
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
                <th className="text-right py-3 px-4 font-semibold text-xs">
                  {language === 'en' ? 'LDF ♂' : 'LDF ♂'}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-xs">
                  {language === 'en' ? 'LDF ♀' : 'LDF ♀'}
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
                    <td className="text-right py-3 px-4 text-blue-600 text-sm">{volunteer.ldf_male_voted}</td>
                    <td className="text-right py-3 px-4 text-pink-600 text-sm">{volunteer.ldf_female_voted}</td>
                    <td className="text-right py-3 px-4 font-semibold">{volunteer.voting_percentage}%</td>
                    <td className="text-right py-3 px-4 font-semibold text-red-600">{volunteer.ldf_percentage}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted-foreground">
                    {language === 'en' ? 'No Thara data available' : 'തറ ഡാറ്റ ലഭ്യമല്ല'}
                  </td>
                </tr>
              )}
            </tbody>
            {stats.level2_volunteer_stats && stats.level2_volunteer_stats.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-accent/30">
                  <td className="py-3 px-4 font-bold">
                    {language === 'en' ? 'Total' : 'ആകെ'}
                  </td>
                  <td className="text-right py-3 px-4 font-bold">
                    {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.total_voters, 0)}
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-red-600">
                    {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_total, 0)}
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-green-600">
                    {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.voted_count, 0)}
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-green-700">
                    {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_voted, 0)}
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-blue-600 text-sm">
                    {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_male_voted, 0)}
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-pink-600 text-sm">
                    {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_female_voted, 0)}
                  </td>
                  <td className="text-right py-3 px-4 font-bold">
                    {stats.level2_volunteer_stats.length > 0
                      ? (
                          (stats.level2_volunteer_stats.reduce((sum, v) => sum + v.voted_count, 0) /
                          stats.level2_volunteer_stats.reduce((sum, v) => sum + v.total_voters, 0) * 100)
                        ).toFixed(2)
                      : 0}%
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-red-600">
                    {stats.level2_volunteer_stats.length > 0
                      ? (
                          (stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_voted, 0) /
                          stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_total, 0) * 100)
                        ).toFixed(2)
                      : 0}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* LDF Gender Summary */}
      {stats.level2_volunteer_stats && stats.level2_volunteer_stats.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'en' ? 'LDF Voting Summary (Gender-wise)' : 'LDF വോട്ടിംഗ് സംഗ്രഹം (ലിംഗാടിസ്ഥാനത്തിൽ)'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total LDF Voted */}
            <div className="bg-accent/30 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'en' ? 'Total LDF Voted' : 'ആകെ LDF വോട്ട് ചെയ്തവർ'}
              </p>
              <p className="text-4xl font-bold text-red-600">
                {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_voted, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'en' ? 'out of' : 'ആകെയുള്ളത്'} {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_total, 0)}
              </p>
            </div>

            {/* LDF Male Voted */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 text-center border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'en' ? 'LDF Male Voted' : 'LDF പുരുഷന്മാർ വോട്ട് ചെയ്തത്'}
              </p>
              <p className="text-4xl font-bold text-blue-600">
                ♂ {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_male_voted, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_total, 0) > 0
                  ? ((stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_male_voted, 0) /
                      stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_voted, 0) * 100).toFixed(1))
                  : 0}% {language === 'en' ? 'of LDF voted' : 'LDF വോട്ട് ചെയ്തവരിൽ'}
              </p>
            </div>

            {/* LDF Female Voted */}
            <div className="bg-pink-50 dark:bg-pink-950/30 rounded-lg p-6 text-center border border-pink-200 dark:border-pink-800">
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'en' ? 'LDF Female Voted' : 'LDF സ്ത്രീകൾ വോട്ട് ചെയ്തത്'}
              </p>
              <p className="text-4xl font-bold text-pink-600">
                ♀ {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_female_voted, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_total, 0) > 0
                  ? ((stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_female_voted, 0) /
                      stats.level2_volunteer_stats.reduce((sum, v) => sum + v.ldf_voted, 0) * 100).toFixed(1))
                  : 0}% {language === 'en' ? 'of LDF voted' : 'LDF വോട്ട് ചെയ്തവരിൽ'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
