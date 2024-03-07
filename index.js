const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
require('dotenv').config();

const port=process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});