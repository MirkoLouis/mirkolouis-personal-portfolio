const express = require('express');
const router = express.Router();
const axios = require('axios');

const reposToExclude = [
  'skills-introduction-to-github',
  'introduction-to-github',
  'mirkolouis'
];

let cachedProjects = [];

// Fetch data on server startup and cache it
(async () => {
  try {
    console.log('Fetching GitHub projects...');
    const githubResponse = await axios.get('https://api.github.com/users/MirkoLouis/repos?sort=pushed');
    cachedProjects = githubResponse.data.filter(repo => !reposToExclude.includes(repo.name));
    console.log('Successfully cached', cachedProjects.length, 'projects.');
  } catch (error) {
    console.error('Failed to fetch and cache GitHub projects on startup:', error.message);
    // The server will continue to run with an empty project list.
  }
})();


/* GET home page. */
router.get('/', function(req, res, next) {
  // Serve the cached data
  res.render('index', { 
    title: 'Operator: Mirko Louis',
    name: 'Mirko Louis',
    projects: cachedProjects
  });
});

module.exports = router;
