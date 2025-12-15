const express = require('express');
const router = express.Router();
const axios = require('axios');

const reposToExclude = [
  'skills-introduction-to-github',
  'introduction-to-github',
  'mirkolouis'
];

/* GET home page. */
router.get('/', async function(req, res, next) {
  let projects = [];
  try {
    const githubResponse = await axios.get('https://api.github.com/users/MirkoLouis/repos?sort=pushed');
    projects = githubResponse.data.filter(repo => !reposToExclude.includes(repo.name));
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    // Render the page with an empty array if the API fails
  }

  res.render('index', { 
    title: 'Operator: Mirko Louis',
    name: 'Mirko Louis',
    projects: projects
  });
});

module.exports = router;
