# Project Overview

This document provides a detailed overview of the personal portfolio website, its architecture, and how it all works from top to bottom.

## Core Architecture

The application is built on a classic Node.js and Express stack, serving a single-page website rendered using Handlebars (HBS) as the templating engine.

-   **`app.js`**: This is the heart of the application. It initializes the Express server, sets up the HBS view engine, registers the partials directory, and configures the static file server to serve assets from the `public` directory. It also imports and uses the main router.

-   **`routes/`**: This directory contains the application's routing logic.
    -   **`index.js`**: This file defines the main route (`/`). When a user visits the homepage, this router now acts asynchronously. It uses `axios` to make a live API call to GitHub, fetching the user's public repositories. It then filters this list to remove any repositories specified in the `reposToExclude` array. Finally, it renders the `index.hbs` view, passing in the filtered list of dynamic `projects`. To change which repositories are excluded, you can edit the `reposToExclude` array directly in this file.

-   **`views/`**: This directory holds all the Handlebars templates.
    -   **`layout.hbs`**: This is the main template file. It defines the overall HTML structure, including the `<head>` (with links to Bootstrap 5 and the custom `style.css`) and the `<body>`. It includes the navbar and footer partials and uses `{{{body}}}` to inject the content from other view files.
    -   **`index.hbs`**: This file contains the HTML structure for the entire single-page layout. The "Field Ops" (Projects) section is now dynamic, using a Handlebars `{{#each}}` loop to iterate over the `projects` data passed from the router and render a card for each repository.
    -   **`partials/`**: This subdirectory contains reusable pieces of templates.
        -   **`navbar.hbs`**: The site's top navigation menu.
        -   **`footer.hbs`**: The site's footer.

-   **`public/`**: This directory contains all static assets that are served directly to the client.
    -   **`css/style.css`**: The custom stylesheet that provides the unique MW2/Diablo theme. It contains all the color definitions, layout adjustments, and special animations like the CRT scan lines, corruption glitch, and radar sweep.
    -   **`images/`**: This directory holds local image assets, such as the main background image for the home section.
    -   **`js/`**: This directory contains client-side JavaScript. It now includes `particles.js` for the home screen's falling petal effect.

## Theming and Styling

The visual theme is the most complex part of this project and is achieved almost entirely through CSS.

-   **Color Palette**: The core colors (`--void-black`, `--blood-red`, `--slate-grey`) are defined as CSS variables in the `:root` for easy reuse.
-   **CRT Scan Lines**: A `div` with the class `scan-lines` is placed in `layout.hbs`. This `div` is styled to be fixed to the screen, with a repeating linear gradient background that animates vertically, creating the illusion of old-school monitor scan lines.
-   **Corruption Glitch Effect**: This effect is applied to text elements. It uses the `::before` and `::after` pseudo-elements to create two copies of the text (using the `data-text` attribute). On hover, these copies are shifted slightly, given a `text-shadow` of red and cyan respectively, and then revealed using an animated `clip-path`. This creates a flickering, chromatic aberration effect.
-   **Radar Sweep**: The contact form's radar is built from a circular container (`radar-container`) with a repeating radial gradient to create the grid lines. The sweeping line itself (`radar-sweep`) is a separate `div` with a `conic-gradient` background. The sweep animation is achieved by rotating this element 360 degrees infinitely.

## How it all comes together

1.  A user navigates to `http://localhost:3000`.
2.  `app.js` receives the request and passes it to the `index.js` router.
3.  The router's async function executes. It sends a GET request to the GitHub API.
4.  Once the API responds, the router tells the HBS view engine to render `index.hbs`, passing the repository data along with other page data.
5.  HBS first loads `layout.hbs`.
6.  `layout.hbs` includes the navbar and footer partials.
7.  HBS then renders the content of `index.hbs`, dynamically generating the project cards by looping through the GitHub data. It injects the final HTML into the `{{{body}}}` placeholder in `layout.hbs`.
8.  The final, compiled HTML is sent to the user's browser, along with all the linked CSS from the `public` directory.
9.  The browser renders the HTML and applies the CSS, bringing the themed portfolio to life.
