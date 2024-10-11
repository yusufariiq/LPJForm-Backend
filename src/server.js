const express = require('express');
const cors = require('cors');
const lpjRoutes = require('./routes/lpjRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.options('*', cors());

app.use('/api', lpjRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));