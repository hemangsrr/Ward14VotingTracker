import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { votersAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const VotersPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVoted, setFilterVoted] = useState('all');
  const [filterParty, setFilterParty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVoters();
  }, [searchQuery, filterVoted, filterParty, filterStatus, currentPage]);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchQuery || undefined,
        has_voted: filterVoted !== 'all' ? filterVoted === 'voted' : undefined,
        party: filterParty !== 'all' ? filterParty : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      };
      
      const response = await votersAPI.getAll(params);
      setVoters(response.data.results || response.data);
      
      // Calculate total pages if pagination info is available
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load voters');
      console.error('Voters error:', err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {language === 'en' ? 'All Voters' : 'എല്ലാ വോട്ടർമാരും'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'en' ? 'Complete voter list with filtering' : 'ഫിൽട്ടറിംഗ് സഹിതം പൂർണ്ണ വോട്ടർ ലിസ്റ്റ്'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by name, SEC ID...' : 'പേര്, SEC ID കൊണ്ട് തിരയുക...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Voted Filter */}
          <select
            value={filterVoted}
            onChange={(e) => setFilterVoted(e.target.value)}
            className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{language === 'en' ? 'All Status' : 'എല്ലാ സ്റ്റാറ്റസും'}</option>
            <option value="voted">{language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തവർ'}</option>
            <option value="not_voted">{language === 'en' ? 'Not Voted' : 'വോട്ട് ചെയ്യാത്തവർ'}</option>
          </select>

          {/* Party Filter */}
          <select
            value={filterParty}
            onChange={(e) => setFilterParty(e.target.value)}
            className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{language === 'en' ? 'All Parties' : 'എല്ലാ പാർട്ടികളും'}</option>
            <option value="ldf">LDF</option>
            <option value="udf">UDF</option>
            <option value="bjp">BJP</option>
            <option value="other">{language === 'en' ? 'Other' : 'മറ്റുള്ളവ'}</option>
            <option value="unknown">{language === 'en' ? 'Unknown' : 'അറിയില്ല'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{language === 'en' ? 'All Status' : 'എല്ലാ സ്റ്റാറ്റസും'}</option>
            <option value="active">{language === 'en' ? 'Active' : 'സജീവം'}</option>
            <option value="out_of_station">{language === 'en' ? 'Out of Station' : 'സ്റ്റേഷനു പുറത്ത്'}</option>
            <option value="deceased">{language === 'en' ? 'Deceased' : 'മരണപ്പെട്ടു'}</option>
            <option value="postal_vote">{language === 'en' ? 'Postal Vote' : 'തപാൽ വോട്ട്'}</option>
          </select>
        </div>
      </div>

      {/* Voters Table */}
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
      ) : (
        <>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {language === 'en' ? `Page ${currentPage} of ${totalPages}` : `പേജ് ${currentPage} / ${totalPages}`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === 'en' ? 'Previous' : 'മുമ്പത്തെ'}
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {language === 'en' ? 'Next' : 'അടുത്തത്'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
