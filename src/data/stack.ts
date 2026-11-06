// Technologies grouped by layer, each with a Nerd Font icon from src/lib/icons.json
import type { IconName } from "../lib/icons";

export interface StackGroup {
    title: string;
    items: { label: string; icon: IconName }[];
}

export const stackGroups: StackGroup[] = [
    {
        title: "Frontend",
        items: [
            { label: "HTML", icon: "html" },
            { label: "CSS", icon: "css" },
            { label: "JavaScript", icon: "javascript" },
            { label: "React", icon: "react" },
            { label: "Tailwind CSS", icon: "tailwind" },
            { label: "Bootstrap", icon: "bootstrap" },
            { label: "Handlebars", icon: "handlebars" },
            { label: "Astro", icon: "astro" },
        ],
    },
    {
        title: "Backend",
        items: [
            { label: "PHP", icon: "php" },
            { label: "Laravel", icon: "laravel" },
            { label: "Node.js", icon: "nodejs" },
            { label: "Express", icon: "express" },
            { label: "Python", icon: "python" },
            { label: "Flask", icon: "flask" },
        ],
    },
    {
        title: "Databases",
        items: [
            { label: "MySQL", icon: "mysql" },
            { label: "MongoDB", icon: "mongodb" },
            { label: "Redis", icon: "redis" },
            { label: "SQLite", icon: "sqlite" },
        ],
    },
    {
        title: "DevOps & Linux",
        items: [
            { label: "Linux", icon: "linux" },
            { label: "NixOS", icon: "nixos" },
            { label: "Docker", icon: "docker" },
            { label: "Nginx", icon: "nginx" },
            { label: "Git", icon: "git" },
            { label: "GitHub Actions", icon: "githubActions" },
            { label: "Vercel", icon: "vercel" },
        ],
    },
    {
        title: "Security",
        items: [
            { label: "JWT", icon: "key" },
            { label: "bcrypt", icon: "lock" },
            { label: "SHA-256 hash-chaining", icon: "hash" },
            { label: "Ed25519", icon: "signature" },
            { label: "CSP", icon: "shield" },
            { label: "Rate limiting", icon: "gauge" },
        ],
    },
];
