import type { Artist, Mood } from '@/types';

export const ARTISTS: Artist[] = [
  // ─── Bollywood ──────────────────────────────────────────
  { id: '1',  name: 'Arijit Singh',      genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',  searchQuery: 'Arijit Singh best songs' },
  { id: '2',  name: 'Shreya Ghoshal',    genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb82c65b9e9a7023c32736e1a3',  searchQuery: 'Shreya Ghoshal songs' },
  { id: '3',  name: 'AR Rahman',         genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb5b6bcfe82cdd4e95f3c88b73',  searchQuery: 'AR Rahman songs' },
  { id: '4',  name: 'Atif Aslam',        genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb9a4f81f0df7c7b8acf4da57f',  searchQuery: 'Atif Aslam songs' },
  { id: '5',  name: 'Sonu Nigam',        genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb7b4def02024f5285c1b9b7ab',  searchQuery: 'Sonu Nigam songs' },
  { id: '6',  name: 'Neha Kakkar',       genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb7f50e96c4b3cd5b1de1c5e0e',  searchQuery: 'Neha Kakkar songs' },
  { id: '7',  name: 'Lata Mangeshkar',   genre: 'Classical',  image: 'https://i.scdn.co/image/ab6761610000e5eb9fe2780a4b42e8af47aab2f2',  searchQuery: 'Lata Mangeshkar songs' },
  { id: '8',  name: 'Kishore Kumar',     genre: 'Classic',    image: 'https://i.scdn.co/image/ab6761610000e5ebdbf3f5faa44f8f0f2e1f1e21',  searchQuery: 'Kishore Kumar songs' },
  { id: '9',  name: 'Mohammed Rafi',     genre: 'Classic',    image: 'https://i.scdn.co/image/ab6761610000e5ebdca3a3c54b04b6c13a9e4bfe',  searchQuery: 'Mohammed Rafi songs' },
  { id: '10', name: 'Asha Bhosle',       genre: 'Classic',    image: 'https://i.scdn.co/image/ab6761610000e5eb9b1d0c0e81d2be0f4d3e9b4a',  searchQuery: 'Asha Bhosle songs' },

  // ─── Punjabi ────────────────────────────────────────────
  { id: '11', name: 'AP Dhillon',         genre: 'Punjabi',    image: 'https://i.scdn.co/image/ab6761610000e5eba08b0b9e44a2e4b2c66de7b8',  searchQuery: 'AP Dhillon songs' },
  { id: '12', name: 'Diljit Dosanjh',     genre: 'Punjabi',    image: 'https://i.scdn.co/image/ab6761610000e5eb0e5abf8a2ab44f7834734ba1',  searchQuery: 'Diljit Dosanjh songs' },
  { id: '13', name: 'Guru Randhawa',      genre: 'Punjabi',    image: '', searchQuery: 'Guru Randhawa songs' },
  { id: '14', name: 'Mika Singh',         genre: 'Punjabi',    image: '', searchQuery: 'Mika Singh songs' },
  { id: '15', name: 'Badshah',            genre: 'Hip-Hop',    image: '', searchQuery: 'Badshah songs' },

  // ─── Bhojpuri ───────────────────────────────────────────
  { id: '16', name: 'Pawan Singh',        genre: 'Bhojpuri',   image: '', searchQuery: 'Pawan Singh Bhojpuri songs' },
  { id: '17', name: 'Khesari Lal',        genre: 'Bhojpuri',   image: '', searchQuery: 'Khesari Lal Yadav songs' },
  { id: '18', name: 'Ritesh Pandey',      genre: 'Bhojpuri',   image: '', searchQuery: 'Ritesh Pandey Bhojpuri songs' },
  { id: '19', name: 'Dinesh Lal Nirahua', genre: 'Bhojpuri',   image: '', searchQuery: 'Nirahua Bhojpuri songs' },
  { id: '20', name: 'Pramod Premi',       genre: 'Bhojpuri',   image: '', searchQuery: 'Pramod Premi Bhojpuri songs' },

  // ─── Indie / Hip-Hop ───────────────────────────────────
  { id: '21', name: 'Divine',             genre: 'Hip-Hop',    image: '', searchQuery: 'Divine rapper songs' },
  { id: '22', name: 'Raftaar',            genre: 'Hip-Hop',    image: '', searchQuery: 'Raftaar songs' },
  { id: '23', name: 'King',               genre: 'Indie',      image: '', searchQuery: 'King singer Tu Aashiqui songs' },

  // ─── More Bollywood ─────────────────────────────────────
  { id: '24', name: 'Jubin Nautiyal',     genre: 'Bollywood',  image: '', searchQuery: 'Jubin Nautiyal songs' },
  { id: '25', name: 'Darshan Raval',      genre: 'Bollywood',  image: '', searchQuery: 'Darshan Raval songs' },
  { id: '26', name: 'Tony Kakkar',        genre: 'Bollywood',  image: '', searchQuery: 'Tony Kakkar songs' },
  { id: '27', name: 'Alka Yagnik',        genre: 'Bollywood',  image: '', searchQuery: 'Alka Yagnik songs' },
  { id: '28', name: 'Udit Narayan',       genre: 'Bollywood',  image: '', searchQuery: 'Udit Narayan songs' },
  { id: '29', name: 'Kumar Sanu',         genre: 'Bollywood',  image: '', searchQuery: 'Kumar Sanu songs' },
  { id: '30', name: 'Sunidhi Chauhan',    genre: 'Bollywood',  image: '', searchQuery: 'Sunidhi Chauhan songs' },
  { id: '31', name: 'Shaan',              genre: 'Bollywood',  image: '', searchQuery: 'Shaan singer songs' },
  { id: '32', name: 'KK',                 genre: 'Bollywood',  image: '', searchQuery: 'KK singer songs' },
  { id: '33', name: 'Ankit Tiwari',       genre: 'Bollywood',  image: '', searchQuery: 'Ankit Tiwari songs' },
  { id: '34', name: 'Mithoon',            genre: 'Composer',   image: '', searchQuery: 'Mithoon songs' },
  { id: '35', name: 'Pritam',             genre: 'Composer',   image: '', searchQuery: 'Pritam songs' },

  // ─── Bhojpuri Extra ─────────────────────────────────────
  { id: '36', name: 'Ankush Raja',        genre: 'Bhojpuri',   image: '', searchQuery: 'Ankush Raja Bhojpuri songs' },
  { id: '37', name: 'Neelkamal Singh',     genre: 'Bhojpuri',   image: '', searchQuery: 'Neelkamal Singh Bhojpuri songs' },
  { id: '38', name: 'Samar Singh',        genre: 'Bhojpuri',   image: '', searchQuery: 'Samar Singh Bhojpuri songs' },
  { id: '39', name: 'Tanishk Bagchi',     genre: 'Composer',   image: '', searchQuery: 'Tanishk Bagchi songs' },
  { id: '40', name: 'Amaal Mallik',       genre: 'Composer',   image: '', searchQuery: 'Amaal Mallik songs' },
];

export const MOODS: Mood[] = [
  { id: '1',  name: '😍 Romantic',   query: 'romantic hindi songs 2024',     icon: '😍', gradient: 'from-pink-500 to-rose-500' },
  { id: '2',  name: '💪 Workout',    query: 'gym workout motivation songs',  icon: '💪', gradient: 'from-orange-500 to-red-500' },
  { id: '3',  name: '😌 Chill',      query: 'chill lofi hindi songs',        icon: '😌', gradient: 'from-blue-500 to-cyan-500' },
  { id: '4',  name: '🎉 Party',      query: 'party songs Hindi 2024',        icon: '🎉', gradient: 'from-violet-500 to-purple-500' },
  { id: '5',  name: '😢 Sad',        query: 'sad songs Hindi broken heart',  icon: '😢', gradient: 'from-slate-500 to-gray-500' },
  { id: '6',  name: '🕉️ Devotional', query: 'bhakti songs devotional Hindi', icon: '🕉️', gradient: 'from-yellow-500 to-amber-500' },
  { id: '7',  name: '🎸 Retro',      query: 'old classic Hindi songs 90s',   icon: '🎸', gradient: 'from-amber-500 to-orange-500' },
  { id: '8',  name: '🔥 Trending',   query: 'trending Hindi songs 2024',     icon: '🔥', gradient: 'from-red-500 to-pink-500' },
  { id: '9',  name: '🎤 Bhojpuri',   query: 'Bhojpuri superhit songs 2024',  icon: '🎤', gradient: 'from-green-500 to-emerald-500' },
  { id: '10', name: '🎵 Punjabi',    query: 'new Punjabi songs 2024',        icon: '🎵', gradient: 'from-indigo-500 to-blue-500' },
  { id: '11', name: '🌙 Night',      query: 'night drive songs Hindi',       icon: '🌙', gradient: 'from-purple-900 to-indigo-900' },
  { id: '12', name: '🎼 Classical',  query: 'Indian classical music songs',  icon: '🎼', gradient: 'from-teal-500 to-green-500' },
];

export const TRENDING_SEARCHES = [
  '🔥 Teri Ada', '💫 Tum Kya Mile', '🎵 Ve Kamleya', '❤️ Kesariya',
  '🎤 Arjan Vailly', '🌟 Oo Antava', '💃 Pushpa songs', '🎸 Jhoome Jo Pathaan',
  '🕺 Naatu Naatu', '🎵 Satranga', '💥 Besharam Rang', '🌙 Raataan Lambiyan',
  '❤️ Tere Naam', '🎵 Bhool Bhulaiyaa 2', '🎤 Bhojpuri Superhit 2024',
  '🌺 Hanuman Chalisa', '🔥 New Punjabi 2024', '💫 Sid Sriram hits',
];
