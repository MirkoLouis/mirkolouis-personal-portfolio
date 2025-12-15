# Changelog

All notable changes to this project will be documented in this file.

## [1.6.0] - 2025-12-15

### Added
-   **New Section: "Merit Badges"**: Added a new section for soft skills, styled as a grid of medals using Bootstrap Icons.
-   **New Section: "Service Record"**: Added a new section for education and history, styled as a vertical campaign timeline.
-   **New Footer: "Extraction Point"**: Replaced the previous footer with a new themed design, including social links.
-   **New CSS**: Added specific styles for the timeline, medal icons, and the new footer to `public/css/style.css`.
-   **Dependencies**: Added the Bootstrap Icons CDN to `layout.hbs` to support the new icons.

## [1.5.0] - 2025-12-15

### Added
-   **Repository Filtering**: Implemented a feature to exclude specific repositories from the "Field Ops" section. A hardcoded exclusion list (`reposToExclude`) has been added to `routes/index.js` to filter the projects fetched from the GitHub API.
-   **Documentation**: Updated `PROJECT_OVERVIEW.md` to explain how to modify the repository exclusion list.

## [1.4.0] - 2025-12-15

### Added
-   **Dynamic Projects Section**: Integrated the GitHub API to dynamically fetch and display your public repositories in the "Field Ops" section.
    -   Installed `axios` to handle API requests.
    -   Updated the main route to asynchronously fetch repo data before rendering.
    -   Modified the `index.hbs` template to loop through the fetched projects and generate cards dynamically.
-   **Documentation**: Updated `PROJECT_OVERVIEW.md` to explain the new API integration and dynamic rendering process.

## [1.3.0] - 2025-12-15

### Added
-   **Development Workflow**: Installed `nodemon` as a dev dependency and added an `npm run dev` script to automatically restart the server on file changes, fixing browser caching issues during development.
-   **Documentation**: Updated `README.md` to include instructions for the new `dev` script.

## [1.2.0] - 2025-12-15

### Changed
-   **Local Background Image**: Switched the home section's background from a remote URL to a local image path (`/images/lilith-background.jpg`).
-   **File Structure**: Created the `public/images` directory to store local image assets.
-   **Documentation**: Updated `PROJECT_OVERVIEW.md` to reflect the new `images` directory.

## [1.1.0] - 2025-12-14

### Added
-   **JavaScript Particle Effect**: Added a lightweight, custom vanilla JavaScript particle effect to the "Lobby" (Home) section to simulate falling grey and red petals.
    -   Created `public/js/particles.js`.
    -   Added a `<canvas>` element to the home section.
    -   Included the script in the main layout.

### Changed
-   **Improved Readability**: Changed the text color for the title and description in the "Field Ops" project cards to a light grey (`#f0f0f0`) for better contrast and readability against the dark card background.

## [1.0.0] - 2025-12-14

### Added
-   **Initial Project Setup**:
    -   Initialized Node.js project with `npm`.
    -   Installed Express, HBS, and Bootstrap 5.
    -   Created project structure with `app.js`, `routes`, `views`, and `public` directories.
-   **Core Backend**:
    -   Configured Express server in `app.js`.
    -   Set up HBS as the view engine with support for partials.
    -   Created a single route in `routes/index.js` to serve the main page.
-   **Templating**:
    -   Created main `layout.hbs` with Bootstrap 5 integration.
    -   Added `navbar.hbs` and `footer.hbs` as partials.
    -   Built the main `index.hbs` with sections for Home, Loadouts (Skills), Field Ops (Projects), and UAV Recon (Contact).
-   **Theming and Styling**:
    -   Created `public/css/style.css` with the full MW2 'The Haunting' theme.
    -   Implemented the color palette (Void Black, Blood Red, Slate Grey).
    -   Added full-screen hero image with a dark overlay for the Home section.
    -   Styled all sections (Navbar, Loadouts, Field Ops, Contact) according to the theme.
-   **Special Effects (CSS)**:
    -   Implemented CRT scan lines overlay effect.
    -   Implemented "Corruption" glitch effect on hover for text elements.
    -   Implemented pulsing "Status: DEPLOYED" animation.
    -   Implemented "Classified Intel" card style with red glow on hover.
    -   Implemented "Threat Detection" radar with a spinning red sweep line animation for the contact form.
-   **Documentation**:
    -   Created `README.md` with setup and run instructions.
    -   Created `PROJECT_OVERVIEW.md` with a detailed explanation of the architecture.
    -   Created this `CHANGELOG.md`.
