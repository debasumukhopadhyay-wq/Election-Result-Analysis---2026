// Script to generate REAL_CANDIDATES map from official 2026 candidate lists
const constituencies = require('../data/constituencies');

// Build lookup maps
const nameToId = {};          // normalized_name -> WB-XXX (first match)
const namePlusDistToId = {};  // normalized_name+district -> WB-XXX

constituencies.forEach(c => {
  const norm = s => s.toLowerCase().replace(/[-\s()]/g, '').replace(/[^a-z]/g, '');
  const key = norm(c.name);
  const key2 = key + norm(c.district);
  if (!nameToId[key]) nameToId[key] = c.id;
  namePlusDistToId[key2] = c.id;
});

function normStr(s) {
  return s.toLowerCase().replace(/[-\s()]/g, '').replace(/[^a-z]/g, '');
}

function findId(name, district) {
  const key = normStr(name);
  if (district) {
    const key2 = key + normStr(district);
    if (namePlusDistToId[key2]) return namePlusDistToId[key2];
  }
  if (nameToId[key]) return nameToId[key];
  // Partial match by prefix (min 5 chars)
  if (key.length >= 5) {
    for (const [k, id] of Object.entries(nameToId)) {
      if (k.startsWith(key.substring(0, 5)) || key.startsWith(k.substring(0, 5))) return id;
    }
  }
  return null;
}

// Manual overrides for names that differ between official and our system
// Format: official_name -> our WB-XXX id
const MANUAL_MAP = {
  'Mekliganj': 'WB-008', 'Mekhliganj': 'WB-008',
  'Kaliaganj': 'WB-034', 'Kaliyaganj': 'WB-034',
  'Baisnabnagar': 'WB-052', 'Baishnabnagar': 'WB-052',
  'Bharatpur': 'WB-069',    // Murshidabad - mapped to Hariharpara area
  'Kaliganj': 'WB-079',     // Nadia
  'Nakashipara': 'WB-080',  // Nadia - mapped to Chapra
  'Bagda': 'WB-093',        // North 24P - Bangaon Uttar area
  'Bijpur': 'WB-103',       // North 24P
  'Jagatdal': 'WB-116',     // North 24P - Jagaddal
  'Gosaba': 'WB-127',       // South 24P
  'Kulpi': 'WB-133',        // South 24P
  'Raidighi': 'WB-134',     // South 24P
  'Tollyganj': 'WB-136',    // Kolkata
  'Bhabanipur': 'WB-138',   // Kolkata - Bhowanipore
  'Chowrangee': 'WB-140',   // Kolkata
  'Saptagram': 'WB-193',    // Hooghly
  'Chanditala': 'WB-194',   // Hooghly
  'Haripal': 'WB-196',      // Hooghly
  'Mahisadal': 'WB-210',    // Purba Medinipur - Mahishadal
  'Mahishadal': 'WB-210',
  'Kanthi Uttar': 'WB-213', // Purba Medinipur - Contai Uttar
  'Kanthi Dakshin': 'WB-214', // Purba Medinipur - Contai Dakshin
  'Dantan': 'WB-219',       // Paschim Medinipur
  'Keshiary': 'WB-222',     // Paschim Medinipur/Jhargram
  'Garbeta': 'WB-233',      // Paschim Medinipur
  'Medinipur': 'WB-236',    // Midnapore
  'Bandwan': 'WB-237',      // Purulia/Bankura - Ranibandh area
  'Baghmundi': 'WB-251',    // Purulia - mapped to Jhalda area
  'Joypur': 'WB-252',       // Purulia
  'Katulpur': 'WB-245',     // Bankura - Kotulpur
  'Khandaghosh': 'WB-258',  // Purba Bardhaman
  'Bardhaman Dakshin': 'WB-263', // Purba Bardhaman - Burdwan Dakshin
  'Raina': 'WB-260',        // Purba Bardhaman
  'Bardhaman Uttar': 'WB-262', // Purba Bardhaman - Burdwan Uttar
  'Ketugram': 'WB-261',     // Purba Bardhaman
  'Mangalkot': 'WB-264',    // Purba Bardhaman
  'Pandabeswar': 'WB-275',  // Paschim Bardhaman - Pandaveswar
  'Nanoor': 'WB-286',       // Birbhum
  'Labpur': 'WB-288',       // Birbhum
};

// District hint map: AC number range -> district
// Used to disambiguate same-named constituencies in different districts
const AC_DISTRICT = {
  // South 24 Parganas: AC 127-157
  'Bishnupur': (ac) => ac >= 127 && ac <= 157 ? 'South 24 Parganas' : 'Bankura',
  'Kashipur': (ac) => ac >= 238 && ac <= 258 ? 'Purulia' : 'Purulia',
  'Raipur': (ac) => ac >= 238 && ac <= 258 ? 'Bankura' : 'Bankura',
  'Manbazar': (ac) => 'Purulia',
};

function resolveId(ac, name, party) {
  // Check manual map first
  if (MANUAL_MAP[name]) return MANUAL_MAP[name];
  // Check for same-name in different districts using AC range
  const distHint = AC_DISTRICT[name] ? AC_DISTRICT[name](ac) : null;
  return findId(name, distHint);
}

// Official TMC list: [AC, constituency, candidate]
const tmcList = [
[1,'Mekliganj','Paresh Chandra Adhikary'],[2,'Mathabhanga','Sablu Barman'],
[3,'Coochbehar Uttar','Partha Pratim Roy'],[4,'Coochbehar Dakshin','Avijit De Bhowmick'],
[5,'Sitalkuchi','Harihar Das'],[6,'Sitai','Sangita Roy Basunia'],[7,'Dinhata','Udayan Guha'],
[8,'Natabari','Sailen Barma'],[9,'Tufanganj','Shib Sankar Paul'],[10,'Kumargram','Rajeev Tirkey'],
[11,'Kalchini','Birendra Bara'],[12,'Alipurduar','Suman Kanjilal'],[13,'Falakata','Subhash Chandra Roy'],
[14,'Madarihat','Jayprakash Toppo'],[15,'Dhupguri','Nirmal Chandra Roy'],[16,'Maynaguri','Ram Mohan Roy'],
[17,'Jalpaiguri','Krishna Das'],[18,'Rajganj','Swapna Barman'],[19,'Dabgram Phulbari','Ranjan Shil Sharma'],
[20,'Mal','Bulu Chik Baraik'],[21,'Nagrakata','Sanjay Kujur'],
[25,'Matigara Naxalbari','Sankar Malakar'],[26,'Siliguri','Goutam Deb'],[27,'Phansidewa','Reena Toppo Ekka'],
[28,'Chopra','Hamidul Rahaman'],[29,'Islampur','Kanaia Lal Aggarwal'],[30,'Goalpokhar','Md. Ghulam Rabbani'],
[31,'Chakulia','Minhajul Arfin Azad'],[32,'Karandighi','Gautam Paul'],[33,'Hemtabad','Satyajit Barman'],
[34,'Kaliaganj','Nitai Baishya'],[35,'Raiganj','Krishna Kalyani'],[36,'Itahar','Mosaraf Hussain'],
[37,'Kushmandi','Rekha Roy'],[38,'Kumarganj','Toraf Hossain Mondal'],[39,'Balurghat','Arpita Ghosh'],
[40,'Tapan','Chintamoni Biha'],[41,'Gangarampur','Goutam Das'],[42,'Harirampur','Biplab Mitra'],
[43,'Habibpur','Amal Kisku'],[44,'Gazole','Prosenjit Das'],[45,'Chanchal','Prasun Banerjee'],
[46,'Harischandrapur','Md. Matebur Rahman'],[47,'Malatipur','Abdur Rahim Boxi'],[48,'Ratua','Samar Mukherjee'],
[49,'Manikchak','Kabita Mandal'],[50,'English Bazar','Asis Kundu'],[51,'Mothabari','Md. Najrul Islam'],
[52,'Sujapur','Sabina Yeasmin'],[53,'Baisnabnagar','Chandana Sarkar'],[54,'Farakka','Amirul Islam'],
[55,'Samserganj','Nur Alam'],[56,'Suti','Emani Biswas'],[57,'Jangipur','Jakir Hossain'],
[58,'Raghunathganj','Janab Akhruzzaman'],[59,'Sagardighi','Bayron Biswas'],[60,'Lalgola','Dr. Abdul Aziz'],
[61,'Bhagabangola','Reyaz Hussain Sarkar'],[62,'Raninagar','Soumik Hussain'],[63,'Murshidabad','Shaoni Singha Roy'],
[64,'Nabagram','Pranab Chandra Das'],[65,'Khargram','Ashish Marjit'],[66,'Burwan','Pratima Rajak'],
[67,'Kandi','Apurba Sarkar'],[68,'Bharatpur','Mustafizur Rahaman'],[69,'Rejinagar','Ataur Rahman'],
[70,'Beldanga','Rabiul Alam Chowdhury'],[71,'Baharampur','Naru Gopal Mukherjee'],
[72,'Hariharpara','Niamot Sheikh'],[73,'Nowda','Shahina Mumtaz'],[74,'Domkal','Humayun Kabir'],
[75,'Jalangi','Babar Ali'],[76,'Karimpur','Soham Chakraborty'],[77,'Tehatta','Dilip Poddar'],
[78,'Palashipara','Rukbanur Rahman'],[79,'Kaliganj','Alifa Ahmed'],[80,'Nakashipara','Kallol Kha'],
[81,'Chapra','Jeber Sekh'],[82,'Krishnanagar Uttar','Avinabha Bhattacharya'],[83,'Nabadwip','Pundarikakshya Saha'],
[84,'Krishnanagar Dakshin','Ujjwal Biswas'],[85,'Santipur','Braja Kishore Goswami'],
[86,'Ranaghat Uttar Paschim','Tapas Ghosh'],[87,'Krishnaganj','Samir Kumar Poddar'],
[88,'Ranaghat Uttar Purba','Barnali Dey Roy'],[89,'Ranaghat Dakshin','Dr. Sougata Kumar Barman'],
[90,'Chakdaha','Subhankar Singha'],[91,'Kalyani','Dr. Atindra Nath Mondal'],[92,'Haringhata','Dr. Rajib Biswas'],
[93,'Bagda','Madhupurna Thakur'],[94,'Bangaon Uttar','Biswajit Das'],[95,'Bangaon Dakshin','Rituparna Addhya'],
[96,'Gaighata','Narottam Biswas'],[97,'Swarupnagar','Bina Mondal'],[98,'Baduria','Burhanul Mokkadin'],
[99,'Habra','Jyotipriya Mallick'],[100,'Ashoknagar','Narayan Goswami'],[101,'Amdanga','Peerzada Kasem Siddiqui'],
[102,'Bijpur','Subodh Adhikary'],[103,'Naihati','Sanat Dey'],[104,'Bhatpara','Amit Gupta'],
[105,'Jagatdal','Somenath Shyam Ichini'],[106,'Noapara','Trinankur Bhattacharya'],
[107,'Barrackpore','Raju Chakrabarty'],[108,'Khardaha','Devdeep Purohit'],
[109,'Dum Dum Uttar','Chandrima Bhattacharya'],[110,'Panihati','Tirthankar Ghosh'],
[111,'Kamarhati','Madan Mitra'],[112,'Baranagar','Sayantika Banerjee'],[113,'Dum Dum','Bratya Basu'],
[114,'Rajarhat Newtown','Tapash Chatterjee'],[115,'Bidhannagar','Sujit Bose'],
[116,'Rajarhat Gopalpur','Aditi Munshi'],[117,'Madhyamgram','Rathin Ghosh'],[118,'Barasat','Sabyasachi Dutta'],
[119,'Deganga','Anisur Rahaman'],[120,'Haroa','Md. Mufti Abdul Matin'],[121,'Minakhan','Usha Rani Mondal'],
[122,'Sandeshkhali','Jharna Sardar'],[123,'Basirhat Dakshin','Surajit Mitra'],[124,'Basirhat Uttar','Md Tauseef Rehman'],
[125,'Hingalganj','Ananda Sarkar'],[126,'Gosaba','Subrata Mondal'],[127,'Basanti','Nilima Bishal Mistry'],
[128,'Kultali','Ganesh Chandra Mondal'],[129,'Patharpratima','Samir Kumar Jana'],[130,'Kakdwip','Manturam Pakhira'],
[131,'Sagar','Bankim Chandra Hazra'],[132,'Kulpi','Barnali Dhara'],[133,'Raidighi','Tapas Mondal'],
[134,'Mandirbazar','Joydeb Halder'],[135,'Jaynagar','Biswanath Das'],[136,'Baruipur Purba','Bivas Sardar'],
[137,'Canning Paschim','Paresh Ram Das'],[138,'Canning Purba','Md. Baharul Islam'],
[139,'Baruipur Paschim','Biman Banerjee'],[140,'Magrahat Purba','Sharmistha Purkait'],
[141,'Magrahat Paschim','Shamim Ahmed'],[142,'Diamond Harbour','Pannalal Halder'],[143,'Falta','Jahangir Khan'],
[144,'Satgachia','Somashree Betal'],[145,'Bishnupur','Dilip Mondal'],[146,'Sonarpur Dakshin','Arundhuti Maitra'],
[147,'Bhangar','Saokat Molla'],[148,'Kasba','Javed Ahmed Khan'],[149,'Jadavpur','Debabrata Majumdar'],
[150,'Sonarpur Uttar','Firdousi Begum'],[151,'Tollyganj','Aroop Biswas'],[152,'Behala Purba','Subhasish Chakraborty'],
[153,'Behala Paschim','Ratna Chatterjee'],[154,'Maheshtala','Subhasis Das'],[155,'Budge Budge','Ashok Kumar Deb'],
[156,'Metiabruz','Abdul Khaleque Molla'],[157,'Kolkata Port','Firhad Hakim'],[158,'Bhabanipur','Mamata Banerjee'],
[159,'Rashbehari','Debashis Kumar'],[160,'Ballygunge','Sovandeb Chattopadhyay'],[161,'Chowrangee','Nayna Bandopadhyay'],
[162,'Entally','Sandipan Saha'],[163,'Beleghata','Kunal Ghosh'],[164,'Jorasanko','Vijay Upadhyay'],
[165,'Shyampukur','Dr. Shashi Panja'],[166,'Maniktala','Shreya Pandey'],[167,'Kashipur Belgachhia','Atin Ghosh'],
[168,'Bally','Kailash Mishra'],[169,'Howrah Uttar','Goutam Chowdhury'],[170,'Howrah Madhya','Arup Roy'],
[171,'Shibpur','Dr Rana Chatterjee'],[172,'Howrah Dakshin','Nandita Choudhary'],[173,'Sankrail','Priya Paul'],
[174,'Panchla','Gulshan Mullick'],[175,'Uluberia Purba','Ritabrata Banerjee'],[176,'Uluberia Uttar','Bimal Kumar Das'],
[177,'Uluberia Dakshin','Pulak Roy'],[178,'Shyampur','Nadebasi Jana'],[179,'Bagnan','Arunava Sen'],
[180,'Amta','Sukanta Paul'],[181,'Udaynarayanpur','Samir Kumar Panja'],[182,'Jagatballavpur','Subir Chatterjee'],
[183,'Domjur','Tapas Maity'],[184,'Uttarpara','Sirsanya Bandopadhyay'],[185,'Sreerampur','Tanmoy Ghosh'],
[186,'Champdani','Arindam Guin'],[187,'Singur','Becharam Manna'],[188,'Chandannagar','Indranil Sen'],
[189,'Chunchura','Debangshu Bhattacharya'],[190,'Balagarh','Ranjan Dhara'],[191,'Pandua','Samir Chakraborty'],
[192,'Saptagram','Bidesh Bose'],[193,'Chanditala','Swati Khandoker'],[194,'Jangipara','Snehasis Chakraborty'],
[195,'Haripal','Dr. Karabi Manna'],[196,'Dhanekhali','Asima Patra'],[197,'Tarakeswar','Ramendu Singha Roy'],
[198,'Pursurah','Partha Hazari'],[199,'Arambag','Mita Bag'],[200,'Goghat','Dr. Nirmal Maji'],
[201,'Khanakul','Palash Roy'],[202,'Tamluk','Dipendra Narayan Roy'],[203,'Panskura Purba','Asim Kumar Maji'],
[204,'Panskura Paschim','Siraj Khan'],[205,'Moyna','Chandan Mondal'],[206,'Nandakumar','Sukumar Dey'],
[207,'Mahisadal','Tilak Kumar Chakraborty'],[208,'Haldia','Tapasi Mandal'],[209,'Nandigram','Pabitra Kar'],
[210,'Chandipur','Uttam Barik'],[211,'Patashpur','Pijus Kanti Panda'],[212,'Kanthi Uttar','Debasis Bhunia'],
[213,'Bhagabanpur','Manab Kumar Porua'],[214,'Khejuri','Rabin Chandra Mandal'],[215,'Kanthi Dakshin','Tarun Kr Jana'],
[216,'Ramnagar','Akhil Giri'],[217,'Egra','Tarun Maity'],[218,'Dantan','Manik Maity'],
[219,'Nayagram','Dulal Murmu'],[220,'Gopiballavpur','Ajit Mahata'],[221,'Jhargram','Mangal Soren'],
[222,'Keshiary','Ramjiban Mandi'],[223,'Kharagpur Sadar','Pradip Sarkar'],[224,'Narayangarh','Pratibha Rani Maity'],
[225,'Sabang','Manas Ranjan Bhunia'],[226,'Pingla','Ajit Maity'],[227,'Kharagpur','Dinen Roy'],
[228,'Debra','Rajib Banerjee'],[229,'Daspur','Asis Huda'],[230,'Ghatal','Shyamali Sardar'],
[231,'Chandrakona','Surjya Kanta Doloi'],[232,'Garbeta','Uttara Singha'],[233,'Salboni','Srikanta Mahata'],
[234,'Keshpur','Seuli Saha'],[235,'Medinipur','Sujoy Hazra'],[236,'Binpur','Birbaha Hansda'],
[237,'Bandwan','Rajib Lochan Saren'],[238,'Balarampur','Shantiram Mahato'],[239,'Baghmundi','Sushanta Mahato'],
[240,'Joypur','Arjun Mahato'],[241,'Purulia','Sujoy Banerjee'],[242,'Manbazar','Sandhya Rani Tudu'],
[243,'Kashipur','Soumen Beltharia'],[244,'Para','Manik Bauri'],[245,'Raghunathpur','Hazari Bauri'],
[246,'Saltora','Uttam Bauri'],[247,'Chhatna','Swapan Kumar Mandal'],[248,'Ranibandh','Dr. Tanushree Hansda'],
[249,'Raipur','Thakur Moni Soren'],[250,'Taldangra','Falguni Singhababu'],[251,'Bankura','Dr. Anup Mondal'],
[252,'Barjora','Goutam Mishra'],[253,'Onda','Subrata Dutta'],[254,'Bishnupur','Tanmoy Ghosh'],
[255,'Katulpur','Harakali Pratihar'],[256,'Indas','Shyamali Roy Bagdi'],[257,'Sonamukhi','Dr Kallol Saha'],
[258,'Khandaghosh','Nabin Chandra Bag'],[259,'Bardhaman Dakshin','Khokon Das'],[260,'Raina','Mandira Dalu'],
[261,'Jamalpur','Bhootnath Mallick'],[262,'Monteswar','Siddiqullah Chowdhury'],[263,'Kalna','Deboprasad Bag'],
[264,'Memari','Rasabihari Halder'],[265,'Bardhaman Uttar','Nisith Kumar Malik'],[266,'Bhatar','Shantanu Koner'],
[267,'Purbasthali Dakshin','Swapan Debnath'],[268,'Purbasthali Uttar','Vasundhara Goswami'],
[269,'Katwa','Rabindranath Chatterjee'],[270,'Ketugram','Sekh Sahanowaz'],[271,'Mangalkot','Apurba Chowdhury'],
[272,'Ausgram','Shyamaprasanna Lohar'],[273,'Galsi','Alok Kumar Majhi'],[274,'Pandabeswar','Narendranath Chakraborty'],
[275,'Durgapur Purba','Pradip Mazumdar'],[276,'Durgapur Paschim','Kavi Dutta'],[277,'Raniganj','Kalobaram Mondal'],
[278,'Jamuria','Hareram Singh'],[279,'Asansol Dakshin','Tapas Banerjee'],[280,'Asansol Uttar','Moloy Ghatak'],
[281,'Kulti','Abhijit Ghatak'],[282,'Barabani','Bidhan Upadhyay'],[283,'Dubrajpur','Chandra Naresh Bauri'],
[284,'Suri','Ujjal Chatterjee'],[285,'Bolpur','Chandranath Sinha'],[286,'Nanoor','Bidhan Chandra Majhi'],
[287,'Labpur','Abhijit Sinha'],[288,'Sainthia','Nilabati Saha'],[289,'Mayureswar','Abhijit Roy'],
[290,'Rampurhat','Asish Banerjee'],[291,'Hansan','Fayezul Haque'],[292,'Nalhati','Rajendra Prasad Singh'],
[293,'Murarai','Mosarraf Hossain']
];

const bjpList = [
[1,'Mekliganj','Dadhiram Roy'],[2,'Mathabhanga','Nisith Pramanik'],[3,'Coochbehar Uttar','Sukumar Roy'],
[5,'Sitalkuchi','Savitri Barman'],[7,'Dinhata','Ajay Roy'],[9,'Tufanganj','Malati Rava Roy'],
[10,'Kumargram','Manoj Kumar Oraon'],[11,'Kalchini','Bishal Lama'],[12,'Alipurduar','Paritosh Das'],
[13,'Falakata','Deepak Barman'],[14,'Madarihat','Lakshman Limbu'],[15,'Dhupguri','Naresh Chandra Roy'],
[16,'Maynaguri','Kaushik Roy'],[17,'Jalpaiguri','Ananta Deb Adhikary'],[19,'Dabgram Phulbari','Sikha Chatterjee'],
[20,'Mal','Sukra Munda'],[21,'Nagrakata','Puna Bhengra'],[22,'Kalimpong','Bharat Chetri'],
[23,'Darjeeling','Noman Rai'],[24,'Kurseong','Sonam Lama'],[25,'Matigara Naxalbari','Anandamay Barman'],
[26,'Siliguri','Shankar Ghosh'],[27,'Phansidewa','Durga Murmu'],[28,'Chopra','Shankar Adhikari'],
[30,'Goalpokhar','Sarjit Biswas'],[31,'Chakulia','Manoj Jain'],[32,'Karandighi','Biraj Biswas'],
[34,'Kaliaganj','Utpal Maharaj'],[35,'Raiganj','Kaushik Chowdhury'],[36,'Itahar','Sabita Barman'],
[37,'Kushmandi','Tapas Chandra Roy'],[38,'Kumarganj','Suvendu Sarkar'],[39,'Balurghat','Bidyut Roy'],
[40,'Tapan','Budhrai Tudu'],[41,'Gangarampur','Satyendra Nath Rai'],[42,'Harirampur','Debabrata Majumder'],
[43,'Habibpur','Joyel Murmu'],[44,'Gazole','Chinmoy Deb Barman'],[45,'Chanchal','Ratan Das'],
[46,'Harischandrapur','Ratan Das'],[47,'Malatipur','Ashish Das'],[48,'Ratua','Abhishek Singhania'],
[49,'Manikchak','Gaur Chandra Mandal'],[50,'English Bazar','Gopal Chandra Saha'],[51,'Mothabari','Nibaran Ghosh'],
[52,'Sujapur','Abhiraj Chaudhary'],[53,'Baisnabnagar','Raju Karmakar'],[54,'Farakka','Sunil Chowdhury'],
[55,'Samserganj','Shashthi Charan Ghosh'],[56,'Suti','Mahabir Ghosh'],[57,'Jangipur','Chitto Mukherjee'],
[58,'Raghunathganj','Surjit Poddar'],[59,'Sagardighi','Tapas Chakraborty'],[60,'Lalgola','Amar Kumar Das'],
[61,'Bhagawangola','Bhaskar Sarkar'],[62,'Raninagar','Rana Pratap Singh Roy'],[63,'Murshidabad','Gouri Sankar Ghosh'],
[64,'Nabagram','Dilip Saha'],[65,'Khargram','Mitali Mal'],[66,'Burwan','Sukhen Kumar Bagdi'],
[67,'Kandi','Gargi Das Ghosh'],[68,'Bharatpur','Anamika Ghosh'],[69,'Rejinagar','Bapan Ghosh'],
[70,'Beldanga','Bharat Kumar Jhawar'],[71,'Baharampur','Subrata Maitra'],[72,'Hariharpara','Tanmoy Biswas'],
[73,'Nowda','Rana Mandal'],[74,'Domkal','Nanda Dulal Pal'],[75,'Jalangi','Naba Kumar Sarkar'],
[76,'Karimpur','Samarendranath Ghosh'],[77,'Tehatta','Subrata Kabiraj'],[78,'Palashipara','Anima Dutta'],
[79,'Kaliganj','Bapan Ghosh'],[80,'Nakashipara','Shantanu Dey'],[81,'Chapra','Saikat Sarkar'],
[83,'Nabadwip','Sruti Sekhar Goswami'],[84,'Krishnanagar Dakshin','Sadhan Ghosh'],
[86,'Ranaghat Uttar Paschim','Parthasarathi Chatterjee'],[87,'Krishnaganj','Sukanta Biswas'],
[88,'Ranaghat Uttar Purba','Ashim Biswas'],[89,'Ranaghat Dakshin','Ashim Kumar Biswas'],
[90,'Chakdaha','Bankim Chandra Ghosh'],[92,'Haringhata','Asim Kumar Sarkar'],
[94,'Bangaon Uttar','Ashok Kirtania'],[95,'Bangaon Dakshin','Swapan Majumder'],[96,'Gaighata','Subrata Thakur'],
[97,'Swarupnagar','Tarak Saha'],[98,'Baduria','Sukriti Sarkar'],[99,'Habra','Debdas Mandal'],
[100,'Ashoknagar','Somoy Hira'],[101,'Amdanga','Arindam Dey'],[102,'Bijpur','Sudipta Das'],
[103,'Naihati','Sumitro Chatterjee'],[104,'Bhatpara','Pawan Kumar Singh'],[105,'Jagatdal','Rajesh Kumar'],
[106,'Noapara','Arjun Singh'],[107,'Barrackpore','Koustav Bagchi'],[108,'Khardaha','Kalyan Chakraborty'],
[111,'Kamarhati','Arup Choudhury'],[112,'Baranagar','Sajal Ghosh'],[113,'Dum Dum','Arijit Bakshi'],
[114,'Rajarhat New Town','Piyush Kanodia'],[115,'Bidhannagar','Sharadwat Mukhopadhyay'],
[116,'Rajarhat Gopalpur','Tarun Jyoti Tiwari'],[118,'Barasat','Sankar Chatterjee'],
[119,'Deganga','Tarun Kanti Ghosh'],[120,'Haroa','Bhaskar Mondal'],[121,'Minakhan','Rudrendra Patra'],
[122,'Sandeshkhali','Sanat Sardar'],[123,'Basirhat Dakshin','Suraj Banerjee'],[124,'Basirhat Uttar','Narayan Chandra Mondal'],
[125,'Hingalganj','Rekha Patra'],[126,'Gosaba','Vikarno Naskar'],[127,'Basanti','Bikash Sardar'],
[128,'Kultali','Madhabi Mahalder'],[129,'Patharpratima','Asit Kumar Haldar'],[130,'Kakdwip','Deepankar Jana'],
[131,'Sagar','Sumanta Mandal'],[132,'Kulpi','Abni Naskar'],[133,'Raidighi','Palash Rana'],
[134,'Mandirbazar','Mallika Paik'],[135,'Jaynagar','Alok Halder'],[136,'Baruipur Purba','Tumpa Sardar'],
[137,'Canning Paschim','Prasanta Bayen'],[138,'Canning Purba','Ashim Sapui'],
[139,'Baruipur Paschim','Biswajit Paul'],[141,'Magrahat Paschim','Gour Sundar Ghosh'],
[142,'Diamond Harbour','Dipak Kumar Halder'],[144,'Satgachia','Agniswar Naskar'],
[145,'Bishnupur','Viswajit Khan'],[146,'Sonarpur Dakshin','Roopa Ganguly'],
[147,'Bhangar','Jayanta Gayen'],[148,'Kasba','Sandeep Banerjee'],[149,'Jadavpur','Sarbori Mukherjee'],
[151,'Tollyganj','Papiya Adhikari'],[152,'Behala Purba','Sunil Maharaj'],[153,'Behala Paschim','Indranil Khan'],
[154,'Maheshtala','Tamanath Bhowmik'],[155,'Budge Budge','Tarun Kumar Adak'],[156,'Metiabruz','Veer Bahadur Singh'],
[158,'Bhabanipur','Suvendu Adhikari'],[159,'Rashbehari','Swapan Das Gupta'],[160,'Ballygunge','Dr. Shatrupa'],
[162,'Entally','Priyanka Tibrewal'],[163,'Beleghata','Partha Choudhary'],[164,'Jorasanko','Vijay Ojha'],
[165,'Shyampukur','Poornima Chakraborty'],[166,'Maniktala','Tapas Roy'],[167,'Kashipur Belgachhia','Ritesh Tiwari'],
[168,'Bally','Sanjay Singh'],[169,'Howrah Uttar','Umesh Rai'],[171,'Shibpur','Rudranil Ghosh'],
[173,'Sankrail','Barnali Dhali'],[176,'Uluberia Uttar','Chiran Bera'],[177,'Uluberia Dakshin','Mangalanand Puri Maharaj'],
[178,'Shyampur','Hiranmoy Chattopadhyay'],[179,'Bagnan','Premangshu Rana'],[180,'Amta','Amit Samanta'],
[181,'Udaynarayanpur','Prabhakar Pandit'],[182,'Jagatballavpur','Anupam Ghosh'],[183,'Domjur','Gobinda Hazra'],
[185,'Sreerampur','Bhaskar Bhattacharya'],[186,'Champdani','Dilip Singh'],[190,'Balagarh','Sumana Sarkar'],
[191,'Pandua','Tushar Kumar Majumdar'],[192,'Saptagram','Swaraj Ghosh'],[193,'Chanditala','Debasish Mukherjee'],
[194,'Jangipara','Prasenjit Bag'],[196,'Dhanekhali','Barnali Das'],[197,'Tarakeswar','Santu Pan'],
[198,'Pursurah','Biman Ghosh'],[199,'Arambag','Hemanta Bag'],[200,'Goghat','Prashanta Dighar'],
[201,'Khanakul','Susanta Ghosh'],[203,'Panskura Purba','Subrata Maity'],[204,'Panskura Paschim','Sintu Senapati'],
[205,'Moyna','Ashok Dinda'],[206,'Nandakumar','Nirmal Khanra'],[207,'Mahisadal','Subhash Panja'],
[208,'Haldia','Pradip Kumar Bijoli'],[209,'Nandigram','Suvendu Adhikari'],[211,'Patashpur','Tapan Maity'],
[212,'Kanthi Uttar','Sumita Sinha'],[213,'Bhagabanpur','Santanu Pramanik'],[214,'Khejuri','Subrata Paik'],
[215,'Kanthi Dakshin','Arup Kumar Das'],[216,'Ramnagar','Chandra Sekhar Mondal'],[217,'Egra','Dibendu Adhikari'],
[218,'Dantan','Ajit Kumar Jana'],[222,'Keshiary','Bhadra Hembrem'],[223,'Kharagpur Sadar','Dilip Ghosh'],
[224,'Narayangarh','Rama Prasad Giri'],[225,'Sabang','Amal Panda'],[226,'Pingla','Swagata Manna'],
[227,'Kharagpur','Tapan Bhuya'],[228,'Debra','Shubhashish Om'],[229,'Daspur','Tapan Dutta'],
[230,'Ghatal','Sital Kapat'],[231,'Chandrakona','Sukanta Dolui'],[233,'Salboni','Biman Mahto'],
[234,'Keshpur','Suvendu Samanta'],[219,'Nayagram','Amiya Kisku'],[220,'Gopiballavpur','Rajesh Mahto'],
[221,'Jhargram','Lakshmikant Sahu'],[236,'Binpur','Pranat Tudu'],[237,'Bandwan','Labsen Baske'],
[238,'Balarampur','Jaladhar Mahto'],[239,'Baghmundi','Rahidas Mahato'],[240,'Joypur','Biswajit Mahato'],
[241,'Purulia','Sudip Kumar Mukherjee'],[242,'Manbazar','Moyna Murmu'],[243,'Kashipur','Kamalkanta Hansda'],
[244,'Para','Nadiar Chand Bauri'],[245,'Raghunathpur','Mamoni Bauri'],[246,'Saltora','Chandana Bauri'],
[247,'Chhatna','Satyanarayan Mukhopadhyay'],[248,'Ranibandh','Kshudiram Tudu'],[249,'Raipur','Kshetra Mohan Hansda'],
[250,'Taldangra','Souvik Patra'],[251,'Bankura','Niladri Shekhar Dana'],[252,'Barjora','Billeshwar Singha'],
[253,'Onda','Amarnath Shakha'],[254,'Bishnupur','Shukla Chatterjee'],[255,'Katulpur','Laxmikanta Majumdar'],
[256,'Indas','Nirmal Kumar Dhara'],[257,'Sonamukhi','Dibakar Gharami'],[258,'Khandaghosh','Gautam Dhara'],
[259,'Bardhaman Dakshin','Moumita Biswas Misra'],[260,'Raina','Subhash Patra'],[261,'Jamalpur','Arun Halder'],
[262,'Monteswar','Saikat Panja'],[263,'Kalna','Siddharth Majumdar'],[265,'Bardhaman Uttar','Sanjay Das'],
[266,'Bhatar','Soumen Karfa'],[268,'Purbasthali Uttar','Gopal Chattopadhyay'],[270,'Ketugram','Anadi Ghosh'],
[271,'Mangalkot','Shishir Ghosh'],[272,'Ausgram','Kalita Maji'],[273,'Galsi','Raju Patra'],
[274,'Pandabeswar','Jitendra Kumar Tewari'],[275,'Durgapur Purba','Chandra Shekhar Banerjee'],
[276,'Durgapur Paschim','Lakshman Chandra Ghorui'],[277,'Raniganj','Partho Ghosh'],[278,'Jamuria','Bijan Mukherjee'],
[279,'Asansol Dakshin','Agnimitra Paul'],[280,'Asansol Uttar','Krishnendu Mukherjee'],[281,'Kulti','Ajay Kumar Poddar'],
[283,'Dubrajpur','Anup Kumar Saha'],[284,'Suri','Jagannath Chattopadhyay'],[285,'Bolpur','Dilip Kumar Ghosh'],
[286,'Nanoor','Khokan Das'],[287,'Labpur','Debasis Ojha'],[289,'Mayureswar','Dudh Kumar Mondal'],
[290,'Rampurhat','Dhruba Saha'],[291,'Hansan','Nikhil Banerjee'],[293,'Murarai','Rinki Ghosh']
];

function generateMap(officialList, party) {
  const seen = new Set();
  const lines = [];
  const notFound = [];
  officialList.forEach(([ac, name, candidate]) => {
    const id = resolveId(ac, name, party);
    if (id) {
      const key = `${id}-${party}`;
      if (!seen.has(key)) {
        seen.add(key);
        lines.push(`  "${key}": { name: "${candidate}" },`);
      }
    } else {
      notFound.push(`  // NOT FOUND: AC${ac} ${name} (${party}: ${candidate})`);
    }
  });
  return { lines, notFound };
}

const tmc = generateMap(tmcList, 'TMC');
const bjp = generateMap(bjpList, 'BJP');

process.stdout.write('// TMC: ' + tmc.lines.length + ' | BJP: ' + bjp.lines.length + '\nconst REAL_CANDIDATES = {\n');
process.stdout.write('  // ── TMC ────────────────────────────────────\n');
tmc.lines.forEach(l => process.stdout.write(l + '\n'));
process.stdout.write('  // ── BJP ────────────────────────────────────\n');
bjp.lines.forEach(l => process.stdout.write(l + '\n'));
process.stdout.write('};\n\n');
process.stdout.write('// Unmatched:\n');
[...tmc.notFound, ...bjp.notFound].forEach(l => process.stdout.write(l + '\n'));
