# Project: Themed Personal Portfolio

## Project Overview

This project is a themed personal portfolio website built on a Node.js and Express backend. It uses Handlebars (HBS) for server-side templating and Bootstrap 5 for its responsive layout. The visual theme is heavily inspired by the *Call of Duty: MW2 'The Haunting' (Lilith Crossover)* event, featuring a dark, high-tech military UI with red supernatural accents.

The portfolio is designed as a single-page application. It dynamically fetches and displays GitHub projects from a specified user account, and includes custom-coded CSS animations (like CRT scan lines and a "corruption" glitch effect) to enhance the theme.

**Key Technologies:**
- **Backend:** Node.js, Express
- **Frontend:** Handlebars (HBS), Bootstrap 5, custom CSS3
- **Data:** Fetches repository data from the GitHub API via `axios`.
- **Development:** Uses `nodemon` for automatic server restarts.

**Architecture:**
- The entry point is `app.js`, which sets up the Express server, middleware, and view engine.
- Routing is handled in `routes/index.js`, which fetches data from the GitHub API and renders the main view.
- Handlebars templates are located in the `views/` directory, with reusable components in `views/partials/`.
- All static assets (CSS, client-side JS, images) are served from the `public/` directory.

## Building and Running

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run in Development Mode:**
    *   This is the recommended way to run the project locally. It uses `nodemon` to automatically restart the server on file changes.
    ```bash
    npm run dev
    ```

3.  **Run in Production Mode:**
    ```bash
    npm start
    ```

4.  **View the Application:**
    *   Once running, the application is accessible at `http://localhost:3000`.

## Development Conventions

*   **Styling:** The visual theme is defined in `public/css/style.css`. It makes extensive use of CSS variables for the color palette, which are defined in the `:root` element. Reusable theme components like `.intel-folder` and `.corruption-glitch` should be used where applicable.
*   **Templating:** The site uses Handlebars partials for reusable UI components (e.g., `navbar`, `footer`, `service_record`). When adding new major UI blocks, consider creating a partial in `views/partials/`.
*   **GitHub Projects:** The "Field Ops" section is populated dynamically. To exclude certain repositories from appearing, add their names to the `reposToExclude` array at the top of the `routes/index.js` file.
*   **File Structure:** The project follows a standard Express application structure. Keep routes, static assets, and views in their respective directories.
*   **Dependencies:** Use `npm` to manage both production and development dependencies.
