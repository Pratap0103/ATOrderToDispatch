import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Building, Phone, Mail, MapPin, Trash2, Edit2, Filter } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';
/* deleted import */

const dummyData = [
  { name: "ATW LALCHAND JEWELLERS DURG", number: "9425557772", shortName: "RAMESH KUMAR", city: "" },
  { name: "JF HARSH JEWELLERS 7354955600", number: "7354955600", shortName: "HARSH JEWELLERS", city: "Raipur" },
  { name: "JF ROBIN JEWELLERS 9439081784", number: "9439081784", shortName: "ROBIN JEWELLERS", city: "" },
  { name: "JF NEW PAWAN JEW 7587133520", number: "7587133520", shortName: "VICKY SONI", city: "Bhanupratappur" },
  { name: "A T G M KALEM M K KIRUPA", number: "9791992277", shortName: "", city: "" },
  { name: "A.T Bhopal", number: "9575810111", shortName: "SIDDHARTH BARADIA", city: "Raipur" },
  { name: "AASHIRWAD ORNAMENTS", number: "9309727672", shortName: "RAJESH JHAWAERI", city: "Nagpur" },
  { name: "AASHTA JEWELLERS", number: "7879888400", shortName: "SHUBHAM SONI", city: "" },
  { name: "AB JEWELLERS", number: "9691524200", shortName: "", city: "Raipur" },
  { name: "ABHILASH JEWELLERS", number: "9893021892", shortName: "ABHILASH SONI", city: "Kharod" },
  { name: "ADARSH JEWELLERS", number: "9644637770", shortName: "", city: "Balod" },
  { name: "ADINATH JEWELLERS", number: "9425511275", shortName: "SATISH JI", city: "Raipur" },
  { name: "ADITYA", number: "9981193081", shortName: "", city: "Jagdalpur" },
  { name: "Aditya Birla group", number: "9920782112", shortName: "", city: "" },
  { name: "Aditya Birla jewellery", number: "7406660470", shortName: "", city: "" },
  { name: "Agarwal jew", number: "9839173155", shortName: "", city: "" },
  { name: "Agj jewellers", number: "9313814589", shortName: "", city: "" },
  { name: "Agrawal gold jewellery", number: "8718166600", shortName: "", city: "" },
  { name: "AGRAWAL JEW", number: "7089108804", shortName: "", city: "" },
  { name: "AHUJA JEWELLERS", number: "7694931100", shortName: "MANISH AHUJA", city: "Balaghat" },
  { name: "Aisshppr jewellers Gorakhpur", number: "98920073", shortName: "", city: "" },
  { name: "Aisshppra jewellers", number: "9451189786", shortName: "", city: "" },
  { name: "AISSHPRA GEMS AND JEW", number: "8069451360", shortName: "", city: "" },
  { name: "AJAY JI GOLCHA KD", number: "9827147804", shortName: "", city: "Raipur" },
  { name: "Ajinkya", number: "9876543211", shortName: "", city: "Haflong" },
  { name: "Akash jewellers Bhopal", number: "9827332929", shortName: "", city: "" },
  { name: "AKHAND JEWELLERS", number: "9685282087", shortName: "", city: "Beohari" },
  { name: "Alagar Jewellers Tuticorin", number: "9843088916", shortName: "", city: "" },
  { name: "Alankar jewellers", number: "9630366266", shortName: "", city: "" },
  { name: "Alankar jewellers jbl", number: "9993222295", shortName: "", city: "" },
  { name: "Alka jewellers sarangarh", number: "9300788888", shortName: "", city: "" },
  { name: "AMANTRAN JEW", number: "9424204592", shortName: "", city: "Dhamtari" },
  { name: "Amar jewellers", number: "9827182084", shortName: "", city: "" },
  { name: "Ambica jewellers", number: "7405461184", shortName: "moxesh ji", city: "" },
  { name: "AMIT JEWELLERS", number: "9174584637", shortName: "AMIT SAHU", city: "Sakti" },
  { name: "Amrit jeweller rajat", number: "9999931264", shortName: "", city: "" },
  { name: "AMRIT JEWELLERS", number: "8103652100", shortName: "VANDANA GUPTA", city: "Bilaspur" },
  { name: "Anand Kumar pyare Lal jewellers", number: "9389457138", shortName: "", city: "" },
  { name: "Anand ornaments", number: "9414978531", shortName: "", city: "" },
  { name: "Anand ornaments jewellers", number: "7615050502", shortName: "", city: "" },
  { name: "ANANT JEWELLERS", number: "7008087693", shortName: "USHA GUPTA", city: "" },
  { name: "Anil bhaiya", number: "9826047111", shortName: "", city: "" },
  { name: "Anil kumar ranish kumar jain jeweller", number: "9838204437", shortName: "", city: "" },
  { name: "ANIL SONI", number: "7909879099", shortName: "ASHISH SONI", city: "Champa" },
  { name: "Anish", number: "7977938619", shortName: "", city: "" },
  { name: "Anit", number: "9820217559", shortName: "", city: "" },
  { name: "ANJALI JEWELLERS", number: "9907981908", shortName: "", city: "" },
  { name: "anjelous faliro", number: "7738006164", shortName: "", city: "" },
  { name: "ANKIT JI", number: "9827488880", shortName: "", city: "Dhamtari" },
  { name: "ankit sir", number: "9826447111", shortName: "ankit", city: "" },
  { name: "ANKITA JI", number: "7024613777", shortName: "", city: "Raipur" },
  { name: "ANUP JEWELLERS", number: "9827364182", shortName: "ANUP SONI", city: "Bhatapara" },
  { name: "Anutex ji size 2/6/2/8", number: "9246612121", shortName: "", city: "" },
  { name: "ARCHANA JEWELLERS", number: "9752626622", shortName: "", city: "Rajnandgaon" },
  { name: "ARIHANT JEW", number: "7427819049", shortName: "", city: "Bhilai" },
  { name: "ARIHANT JEWELLERS", number: "9617950000", shortName: "", city: "" },
  { name: "Arundhati jewellers Odisha", number: "762845531", shortName: "", city: "" },
  { name: "ASHISH JEWELLER", number: "7999242369", shortName: "", city: "" },
  { name: "ASHISH JEWELLERS", number: "9993851122", shortName: "", city: "Rajnandgaon" },
  { name: "ASHISH SONI BALODA BAZAR", number: "8962627960", shortName: "", city: "Baloda Bazar" },
  { name: "Ashram jeweller siliguri", number: "8651044044", shortName: "", city: "" },
  { name: "AT BSP MUKESH JAIN", number: "9907028271", shortName: "MUKESH JI", city: "Bilaspur" },
  { name: "AT GONDIA", number: "7498315497", shortName: "PANKAJ CHOPDA", city: "Gondia" },
  { name: "At Korba jewellers", number: "9826472228", shortName: "", city: "" },
  { name: "AT KOTWALI", number: "9827547111", shortName: "DEEPA MAM", city: "" },
  { name: "AT KUSHAL", number: "8871215036", shortName: "", city: "" },
  { name: "AT LLP RAIPUR", number: "9893210111", shortName: "", city: "Bhopal" },
  { name: "AT LLP Sadar", number: "8359032222", shortName: "AT LLP Sadar", city: "Raipur" },
  { name: "AT MUKESH BATHIA", number: "7000324266", shortName: "", city: "Bilaspur" },
  { name: "AT PANDRI ZURRICK SIR", number: "9754247111", shortName: "", city: "Raipur" },
  { name: "AT YASH", number: "9131358220", shortName: "", city: "" },
  { name: "ATG PRAVESH JI", number: "9425243160", shortName: "", city: "" },
  { name: "ATISHAY JEW", number: "9425200436", shortName: "", city: "Rajnandgaon" },
  { name: "ATMARAM BALMUKUND JEWELLERS", number: "9425540989", shortName: "MUKUND SONI", city: "" },
  { name: "ATO PANDRI", number: "9584547111", shortName: "ATO PANDRI", city: "Raipur" },
  { name: "ATP MUM OFFICE", number: "9167147111", shortName: "", city: "" },
  { name: "Atpl Nitesh bhai", number: "9329307070", shortName: "", city: "" },
  { name: "ATW ANKUR ABHUSHAN", number: "9407737777", shortName: "", city: "Dhamtari" },
  { name: "ATW ASHISH BAID", number: "9406371730", shortName: "ASHISH BAID", city: "Rajnandgaon" },
  { name: "ATW BAID JEWELLERS", number: "9827179000", shortName: "KAMLESH JI", city: "Rajnandgaon" },
  { name: "ATW PLASH", number: "8435105513", shortName: "", city: "Raipur" },
  { name: "ATW POOJA JEW", number: "9301222226", shortName: "ATW Nilesh Kesharwani", city: "Sarangarh" },
  { name: "ATW RAJVEER JEW SHEVNI NARAYAN", number: "9424173478", shortName: "RAJVEER JEW SHEVNI NARAYAN", city: "" },
  { name: "ATW RAMSA JEWELLERS", number: "9826193081", shortName: "RAMSA JEWELLERS", city: "Raipur" },
  { name: "ATW RISHABH JEWELLERS", number: "7647055206", shortName: "RISHABH JEWELLERS SUKMA", city: "Urla" },
  { name: "ATW SHREE JEW TIRORA GONDIA", number: "9422934906", shortName: "SHREE JEW TIRORA GONDIA", city: "" },
  { name: "ATW ABHAY BARADIA DHAMTARI", number: "9425516140", shortName: "ABHAY BARADIA DHAMTARI", city: "Dhamtari" },
  { name: "ATW ABHIESHEK KESHRI", number: "9993607713", shortName: "ABHISEK JI", city: "" },
  { name: "ATW Abhusahn Jew", number: "7770899555", shortName: "ANSHUAL SONI", city: "Ambikapur" },
  { name: "ATW ABHUSHAN JEWELLERS BARGARH", number: "9438015145", shortName: "", city: "Bargarh" },
  { name: "ATW ADI GOLD HOME", number: "8770740407", shortName: "ADI GOLD HOME", city: "" },
  { name: "ATW ADITYA JEW", number: "9340643259", shortName: "ATW DALICHAND JAIN JI", city: "Jagdalpur" },
  { name: "ATW Aditya Soni", number: "8982868271", shortName: "ATW Aditya Soni", city: "Burhar" },
  { name: "ATW Ajay Bothra", number: "9893150797", shortName: "AJAY JI BOTHROA", city: "Kawardha" },
  { name: "ATW ALKA JEWELLERS", number: "9977382737", shortName: "", city: "Raipur" },
  { name: "ATW AMRIT JEW", number: "8435811119", shortName: "AMRIT JEW BILASPUR", city: "Bilaspur" },
  { name: "ATW ANIL JEW BALODA BAZAR", number: "9826750770", shortName: "ANIL JEW BALODA BAZAR", city: "Baloda Bazar" },
  { name: "ATW Anil Kumar Sahoo", number: "9438067636", shortName: "Anil Kumar Sahoo", city: "Balangir" },
  { name: "ATW ANUPAM JEWELLERS", number: "7728932715", shortName: "", city: "Korba" },
  { name: "ATW ARIHANT JEWELLERS", number: "8839930265", shortName: "ARIHANT JEWELLERS", city: "Kanker" },
  { name: "ATW ARUN ABHUSAN BHANDAR", number: "9425540716", shortName: "ARUN ABHUSAN BHANDAR", city: "" },
  { name: "ATW ASHIRWAD JEWELLERS", number: "8319023500", shortName: "ASHIRWAD JEWELLERS", city: "Champa" },
  { name: "ATW Ashish Shakla", number: "8839247622", shortName: "ASHISH SHAKLA", city: "Durg" },
  { name: "ATW BALAJI JEWELLERS", number: "7879433327", shortName: "PRANSHU JI", city: "Mungeli" },
  { name: "ATW BASUNDRA JEW", number: "7978002039", shortName: "ATW Brajamohan Meher", city: "Bhawanipatna" },
  { name: "ATW BHAWANI JEWELLERS BACHELI", number: "9826689079", shortName: "JEWELLERS BHAWANI BACHELI", city: "Bade Bacheli" },
  { name: "ATW BRAJAMOHAN MEHER", number: "9437368058", shortName: "BRAJAMOHAN MEHER", city: "" },
  { name: "ATW BUDHRAM VIJAY", number: "7489872020", shortName: "", city: "Kharsia" },
  { name: "ATW CHANDERIYA JEWELLERS", number: "9300005143", shortName: "", city: "Kotma" },
  { name: "ATW DARSHAN JEWELLERS", number: "9826809170", shortName: "DARSHAN JEWELLERS", city: "" },
  { name: "ATW Deep Jewellers", number: "8103712200", shortName: "ATW Sanjay Soni", city: "Jashpurnagar" },
  { name: "ATW Deep Jewellers Gondiya", number: "9823713101", shortName: "Durga Soni", city: "" },
  { name: "ATW DEEPAK SONI", number: "9425211499", shortName: "DEEPAK SONI", city: "Arang" },
  { name: "ATW DHANLAXMI JEW", number: "91 99375 52807", shortName: "", city: "Junagarh" },
  { name: "ATW DHANLAXMI JEW KUMHARI", number: "9424272727", shortName: "LALIT JI", city: "Bhilai" },
  { name: "ATW DHARAM JEW BHILAI POWER HOUSE", number: "9893951110", shortName: "DHARAM JEW BHILAI POWER HOUSE", city: "Bhilai" },
  { name: "ATW DILIP JAIN", number: "9827470381", shortName: "ATW DILIP JAIN", city: "Bhilai" },
  { name: "ATW DINESH JEWELLERS BHAWANIPATNA", number: "7008239757", shortName: "DINESH AGARWAL", city: "" },
  { name: "ATW DISHA JEWELLERS", number: "8249825914", shortName: "", city: "Bhawanipatna" },
  { name: "ATW Dulha Dulhan Gold Palace", number: "9329475188", shortName: "ATW Ashutosh Saraf", city: "Kotma" },
  { name: "ATW GULAB JEWELLERS", number: "9827841769", shortName: "GULAB JEWELLERS", city: "" },
  { name: "ATW GULAB SINGH JEW", number: "7581888888", shortName: "ATW SHUBHAM JI HURA", city: "Takhatpur" },
  { name: "ATW HARISHANKAR JEWELLERS", number: "8839165008", shortName: "HARISHANKAR JEWELLERS", city: "" },
  { name: "ATW JAI DURGA JEWEL BANKIMONGRA", number: "9827109109", shortName: "JAI DURGA JEWEL BANKIMONGRA", city: "" },
  { name: "ATW JAI JEWELLERS", number: "9691630934", shortName: "", city: "Bhilai" },
  { name: "ATW JAIN JEWELLERS RAJ", number: "9827150010", shortName: "HARSH JI", city: "Rajnandgaon" },
  { name: "ATW JAYANT BAID", number: "9556899251", shortName: "JAYANT BAID", city: "" },
  { name: "ATW JHABAK JEWELLERS", number: "7415001000", shortName: "JHABAK JEWELLERS", city: "Raipur" },
  { name: "ATW KANGANA", number: "9770683030", shortName: "KANGNA", city: "Bhilai" },
  { name: "ATW Khilawan Soni", number: "9098855007", shortName: "Khilawan Soni", city: "" },
  { name: "ATW KHOMILAL SONI", number: "7415277971", shortName: "KHOMILALJ JI", city: "Shivrinarayan" },
  { name: "ATW KISHOR JEWELLERS", number: "9406011239", shortName: "KISHOR JEWELLERS", city: "Rajnandgaon" },
  { name: "ATW KISHOR SONI WARASEONI", number: "9893313945", shortName: "KISHOR SONI WARASEONI", city: "" },
  { name: "ATW KISHORE SONI", number: "9575027222", shortName: "KISHORE JI", city: "Waraseoni" },
  { name: "ATW KRISHNA JEW", number: "9301326580", shortName: "KRISHNA JEWELLERS", city: "Bhilai" },
  { name: "ATW KRISHNA JEWELLERS", number: "9907476872", shortName: "KOMAL JI", city: "Champa" },
  { name: "ATW LAXMI ALANKAR", number: "6260838309", shortName: "", city: "" },
  { name: "ATW LAXMI JEWEL", number: "9658940985", shortName: "LAXMI JEWEL", city: "Dharamjaigarh" },
  { name: "ATW LAXMI JEWELLERS DHARAMGARH", number: "9437293592", shortName: "SANJU BHIYA JI", city: "" },
  { name: "ATW LOKNATH JEW", number: "9406000589", shortName: "LOKNATH JEW", city: "Kanker" },
  { name: "ATW MAA JEW", number: "8871129766", shortName: "MAA JEW", city: "Keshkal" },
  { name: "ATW MADAN JEW", number: "9713400089", shortName: "MADAN JEW", city: "Durg" },
  { name: "ATW MAHAVEER GOLD PLACE", number: "9406093599", shortName: "PRAVEEN JAIN", city: "Bhanupratappur" },
  { name: "ATW MAHAVIR JEW BHILAI", number: "8109519000", shortName: "SANJAY JI", city: "Bhilai" },
  { name: "ATW MAHESWARI GOLD", number: "9938997975", shortName: "SANJIT JI", city: "" },
  { name: "ATW MALU JEWELLERS", number: "9131472255", shortName: "RAJESH JI", city: "Mahasamund" },
  { name: "ATW MOOLSHRI JEW BARHI KATNI", number: "9826390340", shortName: "MOOLSHRI JEW BARHI KATNI", city: "" },
  { name: "ATW MURLI JEW", number: "8889966666", shortName: "ATW MURLI JEW", city: "Sarangarh" },
  { name: "ATW N K JEWELLERS", number: "9691304444", shortName: "KHOMILALJ JI", city: "Shivrinarayan" },
  { name: "ATW New Agarwal Jew sundergarh", number: "7504379311", shortName: "ATW Rohan", city: "Sundargarh" },
  { name: "ATW NEW LALDAS JEWELLERS", number: "9893784801", shortName: "NEW LALDAS JEWELLERS", city: "" },
  { name: "ATW NIKET SONI", number: "7610244444", shortName: "NIKET JI", city: "Raipur" },
  { name: "ATW PARAS JEWELLERS", number: "9424114789", shortName: "PARAS JI", city: "Kawardha" },
  { name: "ATW PAYAL JEW", number: "9589909008", shortName: "", city: "Bhanupratappur" },
  { name: "ATW PR JEWELLERS TILDA", number: "9300618666", shortName: "PR JEWELLERS TILDA", city: "Tildanewra" },
  { name: "ATW PRADEEP JEW", number: "9907988224", shortName: "PRADEEP JEWE", city: "Shivrinarayan" },
  { name: "ATW PRAKASH JEW PALI KORBA", number: "9479241185", shortName: "PRAKASH JEW PALI KORBA", city: "" },
  { name: "ATW Priyatam Soni", number: "9691070009", shortName: "ATW Priyatam Soni", city: "Shivrinarayan" },
  { name: "ATW PUKHRAJ BABULAL", number: "9424275571", shortName: "PUKHRAJ BABULAL", city: "Sambalpur" },
  { name: "ATW PURVI JEWELLERS", number: "9777823436", shortName: "SANJU LUNIYA", city: "Nuapada" },
  { name: "ATW RADHESHYAM CHUNNILAL JEW", number: "9827079002", shortName: "RADHESHYAM CHUNNILAL JEW", city: "Shivrinarayan" },
  { name: "ATW RAJLAXMI JEWELLERS", number: "7846891093", shortName: "JAIDEV AGARWAL", city: "PADAMPUR" },
  { name: "ATW RAJU RAJA JEW", number: "9424146114", shortName: "RAJU RAJA", city: "Shivrinarayan" },
  { name: "ATW RAMESH CHOPRA KAWARDHA", number: "9425241177", shortName: "RAMESH CHOPRA", city: "Kawardha" },
  { name: "ATW RISHABH JEW", number: "9425286252", shortName: "RISHABH JEW", city: "Sukma" },
  { name: "JF AADARSH JEWELLERS", number: "7000131415", shortName: "ADARSH", city: "Rajnandgaon" },
  { name: "JF Aakash Agrawal", number: "9423415184", shortName: "Aakash Agrawal", city: "Gondia" },
  { name: "JF AASHISH JEWELLERS", number: "9893787781", shortName: "AASHISH", city: "" }
];

export const SEEDED_COMPANIES = dummyData.map((d, index) => ({
  id: `CO-${String(index + 1).padStart(3, '0')}`,
  name: d.name,
  number: d.number,
  shortName: d.shortName,
  city: d.city
}));

// CompanyDetails — v2 (embedded + standalone mode)

export default function CompanyDetails({
  externalSearch,
  externalFilters,
  onExternalFiltersChange,
  showMobileFilters: externalShowMobileFilters,
  onClearFilters,
  filtersOnly = false
}) {
  const isEmbedded = externalSearch !== undefined;

  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('master_companies_v3');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('master_companies_v3', JSON.stringify(SEEDED_COMPANIES));
    return SEEDED_COMPANIES;
  });

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Local filter state (used only in standalone mode)
  const [localFilters, setLocalFilters] = useState({
    searchQuery: '',
    companyName: [],
    location: [],
    emailDomain: []
  });
  const [localShowMobileFilters, setLocalShowMobileFilters] = useState(false);

  // Form State
  const [newCompany, setNewCompany] = useState({ name: '', number: '', shortName: '', city: '' });
  const [editCompany, setEditCompany] = useState({ id: '', name: '', number: '', shortName: '', city: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Resolved values (embedded vs standalone)
  const effectiveSearch = isEmbedded ? externalSearch : localFilters.searchQuery;
  const effectiveFilters = isEmbedded ? externalFilters : { companyName: localFilters.companyName, location: localFilters.location, emailDomain: localFilters.emailDomain };
  const showMobileFilters = isEmbedded ? externalShowMobileFilters : localShowMobileFilters;

  const setFilterField = (field, val) => {
    if (isEmbedded) {
      onExternalFiltersChange?.({ ...externalFilters, [field]: val });
    } else {
      setLocalFilters(p => ({ ...p, [field]: val }));
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    if (isEmbedded) {
      onExternalFiltersChange?.({ companyName: [], location: [], emailDomain: [] });
      onClearFilters?.();
    } else {
      setLocalFilters({ searchQuery: '', companyName: [], location: [], emailDomain: [] });
      setLocalShowMobileFilters(false);
      toast.success('Filters cleared');
    }
    setCurrentPage(1);
  };

  // CRUD handlers
  const handleAddCompanySubmit = (e) => {
    e.preventDefault();
    if (!newCompany.name.trim() || !newCompany.number.trim()) { toast.error('Company Name and Number are required!'); return; }
    const nameExists = companies.some(c => c.name.trim().toLowerCase() === newCompany.name.trim().toLowerCase());
    if (nameExists) { toast.error('A company with this name already exists!'); return; }
    const nextIdNumber = companies.length > 0 ? Math.max(...companies.map(c => parseInt(c.id.replace('CO-', ''), 10) || 0)) + 1 : 1;
    const newId = `CO-${String(nextIdNumber).padStart(3, '0')}`;
    const updated = [...companies, { id: newId, name: newCompany.name.trim(), number: newCompany.number.trim(), shortName: newCompany.shortName.trim() || newCompany.name.substring(0, 4).toUpperCase(), city: newCompany.city.trim() || 'Mumbai' }];
    setCompanies(updated);
    localStorage.setItem('master_companies_v3', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_companies_v3', newValue: JSON.stringify(updated) }));
    setNewCompany({ name: '', number: '', shortName: '', city: '' });
    setShowAddItemModal(false);
    toast.success('New company added successfully!');
  };

  const handleEditCompanySubmit = (e) => {
    e.preventDefault();
    if (!editCompany.name.trim() || !editCompany.number.trim()) { toast.error('Company Name and Number are required!'); return; }
    const nameExists = companies.some(c => c.id !== editCompany.id && c.name.trim().toLowerCase() === editCompany.name.trim().toLowerCase());
    if (nameExists) { toast.error('Another company with this name already exists!'); return; }
    const updated = companies.map(c => c.id === editCompany.id ? { ...editCompany } : c);
    setCompanies(updated);
    localStorage.setItem('master_companies_v3', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_companies_v3', newValue: JSON.stringify(updated) }));
    setShowEditItemModal(false);
    setSelectedCompany(null);
    toast.success('Company details updated successfully!');
  };

  const handleDeleteCompany = (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const updated = companies.filter(c => c.id !== id);
      setCompanies(updated);
      localStorage.setItem('master_companies_v3', JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: 'master_companies_v3', newValue: JSON.stringify(updated) }));
      toast.success('Company deleted successfully!');
    }
  };

  // Sync when another instance persists
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'master_companies_v3' && e.newValue) {
        try { setCompanies(JSON.parse(e.newValue)); } catch { }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleOpenEditModal = (company) => {
    setEditCompany({ ...company });
    setShowEditItemModal(true);
  };

  // Dropdown option lists
  const companyNamesList = useMemo(() => generateFilterOptions(companies, c => c.name), [companies]);
  const locationsList = useMemo(() => generateFilterOptions(companies, c => c.city), [companies]);
  const emailDomainsList = useMemo(() => generateFilterOptions(companies, c => c.shortName), [companies]);

  // Apply filters
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (effectiveFilters.companyName && effectiveFilters.companyName.length > 0 && !effectiveFilters.companyName.includes(c.name)) return false;

      if (effectiveFilters.location && effectiveFilters.location.length > 0) {
        if (!effectiveFilters.location.includes(c.city)) return false;
      }

      if (effectiveFilters.emailDomain && effectiveFilters.emailDomain.length > 0) {
        if (!effectiveFilters.emailDomain.includes(c.shortName)) return false;
      }

      if (effectiveSearch) {
        const q = effectiveSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q) || (c.shortName && c.shortName.toLowerCase().includes(q)) || (c.city && c.city.toLowerCase().includes(q));
      }
      return true;
    }).reverse();
  }, [companies, effectiveFilters, effectiveSearch]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tableHeaders = ["Serial No", "Company Name", "Number", "Short Name", "City", "Actions"];

  const renderRow = (company, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <tr key={company.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap uppercase">{company.name}</td>
        <td className="px-4 py-3 text-center text-xs text-amber-600 font-bold whitespace-nowrap">{company.number}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-700 whitespace-nowrap font-semibold uppercase tracking-wider">{company.shortName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{company.city}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <div className="flex justify-center items-center gap-2">
            <button onClick={() => handleOpenEditModal(company)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"><Edit2 size={14} /></button>
            <button onClick={() => handleDeleteCompany(company.id, company.name)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={14} /></button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (company, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <div key={company.id} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-amber-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{globalIdx}</span>
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[180px]">{company.name}</span>
          </div>
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">{company.id}</span>
        </div>
        <div className="space-y-1.5 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-gray-700"><Phone size={12} className="text-gray-400" /><span className="font-semibold">{company.number}</span></div>
          <div className="flex items-center gap-1.5 text-gray-700"><Building size={12} className="text-gray-400" /><span className="font-semibold uppercase">{company.shortName}</span></div>
          <div className="flex items-center gap-1.5 text-gray-700"><MapPin size={12} className="text-gray-400" /><span className="truncate">{company.city}</span></div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={() => handleOpenEditModal(company)} className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"><Edit2 size={10} /> Edit</button>
          <button onClick={() => handleDeleteCompany(company.id, company.name)} className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-red-200 text-red-700 rounded-md text-[10px] font-bold hover:bg-red-50 transition-all shadow-sm"><Trash2 size={10} /> Delete</button>
        </div>
      </div>
    );
  };

  // Shared modal JSX
  const modals = (
    <>
      <ModalForm isOpen={showAddItemModal} onClose={() => setShowAddItemModal(false)} title="Add New Company" onSubmit={handleAddCompanySubmit} submitText="Add Company" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Company Name *</label><div className="relative"><Building className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} placeholder="Enter company name" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" required /></div></div>
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Number *</label><div className="relative"><Phone className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={newCompany.number} onChange={e => setNewCompany({ ...newCompany, number: e.target.value })} placeholder="Enter contact number" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" required /></div></div>
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Short Name (Optional)</label><div className="relative"><Building className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={newCompany.shortName} onChange={e => setNewCompany({ ...newCompany, shortName: e.target.value })} placeholder="e.g. KLYN" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" /></div></div>
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">City (Optional)</label><div className="relative"><MapPin className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={newCompany.city} onChange={e => setNewCompany({ ...newCompany, city: e.target.value })} placeholder="Enter city" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" /></div></div>
        </div>
      </ModalForm>

      <ModalForm isOpen={showEditItemModal} onClose={() => setShowEditItemModal(false)} title="Edit Company Details" onSubmit={handleEditCompanySubmit} submitText="Save Changes" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Company Name *</label><div className="relative"><Building className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={editCompany.name} onChange={e => setEditCompany({ ...editCompany, name: e.target.value })} placeholder="Enter company name" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" required /></div></div>
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Number *</label><div className="relative"><Phone className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={editCompany.number} onChange={e => setEditCompany({ ...editCompany, number: e.target.value })} placeholder="Enter contact number" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" required /></div></div>
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Short Name</label><div className="relative"><Building className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={editCompany.shortName} onChange={e => setEditCompany({ ...editCompany, shortName: e.target.value })} placeholder="e.g. KLYN" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" /></div></div>
          <div className="space-y-1"><label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">City</label><div className="relative"><MapPin className="absolute left-2.5 top-[9px] text-gray-400" size={14} /><input type="text" value={editCompany.city} onChange={e => setEditCompany({ ...editCompany, city: e.target.value })} placeholder="Enter city" className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]" /></div></div>
        </div>
      </ModalForm>
    </>
  );

  // ── filtersOnly mode: render filter dropdowns + modals only (used in Master toolbar) ──
  if (filtersOnly) {
    return (
      <>
        <div className="flex-1 min-w-0 lg:min-w-[150px]">
          <SearchableDropdown options={companyNamesList}
            isMulti={true} value={effectiveFilters.companyName} onChange={val => setFilterField('companyName', val)} placeholder="All Companies" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
        </div>
        <div className="flex-1 min-w-0 lg:min-w-[150px]">
          <SearchableDropdown options={locationsList}
            isMulti={true} value={effectiveFilters.location} onChange={val => setFilterField('location', val)} placeholder="All Locations" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
        </div>
        <div className="flex-1 min-w-0 lg:min-w-[150px]">
          <SearchableDropdown options={emailDomainsList}
            isMulti={true} value={effectiveFilters.emailDomain} onChange={val => setFilterField('emailDomain', val)} placeholder="All Short Names" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
        </div>
        <button onClick={handleClearFilters} className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm" title="Clear Filters">
          <RotateCcw size={16} />
        </button>
      </>
    );
  }

  // ── Full page mode ──
  return (
    <div className={`${isEmbedded ? '' : 'p-0 sm:p-2 md:p-6 '}space-y-2 md:space-y-6 flex flex-col h-full min-h-0`}>

      {/* Hidden trigger (for standalone add button) */}
      <div className="hidden" id="company-add-trigger" onClick={() => setShowAddItemModal(true)} />

      {/* Standalone Header Toolbar — only shown when NOT embedded */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
          <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
            <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
                <input type="text" placeholder="Search companies..." value={localFilters.searchQuery} onChange={e => setLocalFilters(p => ({ ...p, searchQuery: e.target.value }))} className="w-full bg-white border border-gray-300 rounded-lg lg:rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]" />
              </div>
              <button onClick={() => setLocalShowMobileFilters(p => !p)} className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${localShowMobileFilters ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Toggle Filters"><Filter size={14} /></button>
              {!localShowMobileFilters && <button onClick={() => setShowAddItemModal(true)} className="lg:hidden flex items-center justify-center bg-amber-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"><Plus size={16} /></button>}
              <button onClick={handleClearFilters} className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"><RotateCcw size={14} /></button>
            </div>
            <div className={`${localShowMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
              <div className="flex-1 min-w-0 lg:min-w-[150px]"><SearchableDropdown options={companyNamesList}
                isMulti={true} value={localFilters.companyName} onChange={val => { setLocalFilters(p => ({ ...p, companyName: val })); setCurrentPage(1); }} placeholder="All Companies" height="h-[32px] md:h-[38px]" rounded="rounded-lg" /></div>
              <div className="flex-1 min-w-0 lg:min-w-[150px]"><SearchableDropdown options={locationsList}
                isMulti={true} value={localFilters.location} onChange={val => { setLocalFilters(p => ({ ...p, location: val })); setCurrentPage(1); }} placeholder="All Locations" height="h-[32px] md:h-[38px]" rounded="rounded-lg" /></div>
              <div className="flex-1 min-w-0 lg:min-w-[150px]"><SearchableDropdown options={emailDomainsList}
                isMulti={true} value={localFilters.emailDomain} onChange={val => { setLocalFilters(p => ({ ...p, emailDomain: val })); setCurrentPage(1); }} placeholder="All Short Names" height="h-[32px] md:h-[38px]" rounded="rounded-lg" /></div>
              <button onClick={handleClearFilters} className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm"><RotateCcw size={16} /></button>
            </div>
          </div>
          <button onClick={() => setShowAddItemModal(true)} className="hidden lg:flex bg-amber-600 hover:bg-amber-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"><Plus size={18} /></button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedCompanies}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1000px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredCompanies.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

      {modals}
    </div>
  );
}
