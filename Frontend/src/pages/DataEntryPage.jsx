import { useState, useRef, useEffect } from 'react';
import { votersAPI, settingsAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, AlertCircle, Keyboard, Lock } from 'lucide-react';

const STORAGE_KEY = 'data_entry_marked_voters';

export const DataEntryPage = () => {
  const { language } = useLanguage();
  const [serialNo, setSerialNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success'); // 'success' or 'error'
  const [markedVoters, setMarkedVoters] = useState([]);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const inputRef = useRef(null);

  // Load marked voters from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMarkedVoters(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load marked voters from storage:', e);
      }
    }
  }, []);

  // Save marked voters to localStorage whenever it changes
  useEffect(() => {
    if (markedVoters.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markedVoters));
    }
  }, [markedVoters]);

  // Check voting settings on mount
  useEffect(() => {
    checkVotingSettings();
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (votingEnabled && !checkingSettings) {
      inputRef.current?.focus();
    }
  }, [votingEnabled, checkingSettings]);

  const checkVotingSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      setVotingEnabled(response.data.voting_enabled);
    } catch (err) {
      console.error('Failed to check voting settings:', err);
      // Default to enabled if we can't check
      setVotingEnabled(true);
    } finally {
      setCheckingSettings(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serialNo.trim()) {
      return;
    }

    // Check if voting is enabled
    if (!votingEnabled) {
      setMessage(language === 'en' 
        ? 'Voting is currently disabled. Please enable it from settings.' 
        : 'വോട്ടിംഗ് നിലവിൽ പ്രവർത്തനരഹിതമാണ്. ക്രമീകരണങ്ങളിൽ നിന്ന് ഇത് പ്രവർത്തനക്ഷമമാക്കുക.'
      );
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Search for voter by serial number
      const searchResponse = await votersAPI.getAll({ 
        search: serialNo.trim(),
        page_size: 100 
      });
      
      const voters = searchResponse.data.results || searchResponse.data;
      const voter = voters.find(v => v.serial_no === parseInt(serialNo.trim()));

      if (!voter) {
        setMessage(language === 'en' 
          ? `Serial number ${serialNo} not found` 
          : `സീരിയൽ നമ്പർ ${serialNo} കണ്ടെത്തിയില്ല`
        );
        setMessageType('error');
        setSerialNo('');
        inputRef.current?.focus();
        return;
      }

      // Check if already voted
      if (voter.has_voted) {
        setMessage(language === 'en'
          ? `${voter.name_en} (S.No: ${voter.serial_no}) is already marked as voted`
          : `${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) ഇതിനകം വോട്ട് ചെയ്തതായി അടയാളപ്പെടുത്തിയിട്ടുണ്ട്`
        );
        setMessageType('error');
        setSerialNo('');
        inputRef.current?.focus();
        return;
      }

      // Check if status is not active
      if (voter.status !== 'active') {
        const statusMessages = {
          out_of_station: language === 'en' 
            ? `${voter.name_en} (S.No: ${voter.serial_no}) is marked as Out of Station`
            : `${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) സ്റ്റേഷനു പുറത്ത് എന്ന് അടയാളപ്പെടുത്തിയിട്ടുണ്ട്`,
          deceased: language === 'en'
            ? `${voter.name_en} (S.No: ${voter.serial_no}) is marked as Deceased`
            : `${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) മരണപ്പെട്ടു എന്ന് അടയാളപ്പെടുത്തിയിട്ടുണ്ട്`,
          postal_vote: language === 'en'
            ? `${voter.name_en} (S.No: ${voter.serial_no}) is marked as Postal Vote`
            : `${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) തപാൽ വോട്ട് എന്ന് അടയാളപ്പെടുത്തിയിട്ടുണ്ട്`,
          deleted: language === 'en'
            ? `${voter.name_en} (S.No: ${voter.serial_no}) is marked as Deleted`
            : `${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) ഇല്ലാതാക്കി എന്ന് അടയാളപ്പെടുത്തിയിട്ടുണ്ട്`,
        };
        
        setMessage(statusMessages[voter.status] || (language === 'en'
          ? `${voter.name_en} (S.No: ${voter.serial_no}) status is not Active`
          : `${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) സ്റ്റാറ്റസ് സജീവമല്ല`
        ));
        setMessageType('error');
        setSerialNo('');
        inputRef.current?.focus();
        return;
      }

      // Mark as voted
      await votersAPI.update(voter.id, { has_voted: true });

      // Add to marked voters list (at the top)
      setMarkedVoters(prev => [{
        id: voter.id,
        serial_no: voter.serial_no,
        name_en: voter.name_en,
        name_ml: voter.name_ml,
        house_name_en: voter.house_name_en,
        house_name_ml: voter.house_name_ml,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev]);

      setMessage(language === 'en'
        ? `✓ ${voter.name_en} (S.No: ${voter.serial_no}) marked as voted`
        : `✓ ${voter.name_ml || voter.name_en} (ക്രമ നം: ${voter.serial_no}) വോട്ട് ചെയ്തതായി അടയാളപ്പെടുത്തി`
      );
      setMessageType('success');
      setSerialNo('');
      inputRef.current?.focus();

    } catch (err) {
      console.error('Data entry error:', err);
      setMessage(language === 'en' 
        ? 'Failed to update voter status' 
        : 'വോട്ടർ സ്റ്റാറ്റസ് അപ്ഡേറ്റ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു'
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (checkingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">
          {language === 'en' ? 'Loading...' : 'ലോഡ് ചെയ്യുന്നു...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {language === 'en' ? 'Quick Data Entry' : 'ക്വിക്ക് ഡാറ്റ എൻട്രി'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'en' 
            ? 'Enter serial number to mark voter as voted' 
            : 'വോട്ടർ വോട്ട് ചെയ്തതായി അടയാളപ്പെടുത്താൻ സീരിയൽ നമ്പർ നൽകുക'}
        </p>
      </div>

      {/* Voting Disabled Warning */}
      {!votingEnabled && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900">
                {language === 'en' ? 'Voting is Disabled' : 'വോട്ടിംഗ് പ്രവർത്തനരഹിതമാണ്'}
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                {language === 'en' 
                  ? 'Data entry is currently disabled. Please enable voting from settings to continue.' 
                  : 'ഡാറ്റ എൻട്രി നിലവിൽ പ്രവർത്തനരഹിതമാണ്. തുടരാൻ ക്രമീകരണങ്ങളിൽ നിന്ന് വോട്ടിംഗ് പ്രവർത്തനക്ഷമമാക്കുക.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Card */}
      <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                {language === 'en' ? 'Serial Number' : 'സീരിയൽ നമ്പർ'}
              </div>
            </label>
            <input
              ref={inputRef}
              type="number"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || !votingEnabled}
              placeholder={language === 'en' ? 'Enter serial number and press Enter' : 'സീരിയൽ നമ്പർ നൽകി എന്റർ അമർത്തുക'}
              className="w-full px-6 py-4 text-2xl border-2 border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-md ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium">{message}</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {language === 'en' 
              ? '💡 Tip: Type the serial number and press Enter to quickly mark voters' 
              : '💡 നുറുങ്ങ്: സീരിയൽ നമ്പർ ടൈപ്പ് ചെയ്ത് എന്റർ അമർത്തി വേഗത്തിൽ വോട്ടർമാരെ അടയാളപ്പെടുത്തുക'}
          </p>
        </form>
      </div>

      {/* Statistics */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {language === 'en' ? 'Marked in this session' : 'ഈ സെഷനിൽ അടയാളപ്പെടുത്തിയത്'}
            </p>
            <p className="text-3xl font-bold text-primary mt-1">{markedVoters.length}</p>
          </div>
          <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
        </div>
      </div>

      {/* Recently Marked Voters Table */}
      {markedVoters.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              {language === 'en' ? 'Recently Marked Voters' : 'അടുത്തിടെ അടയാളപ്പെടുത്തിയ വോട്ടർമാർ'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'Time' : 'സമയം'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'S.No' : 'ക്രമ നം'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'Name' : 'പേര്'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    {language === 'en' ? 'House Name' : 'വീട്ടുപേര്'}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {language === 'en' ? 'Status' : 'സ്റ്റാറ്റസ്'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {markedVoters.map((voter, index) => (
                  <tr
                    key={`${voter.id}-${index}`}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {voter.timestamp}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {voter.serial_no}
                    </td>
                    <td className="py-3 px-4">
                      {language === 'en' ? voter.name_en : voter.name_ml || voter.name_en}
                    </td>
                    <td className="py-3 px-4">
                      {language === 'en' ? voter.house_name_en : voter.house_name_ml || voter.house_name_en}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        {language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തു'}
                      </span>
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
