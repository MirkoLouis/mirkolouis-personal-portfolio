// Curated projects shown as featured cards (combined from developer-profile.md and the CV; edit freely)
import type { ImageMetadata } from "astro";
import type { CuratedProject } from "../lib/types";
import dtsDocumentIntake from "../assets/screenshots/DTS/Document Intake.png";
import dtsGuestSubmission from "../assets/screenshots/DTS/Guest Submission.png";
import canvasIliganHomepage from "../assets/screenshots/CanvasIligan/homepage.png";
import canvasIliganSearchResults from "../assets/screenshots/CanvasIligan/search_results.png";
import rspDashboard from "../assets/screenshots/RSP/dashboard.png";
import rspDeliberation from "../assets/screenshots/RSP/Step 2_ Deliberation.png";
import animeTrackerHomepage from "../assets/screenshots/AnimeTracker/homepage.png";
import animeTrackerDashboard from "../assets/screenshots/AnimeTracker/dashboard.png";
import animeTrackerSearch from "../assets/screenshots/AnimeTracker/search.png";
import bitTorrentWindow from "../assets/screenshots/BitTorrent/window_screenshot.png";
import pounceDashboard from "../assets/screenshots/Pounce/dashboard.png";
import pounceLogIn from "../assets/screenshots/Pounce/Log in.png";

// Featured projects, in display order. Screenshots live in src/assets/screenshots/ and are imported above.
export const curatedProjects: CuratedProject[] = [
    {
        slug: "dts-prototype",
        title: "Document Tracking System (DTS)",
        summary: "Thesis project for DepEd Iligan: a document tracking system with a tamper-evident audit trail built on SHA-256 hash-chaining and Ed25519 signatures for non-repudiation. It tracks physical documents by QR code, routes them by role across 14 departments, generates assignment, evaluation and transfer PDFs automatically, and provides admin analytics. Ported from Laravel 12 to vanilla PHP 8.3 and MySQL 8 for performance, with PDO transactions, pessimistic row locking and a containerized background worker.",
        stack: ["PHP 8.3", "MySQL 8", "Laravel", "SHA-256", "Ed25519", "Docker"],
        screenshots: [
            dtsDocumentIntake,
            dtsGuestSubmission,
        ],
        visibility: "public",
        repo: "MirkoLouis/DTS-Prototype",
    },
    {
        slug: "canvasiligan-ver3",
        title: "CanvasIligan",
        summary: "Semantic product search for local stores in Iligan City. A Python Flask service generates sentence-transformer embeddings and serves Faiss vector search with tiered keyword boosting, so results match the meaning of a query rather than its exact words. It sits behind a Node.js/Express API hardened with a Content Security Policy, tiered rate limiting and restricted CORS.",
        stack: ["Node.js", "Express", "Python", "Flask", "Faiss", "MySQL"],
        screenshots: [
            canvasIliganHomepage,
            canvasIliganSearchResults,
        ],
        visibility: "public",
        repo: "MirkoLouis/CanvasIligan-Ver3",
    },
    {
        slug: "recruitment-selection-process",
        title: "Recruitment & Selection Process Dashboard",
        summary: "Administrative dashboard that replaced DepEd Iligan's paper-based personnel recruitment workflow, built with a partner during my internship. Administrators manage applicants, job positions and recruitment phases in one portal, secured with role-based authentication and session middleware.",
        stack: ["Node.js", "Express", "JavaScript", "Handlebars"],
        screenshots: [
            rspDashboard,
            rspDeliberation,
        ],
        visibility: "public",
        repo: "MirkoLouis/Recruitment-Selection-Process",
    },
    {
        slug: "meerkos-anime-tracker",
        title: "Meerko's Anime Tracker",
        summary: "Anime tracking web application with JWT authentication, structured in MVC with service and middleware layers. Python scripts seed more than 15,000 records from the Jikan API, and custom MySQL indexes keep sorting and filtering fast at that volume.",
        stack: ["Node.js", "Express", "Handlebars", "MySQL", "JWT", "Python"],
        screenshots: [
            animeTrackerHomepage,
            animeTrackerDashboard,
            animeTrackerSearch,
        ],
        visibility: "public",
        repo: "MirkoLouis/Meerko-s-Anime-Tracker",
    },
    {
        slug: "meerko-bittorrent-client",
        title: "Meerko BitTorrent Client",
        summary: "Lightweight BitTorrent client built on libtorrent, with both a command-line and a graphical interface. It supports SOCKS5 proxies and stops seeding automatically at a 1.0 share ratio.",
        stack: ["Python", "libtorrent", "CLI", "GUI", "SOCKS5"],
        screenshots: [
            bitTorrentWindow,
        ],
        // Portrait window: show its top part when cropped
        objectPosition: "top",
        visibility: "public",
        repo: "MirkoLouis/Meerko-Bittorent-Client",
    },
    {
        slug: "pounce",
        title: "Pounce",
        summary: "Hyper-local micro-task marketplace that connects students with short paid gigs. A full-stack MERN application with user authentication, gig posting and browsing, and real-time messaging between clients and freelancers over WebSockets.",
        stack: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS", "WebSocket"],
        screenshots: [
            pounceDashboard,
            pounceLogIn,
        ],
        visibility: "public",
        repo: "MirkoLouis/Pounce",
    },
];

// Extra images shown only in the scrolling screenshot background, never on a card
export const showcaseScreenshots: ImageMetadata[] = [];
