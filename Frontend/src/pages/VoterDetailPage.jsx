import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { votersAPI, settingsAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react';

export const VoterDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isAdmin } = useAuth();
  
  // Check if user is Level 1 volunteer or Overview user (read-only)
  const isLevel1 = user?.volunteer?.level === 'level1';
  const isLevel2 = user?.volunteer?.level === 'level2';
  const isOverview = user?.role === 'overview';
  const isReadOnly = isLevel1 || isOverview;
  
  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [votingEnabled, setVotingEnabled] = useState(false);
  
  // Editable fields
  const [status, setStatus] = useState('');
  const [party, setParty] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchVoter();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      setVotingEnabled(response.data.voting_enabled);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchVoter = async () => {
    try {
      setLoading(true);
      const response = await votersAPI.getById(id);
      const voterData = response.data;
      setVoter(voterData);
      
      // Set editable fields
      setStatus(voterData.status);
      setParty(voterData.party);
      setHasVoted(voterData.has_voted);
      setPhoneNumber(voterData.phone_number || '');
      setNotes(voterData.notes || '');
      
      setError(null);
    } catch (err) {
      setError('Failed to load voter details');
      console.error('Voter detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      
      await votersAPI.update(id, {
        status,
        party,
        has_voted: hasVoted,
        phone_number: phoneNumber,
        notes,
      });
      
      setSuccessMessage(language === 'en' ? 'Changes saved successfully!' : 'മാറ്റങ്ങൾ വിജയകരമായി സംരക്ഷിച്ചു!');
      
      // Refresh voter data
      await fetchVoter();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
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

  if (error && !voter) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'en' ? 'Back' : 'തിരികെ'}
        </button>
        <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!voter) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'en' ? 'Back to List' : 'ലിസ്റ്റിലേക്ക് മടങ്ങുക'}
        </button>
        
        {!isReadOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? (language === 'en' ? 'Saving...' : 'സംരക്ഷിക്കുന്നു...') : (language === 'en' ? 'Save Changes' : 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക')}
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Voter Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information - Read Only */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {language === 'en' ? 'Basic Information' : 'അടിസ്ഥാന വിവരങ്ങൾ'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Serial No.' : 'ക്രമ നം'}
                </label>
                <p className="text-lg font-semibold mt-1">{voter.serial_no}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'SEC ID' : 'SEC ID'}
                </label>
                <p className="text-lg font-semibold mt-1">{voter.sec_id}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Name' : 'പേര്'}
                </label>
                <p className="text-lg font-semibold mt-1">
                  {language === 'en' ? voter.name_en : voter.name_ml || voter.name_en}
                </p>
                {language === 'ml' && voter.name_en && (
                  <p className="text-sm text-muted-foreground mt-1">{voter.name_en}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? "Guardian's Name" : 'രക്ഷിതാവിന്റെ പേര്'}
                </label>
                <p className="text-base mt-1">
                  {language === 'en' ? voter.guardian_name_en : voter.guardian_name_ml || voter.guardian_name_en}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'House Name' : 'വീട്ടുപേര്'}
                </label>
                <p className="text-base mt-1">
                  {language === 'en' ? voter.house_name_en : voter.house_name_ml || voter.house_name_en}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{voter.old_ward_house_no}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Age' : 'പ്രായം'}
                </label>
                <p className="text-base mt-1">{voter.age}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Gender' : 'ലിംഗം'}
                </label>
                <p className="text-base mt-1">
                  {voter.gender === 'M' ? (language === 'en' ? 'Male' : 'പുരുഷൻ') : 
                   voter.gender === 'F' ? (language === 'en' ? 'Female' : 'സ്ത്രീ') : 
                   (language === 'en' ? 'Other' : 'മറ്റുള്ളവ')}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Information - Read-only for Level 1, Editable for Level 2 & Admin */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {language === 'en' ? 'Tracking Information' : 'ട്രാക്കിംഗ് വിവരങ്ങൾ'}
            </h2>
            
            {isReadOnly ? (
              /* Read-only view for Level 1 volunteers */
              <div className="space-y-4">
                {/* Status - Read Only */}
                <div className="border-b border-border pb-3">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {language === 'en' ? 'Status' : 'സ്റ്റാറ്റസ്'}
                  </label>
                  <p className="text-base font-medium">
                    {status === 'active' && (language === 'en' ? 'Active' : 'സജീവം')}
                    {status === 'out_of_station' && (language === 'en' ? 'Out of Station' : 'സ്റ്റേഷനു പുറത്ത്')}
                    {status === 'deceased' && (language === 'en' ? 'Deceased' : 'മരണപ്പെട്ടു')}
                    {status === 'postal_vote' && (language === 'en' ? 'Postal Vote' : 'തപാൽ വോട്ട്')}
                    {status === 'deleted' && (language === 'en' ? 'Deleted' : 'ഇല്ലാതാക്കി')}
                  </p>
                </div>

                {/* Division - Read Only */}
                <div className="border-b border-border pb-3">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {language === 'en' ? 'Division' : 'ഡിവിഷൻ'}
                  </label>
                  <p className="text-base font-medium">
                    {party === 'ldf' && (isOverview ? 'Division L' : 'Division A')}
                    {party === 'udf' && (isOverview ? 'Division U' : 'Division B')}
                    {party === 'bjp' && (isOverview ? 'Division B' : 'Division C')}
                    {party === 'other' && (isOverview ? 'Division O' : 'Division D')}
                    {party === 'unknown' && '-'}
                  </p>
                </div>

                {/* Voted Status - Read Only */}
                <div className="border-b border-border pb-3">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {language === 'en' ? 'Voting Status' : 'വോട്ടിംഗ് സ്റ്റാറ്റസ്'}
                  </label>
                  <div className="flex items-center gap-2">
                    {hasVoted ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-base font-medium text-green-600">
                          {language === 'en' ? 'Voted' : 'വോട്ട് ചെയ്തു'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-base font-medium text-orange-600">
                          {language === 'en' ? 'Not Voted' : 'വോട്ട് ചെയ്തിട്ടില്ല'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Phone Number - Read Only */}
                <div className="border-b border-border pb-3">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {language === 'en' ? 'Phone Number' : 'ഫോൺ നമ്പർ'}
                  </label>
                  <p className="text-base font-medium">
                    {phoneNumber || (language === 'en' ? 'Not provided' : 'നൽകിയിട്ടില്ല')}
                  </p>
                </div>

                {/* Notes - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {language === 'en' ? 'Notes' : 'കുറിപ്പുകൾ'}
                  </label>
                  <p className="text-base whitespace-pre-wrap">
                    {notes || (language === 'en' ? 'No notes' : 'കുറിപ്പുകളൊന്നുമില്ല')}
                  </p>
                </div>
              </div>
            ) : (
              /* Editable view for Level 2 and Admin */
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'en' ? 'Status' : 'സ്റ്റാറ്റസ്'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">{language === 'en' ? 'Active' : 'സജീവം'}</option>
                    <option value="out_of_station">{language === 'en' ? 'Out of Station' : 'സ്റ്റേഷനു പുറത്ത്'}</option>
                    <option value="deceased">{language === 'en' ? 'Deceased' : 'മരണപ്പെട്ടു'}</option>
                    <option value="postal_vote">{language === 'en' ? 'Postal Vote' : 'തപാൽ വോട്ട്'}</option>
                    <option value="deleted">{language === 'en' ? 'Deleted' : 'ഇല്ലാതാക്കി'}</option>
                  </select>
                </div>

                {/* Party/Division */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAdmin 
                      ? (language === 'en' ? 'Party' : 'പാർട്ടി')
                      : (language === 'en' ? 'Division' : 'ഡിവിഷൻ')
                    }
                  </label>
                  <select
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {isAdmin ? (
                      <>
                        <option value="ldf">LDF</option>
                        <option value="udf">UDF</option>
                        <option value="bjp">BJP</option>
                        <option value="other">{language === 'en' ? 'Other' : 'മറ്റുള്ളവ'}</option>
                        <option value="unknown">{language === 'en' ? 'Unknown' : 'അറിയില്ല'}</option>
                      </>
                    ) : (
                      <>
                        <option value="ldf">Division A</option>
                        <option value="udf">Division B</option>
                        <option value="bjp">Division C</option>
                        <option value="other">Division D</option>
                        <option value="unknown">-</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Voted */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVoted}
                      onChange={(e) => setHasVoted(e.target.checked)}
                      disabled={!votingEnabled}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium">
                      {language === 'en' ? 'Has Voted' : 'വോട്ട് ചെയ്തു'}
                    </span>
                    {hasVoted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </label>
                  {!votingEnabled && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'en' ? 'Voting is currently disabled. Admin must enable it from settings.' : 'വോട്ടിംഗ് നിലവിൽ പ്രവർത്തനരഹിതമാണ്. അഡ്മിൻ ക്രമീകരണങ്ങളിൽ നിന്ന് ഇത് പ്രവർത്തനക്ഷമമാക്കണം.'}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'en' ? 'Phone Number' : 'ഫോൺ നമ്പർ'}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={language === 'en' ? 'Enter phone number' : 'ഫോൺ നമ്പർ നൽകുക'}
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'en' ? 'Notes' : 'കുറിപ്പുകൾ'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'en' ? 'Add any notes...' : 'കുറിപ്പുകൾ ചേർക്കുക...'}
                  rows={4}
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Volunteer Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Assigned Volunteers' : 'നിയോഗിക്കപ്പെട്ട സന്നദ്ധപ്രവർത്തകർ'}
            </h3>
            
            <div className="space-y-4">
              {voter.level1_volunteer_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === 'en' ? 'Level 1 In-charge' : 'ലെവൽ 1 ചുമതലപ്പെടുത്തിയവർ'}
                  </label>
                  <p className="text-base mt-1">{voter.level1_volunteer_name}</p>
                </div>
              )}
              
              {voter.level2_volunteer_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === 'en' ? 'Level 2 In-charge' : 'ലെവൽ 2 ചുമതലപ്പെടുത്തിയവർ'}
                  </label>
                  <p className="text-base mt-1">{voter.level2_volunteer_name}</p>
                </div>
              )}
              
              {!voter.level1_volunteer_name && !voter.level2_volunteer_name && (
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'No volunteers assigned' : 'സന്നദ്ധപ്രവർത്തകരെ നിയോഗിച്ചിട്ടില്ല'}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Quick Info' : 'പെട്ടെന്നുള്ള വിവരം'}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Category' : 'വിഭാഗം'}
                </span>
                <span className="text-sm font-medium capitalize">{voter.category}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Last Updated' : 'അവസാനം അപ്ഡേറ്റ് ചെയ്തത്'}
                </span>
                <span className="text-sm font-medium">
                  {new Date(voter.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
