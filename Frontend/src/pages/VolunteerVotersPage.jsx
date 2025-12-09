import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { volunteersAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export const VolunteerVotersPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [volunteer, setVolunteer] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterVoted, setFilterVoted] = useState('all');

  useEffect(() => {
    fetchVolunteerAndVoters();
  }, [id, filterVoted]);

  const fetchVolunteerAndVoters = async () => {
    try {
      setLoading(true);
      
      // Fetch volunteer details
      const volunteerResponse = await volunteersAPI.getById(id);
      setVolunteer(volunteerResponse.data);
      
      // Fetch voters
      const params = {
        has_voted: filterVoted !== 'all' ? filterVoted === 'voted' : undefined,
      };
      const votersResponse = await volunteersAPI.getVoters(id, params);
      setVoters(votersResponse.data);
      
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoterClick = (voterId) => {
    navigate(`/voters/${voterId}`);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      out_of_station: 'bg-blue-100 text-blue-800',
      deceased: 'bg-gray-100 text-gray-800',
      postal_vote: 'bg-purple-100 text-purple-800',
    };
    
    const statusLabels = {
      active: language === 'en' ? 'Active' : 'സജീവം',
      out_of_station: language === 'en' ? 'Out of Station' : 'സ്റ്റേഷനു പുറത്ത്',
      deceased: language === 'en' ? 'Deceased' : 'മരണപ്പെട്ടു',
      postal_vote: language === 'en' ? 'Postal Vote' : 'തപാൽ വോട്ട്',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getPartyBadge = (party) => {
    const partyColors = {
      ldf: 'bg-red-100 text-red-800',
      udf: 'bg-green-100 text-green-800',
      bjp: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
      unknown: 'bg-gray-50 text-gray-600',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${partyColors[party] || 'bg-gray-100 text-gray-800'}`}>
        {party.toUpperCase()}
      </span>
    );
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
      <div className="space-y-4">
        <button
          onClick={() => navigate('/volunteers')}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'en' ? 'Back to Volunteers' : 'സന്നദ്ധപ്രവർത്തകരിലേക്ക് മടങ്ങുക'}
        </button>
        <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  const votedCount = voters.filter(v => v.has_voted).length;
  const notVotedCount = voters.length - votedCount;
  const percentage = voters.length > 0 ? ((votedCount / voters.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/volunteers')}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'en' ? 'Back to Volunteers' : 'സന്നദ്ധപ്രവർത്തകരിലേക്ക് മടങ്ങുക'}
        </button>
      </div>

      {/* Volunteer Info Card */}
      {volunteer && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {language === 'en' ? volunteer.name_en : volunteer.name_ml || volunteer.name_en}
              </h1>
              {volunteer.phone_number && (
                <p className="text-muted-foreground mt-1">{volunteer.phone_number}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Voting Progress' : 'വോട്ടിംഗ് പുരോഗതി'}
              </p>
              <p className="text-3xl font-bold text-primary mt-1">{percentage}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{voters.length}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Total' : 'ആകെ'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{votedCount}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തവർ'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{notVotedCount}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Pending' : 'ബാക്കിയുള്ളവർ'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <select
          value={filterVoted}
          onChange={(e) => setFilterVoted(e.target.value)}
          className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">{language === 'en' ? 'All Voters' : 'എല്ലാ വോട്ടർമാരും'}</option>
          <option value="voted">{language === 'en' ? 'Voted Only' : 'വോട്ട് ചെയ്തവർ മാത്രം'}</option>
          <option value="not_voted">{language === 'en' ? 'Not Voted Only' : 'വോട്ട് ചെയ്യാത്തവർ മാത്രം'}</option>
        </select>
      </div>

      {/* Voters Table */}
      {voters.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {language === 'en' ? 'No voters found' : 'വോട്ടർമാരെ കണ്ടെത്തിയില്ല'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'S.No' : 'ക്രമ നം'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'Name' : 'പേര്'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'House' : 'വീട്'}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {language === 'en' ? 'Age' : 'പ്രായം'}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {language === 'en' ? 'Party' : 'പാർട്ടി'}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {language === 'en' ? 'Status' : 'സ്റ്റാറ്റസ്'}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {language === 'en' ? 'Voted' : 'വോട്ട്'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => (
                  <tr
                    key={voter.id}
                    onClick={() => handleVoterClick(voter.id)}
                    className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">{voter.serial_no}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {language === 'en' ? voter.name_en : voter.name_ml || voter.name_en}
                      </div>
                      <div className="text-xs text-muted-foreground">{voter.sec_id}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {language === 'en' ? voter.house_name_en : voter.house_name_ml || voter.house_name_en}
                    </td>
                    <td className="text-center py-3 px-4">{voter.age}</td>
                    <td className="text-center py-3 px-4">{getPartyBadge(voter.party)}</td>
                    <td className="text-center py-3 px-4">{getStatusBadge(voter.status)}</td>
                    <td className="text-center py-3 px-4">
                      {voter.has_voted ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-orange-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
