import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate PDF report of voted voters
 * @param {Array} voters - Array of voted voters with their details
 * @param {Object} stats - Statistics object with total and voted counts
 * @param {boolean} ldfOnly - Whether to filter for LDF voters only
 * @param {string} language - Language preference ('en' or 'ml')
 */
export const generateVotingStatusPDF = (voters, stats, ldfOnly = false, language = 'en') => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/[/:,\s]/g, '_');

  // Filter voters if LDF only
  const filteredVoters = ldfOnly 
    ? voters.filter(v => v.party === 'ldf')
    : voters;

  // Calculate statistics
  let totalVoters, votedCount, percentage;
  
  if (ldfOnly) {
    // For LDF: Sum up LDF voters from all Thara secretaries (level2_volunteer_stats)
    totalVoters = 0;
    if (stats.level2_volunteer_stats && Array.isArray(stats.level2_volunteer_stats)) {
      totalVoters = stats.level2_volunteer_stats.reduce((sum, volunteer) => {
        return sum + (volunteer.ldf_total || 0);
      }, 0);
    }
    
    votedCount = filteredVoters.length;
    percentage = totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0;
  } else {
    // For all voters
    totalVoters = stats.total_voters;
    votedCount = filteredVoters.length;
    percentage = totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0;
  }

  // Title
  const title = ldfOnly 
    ? (language === 'en' ? 'Ward 14 - LDF Voting Status Report' : 'വാർഡ് 14 - LDF വോട്ടിംഗ് സ്റ്റാറ്റസ് റിപ്പോർട്ട്')
    : (language === 'en' ? 'Ward 14 - Voting Status Report' : 'വാർഡ് 14 - വോട്ടിംഗ് സ്റ്റാറ്റസ് റിപ്പോർട്ട്');

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(title, 105, 15, { align: 'center' });

  // Subtitle with timestamp
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const reportTime = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  doc.text(`Generated: ${reportTime}`, 105, 22, { align: 'center' });

  // Statistics box
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Summary Statistics', 14, 32);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Total ${ldfOnly ? 'LDF ' : ''}Voters: ${totalVoters}`, 14, 40);
  doc.text(`Voted So Far: ${votedCount}`, 14, 47);
  doc.text(`Voting Percentage: ${percentage}%`, 14, 54);

  // Prepare table data
  const tableData = filteredVoters.map((voter, index) => {
    // Determine Thara (1-5) based on level2_volunteer ID
    // The level2_volunteer field contains the volunteer ID which corresponds to Thara number
    let thara = '-';
    
    if (voter.level2_volunteer) {
      // Map volunteer ID to Thara number
      // Assuming IDs 1-5 map to Thara 1-5
      thara = voter.level2_volunteer.toString();
    }

    // Format time voted
    const timeVoted = voter.time_voted 
      ? new Date(voter.time_voted).toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short'
        })
      : '-';

    return [
      index + 1,
      voter.serial_no,
      language === 'en' ? voter.name_en : (voter.name_ml || voter.name_en),
      thara,
      timeVoted
    ];
  });

  // Table headers
  const headers = language === 'en'
    ? [['#', 'Sl. No.', 'Name', 'Thara', 'Voted Time']]
    : [['#', 'ക്രമ നം', 'പേര്', 'താര', 'സമയം']];

  // Generate table
  doc.autoTable({
    startY: 62,
    head: headers,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 38, 38], // Red color
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },  // #
      1: { halign: 'center', cellWidth: 25 },  // Sl. No.
      2: { halign: 'left', cellWidth: 70 },    // Name
      3: { halign: 'center', cellWidth: 20 },  // Thara
      4: { halign: 'center', cellWidth: 50 }   // Voted Time
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 62, left: 14, right: 14 },
    didDrawPage: function(data) {
      // Footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });

  // Generate filename
  const fileTimestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  const filename = ldfOnly 
    ? `Ward14_PollingStatus_LDF_${fileTimestamp}.pdf`
    : `Ward14_PollingStatus_${fileTimestamp}.pdf`;

  // Save PDF
  doc.save(filename);
};
