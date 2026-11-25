const app = require('./app');
const { loadSampleData } = require('./utils/seed');

const PORT = process.env.PORT || 3000;

// Optional demo data: LOAD_SAMPLE_DATA=true npm start   (or ./demo/run.sh --sample-data)
if (process.env.LOAD_SAMPLE_DATA === 'true') {
  const count = loadSampleData();
  console.log(`Loaded ${count} sample transactions from demo/sample-data.json`);
}

app.listen(PORT, () => {
  console.log(`Banking API listening on http://localhost:${PORT}`);
});
