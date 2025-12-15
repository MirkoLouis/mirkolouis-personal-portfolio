const express = require('express');
const hbs = require('hbs');
const path = require('path');

const app = express();
const port = 3000;

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, './public');
const viewsPath = path.join(__dirname, './views');
const partialsPath = path.join(__dirname, './views/partials');

// Setup handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

app.listen(port, () => {
    console.log(`Server is up on port ${port}. Access it at http://localhost:${port}`);
});
