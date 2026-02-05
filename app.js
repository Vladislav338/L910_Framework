const createApp = require('./framework');
const fs = require('fs').promises;
const path = require('path');

const app = createApp();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.pathname}`);
  next();
});

app.use((req, res, next) => {
  if (req.headers['content-type'] !== 'application/json' && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    res.status(400).json({ error: 'Content-Type must be application/json' });
    return;
  }
  next();
});

const DATA_PATH = path.join(__dirname, 'data');

const readJSON = async (filename) => {
  try {
    const data = await fs.readFile(path.join(DATA_PATH, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeJSON = async (filename, data) => {
  await fs.writeFile(path.join(DATA_PATH, filename), JSON.stringify(data, null, 2));
};

// Фильмы
app.get('/films', async (req, res) => {
  const films = await readJSON('films.json');
  res.json(films);
});

app.get('/films/:id', async (req, res) => {
  const films = await readJSON('films.json');
  const film = films.find(f => f.id == req.params.id);
  
  if (!film) {
    res.status(404).json({ error: 'Film not found' });
    return;
  }
  
  res.json(film);
});

app.post('/films', async (req, res) => {
  const films = await readJSON('films.json');
  const newFilm = {
    id: films.length > 0 ? Math.max(...films.map(f => f.id)) + 1 : 1,
    title: req.body.title || `Film ${Date.now()}`,
    genre: req.body.genre || ['драма'],
    duration: req.body.duration || 120,
    isPremiere: req.body.isPremiere || false,
    releaseDate: req.body.releaseDate || new Date().toISOString().split('T')[0],
    rating: req.body.rating || 7.0
  };
  
  films.push(newFilm);
  await writeJSON('films.json', films);
  res.status(201).json(newFilm);
});

app.put('/films/:id', async (req, res) => {
  let films = await readJSON('films.json');
  const index = films.findIndex(f => f.id == req.params.id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Film not found' });
    return;
  }
  
  films[index] = { ...films[index], ...req.body, id: parseInt(req.params.id) };
  await writeJSON('films.json', films);
  res.json(films[index]);
});

app.patch('/films/:id', async (req, res) => {
  let films = await readJSON('films.json');
  const index = films.findIndex(f => f.id == req.params.id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Film not found' });
    return;
  }
  
  const randomValue = Math.random().toString(36).substring(7);
  const patchData = { ...req.body, randomField: randomValue };
  
  films[index] = { ...films[index], ...patchData };
  await writeJSON('films.json', films);
  res.json(films[index]);
});

app.delete('/films/:id', async (req, res) => {
  let films = await readJSON('films.json');
  const initialLength = films.length;
  films = films.filter(f => f.id != req.params.id);
  
  if (films.length === initialLength) {
    res.status(404).json({ error: 'Film not found' });
    return;
  }
  
  await writeJSON('films.json', films);
  res.status(204).end();
});


app.get('/screenings', async (req, res) => {
  const screenings = await readJSON('screenings.json');
  res.json(screenings);
});

app.get('/screenings/:id', async (req, res) => {
  const screenings = await readJSON('screenings.json');
  const screening = screenings.find(s => s.id == req.params.id);
  
  if (!screening) {
    res.status(404).json({ error: 'Screening not found' });
    return;
  }
  
  res.json(screening);
});

app.post('/screenings', async (req, res) => {
  const screenings = await readJSON('screenings.json');
  const newScreening = {
    id: screenings.length > 0 ? Math.max(...screenings.map(s => s.id)) + 1 : 1,
    movieId: req.body.movieId || 1,
    hall: req.body.hall || 1,
    dateTime: req.body.dateTime || new Date().toISOString(),
    ticketsAvailable: req.body.ticketsAvailable || 100,
    is3D: req.body.is3D || false,
    price: req.body.price || 300,
    occupiedSeats: req.body.occupiedSeats || []
  };
  
  screenings.push(newScreening);
  await writeJSON('screenings.json', screenings);
  res.status(201).json(newScreening);
});

app.put('/screenings/:id', async (req, res) => {
  let screenings = await readJSON('screenings.json');
  const index = screenings.findIndex(s => s.id == req.params.id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Screening not found' });
    return;
  }
  
  screenings[index] = { ...screenings[index], ...req.body, id: parseInt(req.params.id) };
  await writeJSON('screenings.json', screenings);
  res.json(screenings[index]);
});

app.patch('/screenings/:id', async (req, res) => {
  let screenings = await readJSON('screenings.json');
  const index = screenings.findIndex(s => s.id == req.params.id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Screening not found' });
    return;
  }
  
  const patchData = { ...req.body, lastModified: new Date().toISOString() };
  screenings[index] = { ...screenings[index], ...patchData };
  await writeJSON('screenings.json', screenings);
  res.json(screenings[index]);
});

app.delete('/screenings/:id', async (req, res) => {
  let screenings = await readJSON('screenings.json');
  const initialLength = screenings.length;
  screenings = screenings.filter(s => s.id != req.params.id);
  
  if (screenings.length === initialLength) {
    res.status(404).json({ error: 'Screening not found' });
    return;
  }
  
  await writeJSON('screenings.json', screenings);
  res.status(204).end();
});

// запуск
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable routes:');
  console.log('  Films:');
  console.log(`    GET    http://localhost:${PORT}/films`);
  console.log(`    GET    http://localhost:${PORT}/films/1`);
  console.log(`    POST   http://localhost:${PORT}/films`);
  console.log(`    PUT    http://localhost:${PORT}/films/1`);
  console.log(`    PATCH  http://localhost:${PORT}/films/1`);
  console.log(`    DELETE http://localhost:${PORT}/films/1`);
  console.log('  Screenings:');
  console.log(`    GET    http://localhost:${PORT}/screenings`);
  console.log(`    GET    http://localhost:${PORT}/screenings/1`);
  console.log(`    POST   http://localhost:${PORT}/screenings`);
  console.log(`    PUT    http://localhost:${PORT}/screenings/1`);
  console.log(`    PATCH  http://localhost:${PORT}/screenings/1`);
  console.log(`    DELETE http://localhost:${PORT}/screenings/1`);
});