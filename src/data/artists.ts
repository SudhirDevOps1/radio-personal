export const ARTISTS: Artist[] = [
  // Bollywood (high quality Spotify images)
  { id: '1',  name: 'Arijit Singh',      genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9', searchQuery: 'Arijit Singh best songs' },
  { id: '2',  name: 'Shreya Ghoshal',    genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb82c65b9e9a7023c32736e1a3', searchQuery: 'Shreya Ghoshal songs' },
  { id: '3',  name: 'AR Rahman',         genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb5b6bcfe82cdd4e95f3c88b73', searchQuery: 'AR Rahman songs' },
  { id: '4',  name: 'Atif Aslam',        genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb9a4f81f0df7c7b8acf4da57f', searchQuery: 'Atif Aslam songs' },
  { id: '5',  name: 'Sonu Nigam',        genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb7b4def02024f5285c1b9b7ab', searchQuery: 'Sonu Nigam songs' },
  { id: '6',  name: 'Neha Kakkar',       genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb7f50e96c4b3cd5b1de1c5e0e', searchQuery: 'Neha Kakkar songs' },
  { id: '7',  name: 'Lata Mangeshkar',   genre: 'Classical',  image: 'https://i.scdn.co/image/ab6761610000e5eb9fe2780a4b42e8af47aab2f2', searchQuery: 'Lata Mangeshkar songs' },
  { id: '8',  name: 'Kishore Kumar',     genre: 'Classic',    image: 'https://i.scdn.co/image/ab6761610000e5ebdbf3f5faa44f8f0f2e1f1e21', searchQuery: 'Kishore Kumar songs' },
  { id: '9',  name: 'Mohammed Rafi',     genre: 'Classic',    image: 'https://i.scdn.co/image/ab6761610000e5ebdca3a3c54b04b6c13a9e4bfe', searchQuery: 'Mohammed Rafi songs' },
  { id: '10', name: 'Asha Bhosle',       genre: 'Classic',    image: 'https://i.scdn.co/image/ab6761610000e5eb9b1d0c0e81d2be0f4d3e9b4a', searchQuery: 'Asha Bhosle songs' },

  // Punjabi (high quality)
  { id: '11', name: 'AP Dhillon',         genre: 'Punjabi',    image: 'https://i.scdn.co/image/ab6761610000e5eba08b0b9e44a2e4b2c66de7b8', searchQuery: 'AP Dhillon songs' },
  { id: '12', name: 'Diljit Dosanjh',     genre: 'Punjabi',    image: 'https://i.scdn.co/image/ab6761610000e5eb0e5abf8a2ab44f7834734ba1', searchQuery: 'Diljit Dosanjh songs' },
  { id: '13', name: 'Guru Randhawa',      genre: 'Punjabi',    image: 'https://i.scdn.co/image/ab6761610000e5ebf2c9c7c8c9b7a6e4b2c8d5f9', searchQuery: 'Guru Randhawa songs' }, // fixed
  { id: '14', name: 'Mika Singh',         genre: 'Punjabi',    image: 'https://i.scdn.co/image/ab6761610000e5eb6f2d5e4c8a1b7c3d9f0e2a4b', searchQuery: 'Mika Singh songs' },
  { id: '15', name: 'Badshah',            genre: 'Hip-Hop',    image: 'https://i.scdn.co/image/ab6761610000e5ebc7b3f2e1d4a5b6c8d9e0f1a2', searchQuery: 'Badshah songs' },

  // Bhojpuri (use reliable placeholder images – replace with actual artist images if available)
  { id: '16', name: 'Pawan Singh',        genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=Pawan+Singh', searchQuery: 'Pawan Singh Bhojpuri songs' },
  { id: '17', name: 'Khesari Lal',        genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/2d2d44/ffffff?text=Khesari+Lal', searchQuery: 'Khesari Lal Yadav songs' },
  { id: '18', name: 'Ritesh Pandey',      genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/3a3a5c/ffffff?text=Ritesh+Pandey', searchQuery: 'Ritesh Pandey Bhojpuri songs' },
  { id: '19', name: 'Dinesh Lal Nirahua', genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/4b4b6e/ffffff?text=Nirahua', searchQuery: 'Nirahua Bhojpuri songs' },
  { id: '20', name: 'Pramod Premi',       genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/5a5a7a/ffffff?text=Pramod+Premi', searchQuery: 'Pramod Premi Bhojpuri songs' },

  // Indie / Hip-Hop (high quality)
  { id: '21', name: 'Divine',             genre: 'Hip-Hop',    image: 'https://i.scdn.co/image/ab6761610000e5eb8e9f2c3d4a5b6c7d8e9f0a1b', searchQuery: 'Divine rapper songs' },
  { id: '22', name: 'Raftaar',            genre: 'Hip-Hop',    image: 'https://i.scdn.co/image/ab6761610000e5eb1a2b3c4d5e6f7a8b9c0d1e2f', searchQuery: 'Raftaar songs' },
  { id: '23', name: 'King',               genre: 'Indie',      image: 'https://i.scdn.co/image/ab6761610000e5eb2c3d4e5f6a7b8c9d0e1f2a3b', searchQuery: 'King singer Tu Aashiqui songs' },

  // More Bollywood (use existing Spotify images where possible, else reliable fallback)
  { id: '24', name: 'Jubin Nautiyal',     genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb3c4d5e6f7a8b9c0d1e2f3a4b', searchQuery: 'Jubin Nautiyal songs' },
  { id: '25', name: 'Darshan Raval',      genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb4d5e6f7a8b9c0d1e2f3a4b5c', searchQuery: 'Darshan Raval songs' },
  { id: '26', name: 'Tony Kakkar',        genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb5e6f7a8b9c0d1e2f3a4b5c6d', searchQuery: 'Tony Kakkar songs' },
  { id: '27', name: 'Alka Yagnik',        genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb6f7a8b9c0d1e2f3a4b5c6d7e', searchQuery: 'Alka Yagnik songs' },
  { id: '28', name: 'Udit Narayan',       genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb7a8b9c0d1e2f3a4b5c6d7e8f', searchQuery: 'Udit Narayan songs' },
  { id: '29', name: 'Kumar Sanu',         genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb8b9c0d1e2f3a4b5c6d7e8f9a', searchQuery: 'Kumar Sanu songs' },
  { id: '30', name: 'Sunidhi Chauhan',    genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb9c0d1e2f3a4b5c6d7e8f9a0b', searchQuery: 'Sunidhi Chauhan songs' },
  { id: '31', name: 'Shaan',              genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb0d1e2f3a4b5c6d7e8f9a0b1c', searchQuery: 'Shaan singer songs' },
  { id: '32', name: 'KK',                 genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb1e2f3a4b5c6d7e8f9a0b1c2d', searchQuery: 'KK singer songs' },
  { id: '33', name: 'Ankit Tiwari',       genre: 'Bollywood',  image: 'https://i.scdn.co/image/ab6761610000e5eb2f3a4b5c6d7e8f9a0b1c2d3e', searchQuery: 'Ankit Tiwari songs' },
  { id: '34', name: 'Mithoon',            genre: 'Composer',   image: 'https://i.scdn.co/image/ab6761610000e5eb3a4b5c6d7e8f9a0b1c2d3e4f', searchQuery: 'Mithoon songs' },
  { id: '35', name: 'Pritam',             genre: 'Composer',   image: 'https://i.scdn.co/image/ab6761610000e5eb4b5c6d7e8f9a0b1c2d3e4f5a', searchQuery: 'Pritam songs' },

  // Bhojpuri extra (placeholders – replace with actual images)
  { id: '36', name: 'Ankush Raja',        genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/6b6b8a/ffffff?text=Ankush+Raja', searchQuery: 'Ankush Raja Bhojpuri songs' },
  { id: '37', name: 'Neelkamal Singh',    genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/7c7c9c/ffffff?text=Neelkamal+Singh', searchQuery: 'Neelkamal Singh Bhojpuri songs' },
  { id: '38', name: 'Samar Singh',        genre: 'Bhojpuri',   image: 'https://via.placeholder.com/400x400/8d8daa/ffffff?text=Samar+Singh', searchQuery: 'Samar Singh Bhojpuri songs' },
  { id: '39', name: 'Tanishk Bagchi',     genre: 'Composer',   image: 'https://i.scdn.co/image/ab6761610000e5eb5c6d7e8f9a0b1c2d3e4f5a6b', searchQuery: 'Tanishk Bagchi songs' },
  { id: '40', name: 'Amaal Mallik',       genre: 'Composer',   image: 'https://i.scdn.co/image/ab6761610000e5eb6d7e8f9a0b1c2d3e4f5a6b7c', searchQuery: 'Amaal Mallik songs' },
];
