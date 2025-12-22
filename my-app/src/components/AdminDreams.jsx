import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDreams.css';

function AdminDreams() {
  const [studentsData, setStudentsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const navigate = useNavigate();

  // Mock data based on your Google Sheets structure
  const mockData = [
    {
      id: 1,
      timestamp: "9/18/2025 9:19:00",
      namaLengkap: "Sabil",
      berapaBersaudara: "50",
      anakKe: "53",
      orangTuaLengkap: "Masih",
      terakhirTinggal: "Teman",
      dariKecilTinggal: "Ortu",
      orangBernilai: "Ilham",
      inginKatakan: "Ilham yok ngoding",
      akanDiberikan: "Perawat / Kaigo",
      kenapa: "Suka Makan",
      harapan: "Semoga HBD"
    },
    {
      id: 2,
      timestamp: "9/18/2025 10:30:00",
      namaLengkap: "Andi Pratama",
      berapaBersaudara: "3",
      anakKe: "2",
      orangTuaLengkap: "Masih",
      terakhirTinggal: "Orangtua",
      dariKecilTinggal: "Orangtua",
      orangBernilai: "Mama",
      inginKatakan: "Terima kasih sudah merawat aku dengan baik",
      akanDiberikan: "Rumah yang nyaman",
      kenapa: "Selalu ada saat aku butuh",
      harapan: "Semoga sehat selalu"
    },
    {
      id: 3,
      timestamp: "9/18/2025 11:45:00",
      namaLengkap: "Sari Dewi",
      berapaBersaudara: "2",
      anakKe: "1",
      orangTuaLengkap: "Tidak",
      terakhirTinggal: "Nenek",
      dariKecilTinggal: "Nenek",
      orangBernilai: "Nenek",
      inginKatakan: "Nenek adalah segalanya buat saya",
      akanDiberikan: "Biaya pengobatan terbaik",
      kenapa: "Dia yang membesarkan saya",
      harapan: "Semoga panjang umur"
    },
    {
      id: 4,
      timestamp: "9/18/2025 12:15:00",
      namaLengkap: "Budi Santoso",
      berapaBersaudara: "4",
      anakKe: "3",
      orangTuaLengkap: "Masih",
      terakhirTinggal: "Orangtua",
      dariKecilTinggal: "Orangtua",
      orangBernilai: "Papa",
      inginKatakan: "Papa adalah panutan hidup saya",
      akanDiberikan: "Modal usaha untuk expand bisnis",
      kenapa: "Dia yang mengajarkan kerja keras",
      harapan: "Semoga sukses terus"
    },
    {
      id: 5,
      timestamp: "9/18/2025 13:22:00",
      namaLengkap: "Maya Putri",
      berapaBersaudara: "1",
      anakKe: "1",
      orangTuaLengkap: "Tidak",
      terakhirTinggal: "Kakak",
      dariKecilTinggal: "Kakak",
      orangBernilai: "Kakak",
      inginKatakan: "Makasih kak sudah jadi orangtua kedua",
      akanDiberikan: "Apartemen yang nyaman",
      kenapa: "Dia yang membiayai sekolah saya",
      harapan: "Semoga bahagia dengan keluarganya"
    },
    {
      id: 6,
      timestamp: "9/18/2025 14:35:00",
      namaLengkap: "Rudi Hermawan",
      berapaBersaudara: "5",
      anakKe: "4",
      orangTuaLengkap: "Masih",
      terakhirTinggal: "Kost",
      dariKecilTinggal: "Ortu",
      orangBernilai: "Mama",
      inginKatakan: "Mama adalah malaikat di hidup saya",
      akanDiberikan: "Umroh dan haji",
      kenapa: "Pengorbanannya luar biasa",
      harapan: "Semoga selalu dalam lindungan Allah"
    }
  ];

  // Google Sheets configuration
  const SHEET_ID = '1z9wIVT8TmbOqeFwJHLUwE2P4mKEKG6g5pjmu1Xdx7Xw';
  const GID = '895465359';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  // Function to fetch data from Google Sheets
  const fetchGoogleSheetsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching data from Google Sheets...');
      
      // Use a CORS proxy to fetch the data
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(proxyUrl + encodeURIComponent(SHEET_URL));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('📄 Raw CSV data received:', csvText.substring(0, 200) + '...');
      
      // Parse CSV data
      const rows = csvText.split('\n').filter(row => row.trim());
      console.log(`📊 Found ${rows.length} rows`);
      
      if (rows.length < 2) {
        throw new Error('No data found in spreadsheet');
      }
      
      // Skip header row and parse data
      const dataRows = rows.slice(1);
      const parsedData = dataRows.map((row, index) => {
        // Parse CSV row handling quoted values
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            columns.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        columns.push(current.trim()); // Add last column
        
        // Map to our data structure - CHECK ORDER CAREFULLY based on real data
        // Real data example:
        // 9/19/2025 9:52:11, Sabil, 3, 5, Ada, Iya, Orang Tua, Orang Tua, Adhe, Teman kerja Lama, pengen makan bakso ikan, Bakso Ikan, , Semoga Dibawakan Bakso Ikan
        return {
          id: index + 1,
          timestamp: columns[0] || '',               // 9/19/2025 9:52:11
          namaLengkap: columns[1] || '',             // Sabil
          berapaBersaudara: columns[2] || '',        // 3
          anakKe: columns[3] || '',                  // 5
          orangTuaAda: columns[4] || '',             // Ada
          orangTuaBersama: columns[5] || '',         // Iya
          terakhirTinggal: columns[6] || '',         // Orang Tua
          dariKecilTinggal: columns[7] || '',        // Orang Tua
          orangBernilai: columns[8] || '',           // Adhe
          kenapa: columns[9] || '',                  // Teman kerja Lama
          inginKatakan: columns[10] || '',           // pengen makan bakso ikan
          akanDiberikan: columns[11] || '',          // Bakso Ikan
          email: columns[12] || '',                  // (empty)
          harapan: columns[13] || ''                 // Semoga Dibawakan Bakso Ikan
        };
      }).filter(item => item.namaLengkap); // Filter out empty rows
      
      console.log(`✅ Parsed ${parsedData.length} student records`);
      setStudentsData(parsedData);
      setFilteredStudents(parsedData);
      
    } catch (error) {
      console.error('❌ Error fetching Google Sheets data:', error);
      setError(error.message);
      
      // Fallback to mock data if Google Sheets fails
      console.log('📦 Falling back to mock data...');
      setStudentsData(mockData);
      setFilteredStudents(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleSheetsData();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    const filtered = studentsData.filter(student =>
      student.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.orangBernilai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.inginKatakan.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, studentsData]);

  const handleLogout = () => {
    navigate('/admin');
  };

  const handleViewDetail = (student) => {
    setSelectedStudent(student);
  };

  const handleCloseDetail = () => {
    setSelectedStudent(null);
  };

  const handleExportData = () => {
    // Create CSV with EXACTLY 14 columns (A to N) to match Google Sheets
    const headers = [
      'Timestamp',
      'Mohon isi nama lengkap Kamu',
      'Kamu berapa bersaudara kah?',
      'Kamu anak ke berapa kah?',
      'Apakah Bapak & Ibu Kandung masih ada?',
      'Apakah saat ini mereka masih tinggal bersama?',
      'Dengan siapa Kamu tinggal terakhir kalinya sebelum masuk SAMIT?',
      'Sejak kecil hingga dewasa, dengan siapa Kamu tinggal paling lama?',
      'Sebutkan satu saja, orang yang paling bernilai & bermakna di hidup Kamu selama ini',
      'Kenapa orang tersebut sangat begitu berharga & berarti di hidup Kamu?',
      'Apa yang ingin sekali Kamu katakan saat ini kepada orang tersebut?',
      'Jika suatu saat nanti Kamu telah sukses & semua cita-citamu tercapai, apa yang ingin sekali Kamu berikan kepada orang tersebut?',
      'Email Address',
      'Apa harapan Kamu terhadapnya terutama ketika nanti Kamu pergi jauh & sudah tinggal di Jepang?'
    ];
    
    // Debug: Log headers count
    console.log('Headers count:', headers.length);
    
    // Properly escape CSV data with quotes for fields containing commas
    const escapeCSV = (value) => {
      if (!value) return '""';
      const str = String(value);
      // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };
    
    // Create CSV content - EXACTLY 14 columns only
    const dataRows = filteredStudents.map(student => {
      const row = [
        escapeCSV(student.timestamp || ''),         // A: Timestamp
        escapeCSV(student.namaLengkap || ''),       // B: Nama lengkap
        escapeCSV(student.berapaBersaudara || ''),  // C: Berapa bersaudara
        escapeCSV(student.anakKe || ''),            // D: Anak ke
        escapeCSV(student.orangTuaAda || ''),       // E: Orang tua ada
        escapeCSV(student.orangTuaBersama || ''),   // F: Tinggal bersama
        escapeCSV(student.terakhirTinggal || ''),   // G: Terakhir tinggal
        escapeCSV(student.dariKecilTinggal || ''),  // H: Dari kecil tinggal
        escapeCSV(student.orangBernilai || ''),     // I: Orang bernilai
        escapeCSV(student.kenapa || ''),            // J: Kenapa berharga
        escapeCSV(student.inginKatakan || ''),      // K: Ingin katakan
        escapeCSV(student.akanDiberikan || ''),     // L: Akan diberikan
        escapeCSV(student.email || ''),             // M: Email
        escapeCSV(student.harapan || '')            // N: Harapan
      ];
      
      console.log('Row length:', row.length);
      return row.join(','); // Proper CSV with comma separator
    });
    
    // Escape headers too (they might contain commas)
    const escapedHeaders = headers.map(header => escapeCSV(header));
    const csvContent = [escapedHeaders.join(','), ...dataRows].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    // Create and download as proper CSV
    const blob = new Blob([csvWithBOM], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data-siswa-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert('✅ Data berhasil di-export ke CSV!\n\n📄 File CSV dengan proper escaping\n🔍 Exactly 14 columns (A to N)\n📝 Koma dalam teks sudah di-handle dengan benar!');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>📊 Mengambil data dari Google Sheets...</p>
          <p className="loading-detail">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>❌ Error Loading Data</h2>
          <p>Gagal mengambil data dari Google Sheets: {error}</p>
          <button 
            className="retry-btn" 
            onClick={fetchGoogleSheetsData}
          >
            🔄 Coba Lagi
          </button>
          <p className="fallback-note">
            📦 Menggunakan data fallback untuk demo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 Dashboard Admin - Data Siswa</h1>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="search-section">
          <div className="search-container">
            <div className="search-header">
              <input
                type="text"
                placeholder="🔍 Cari siswa berdasarkan nama, orang paling bernilai, atau pesan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="action-buttons">
                <div className="view-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                    onClick={() => setViewMode('card')}
                  >
                    📋 Card View
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    📊 Table View
                  </button>
                </div>
                <button className="refresh-btn" onClick={fetchGoogleSheetsData}>
                  🔄 Refresh
                </button>
                <button className="export-btn" onClick={handleExportData}>
                  📊 Export Excel
                </button>
              </div>
            </div>
            <div className="search-info">
              Menampilkan {filteredStudents.length} dari {studentsData.length} siswa
              <span className="data-source">📡 Data dari Google Sheets</span>
            </div>
          </div>
        </div>

        {viewMode === 'card' ? (
          <div className="students-grid">
            {filteredStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="student-header">
                  <h3>{student.namaLengkap}</h3>
                  <span className="timestamp">{student.timestamp}</span>
                </div>
                
                <div className="student-info">
                  <div className="info-item">
                    <strong>Berapa bersaudara:</strong> {student.berapaBersaudara} (Anak ke-{student.anakKe})
                  </div>
                  <div className="info-item">
                    <strong>Bapak & Ibu Kandung:</strong> {student.orangTuaAda} | Tinggal bersama: {student.orangTuaBersama}
                  </div>
                  <div className="info-item">
                    <strong>Orang paling bernilai:</strong> {student.orangBernilai}
                  </div>
                  <div className="info-item message">
                    <strong>Ingin katakan:</strong> "{student.inginKatakan}"
                  </div>
                  {student.email && (
                    <div className="info-item">
                      <strong>Email:</strong> {student.email}
                    </div>
                  )}
                </div>

                <button 
                  className="view-detail-btn"
                  onClick={() => handleViewDetail(student)}
                >
                  👁️ Lihat Detail
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Timestamp</th>
                    <th>Nama Lengkap</th>
                    <th>Bersaudara</th>
                    <th>Anak Ke</th>
                    <th>Orang Tua Ada</th>
                    <th>Orang Bernilai</th>
                    <th>Pesan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td className="timestamp-cell">{student.timestamp}</td>
                      <td className="name-cell">{student.namaLengkap}</td>
                      <td>{student.berapaBersaudara}</td>
                      <td>{student.anakKe}</td>
                      <td>{student.orangTuaAda}</td>
                      <td className="valuable-person-cell">{student.orangBernilai}</td>
                      <td className="message-cell">
                        <span className="message-preview">
                          {student.inginKatakan.length > 50 
                            ? student.inginKatakan.substring(0, 50) + '...' 
                            : student.inginKatakan}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="table-detail-btn"
                          onClick={() => handleViewDetail(student)}
                          title="Lihat Detail"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="no-results">
            <p>❌ Tidak ada siswa yang ditemukan dengan kriteria pencarian "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Siswa: {selectedStudent.namaLengkap}</h2>
              <button className="close-btn" onClick={handleCloseDetail}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>📝 Informasi Dasar</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Mohon isi nama lengkap Kamu:</label>
                    <span>{selectedStudent.namaLengkap}</span>
                  </div>
                  <div className="detail-item">
                    <label>Kamu berapa bersaudara kah?</label>
                    <span>{selectedStudent.berapaBersaudara}</span>
                  </div>
                  <div className="detail-item">
                    <label>Kamu anak ke berapa kah?</label>
                    <span>{selectedStudent.anakKe}</span>
                  </div>
                  <div className="detail-item">
                    <label>Apakah Bapak & Ibu Kandung masih ada?</label>
                    <span>{selectedStudent.orangTuaAda}</span>
                  </div>
                  <div className="detail-item">
                    <label>Apakah saat ini mereka masih tinggal bersama?</label>
                    <span>{selectedStudent.orangTuaBersama}</span>
                  </div>
                  {selectedStudent.email && (
                    <div className="detail-item">
                      <label>Email Address:</label>
                      <span>{selectedStudent.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>🏠 Informasi Tempat Tinggal</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Dengan siapa Kamu tinggal terakhir kalinya sebelum masuk SAMIT?</label>
                    <span>{selectedStudent.terakhirTinggal}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sejak kecil hingga dewasa, dengan siapa Kamu tinggal paling lama?</label>
                    <span>{selectedStudent.dariKecilTinggal}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>❤️ Orang yang Paling Bernilai</h3>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <label>Sebutkan satu saja, orang yang paling bernilai & bermakna di hidup Kamu selama ini:</label>
                    <span>{selectedStudent.orangBernilai}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Kenapa orang tersebut sangat begitu berharga & berarti di hidup Kamu?</label>
                    <span>{selectedStudent.kenapa}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Apa yang ingin sekali Kamu katakan saat ini kepada orang tersebut?</label>
                    <span>"{selectedStudent.inginKatakan}"</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Jika suatu saat nanti Kamu telah sukses & semua cita-citamu tercapai, apa yang ingin sekali Kamu berikan kepada orang tersebut?</label>
                    <span>{selectedStudent.akanDiberikan}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Apa harapan Kamu terhadapnya terutama ketika nanti Kamu pergi jauh & sudah tinggal di Jepang?</label>
                    <span>{selectedStudent.harapan}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDreams;