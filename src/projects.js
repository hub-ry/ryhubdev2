import chatter from "./assets/chatter-proj.png"
import serv from "./assets/ssh-serve.mov"
import ticket from "./assets/ticket.png"
export const projects = [
  {
    id: "ticketing-system",
    title: "Full Stack Ticketing System",
    subtitle: "Building a Full-Stack Ticketing System",
    description: "Building a full-stack ticketing system to pitch to Purdue Grand Prix 2027 using FastAPI, SQLite3, OpenCV, and Stripe to handle payments, QR code generation, and secure entry validation. Still in active development, with QR code email delivery, frontend implementation, and stress testing on the roadmap.",
    image: ticket,
    type: "Project",
    start: "September 2025",
    end: "March 2026",
    techStack: ["Python", "FastAPI", "Sqlite3", "OpenCV", "Stripe API"],
    source: "Closed-Source",
  },
  {
    id: "personal-server",
    title: "Self-Hosted Linux Server",
    subtitle: "Secure remote infrastructure for private application hosting",
    description: "Built and configured a personal Linux server for self-hosting applications and experimentation. Implemented secure remote access via SSH and mesh VPN networking using Tailscale. Configured firewall rules, user permissions, and service management to support reliable, private deployment of containerized applications.",
    image: null,
    video: serv,
    type: "Presentation",
    start: "Dec 2025",
    end: "Jan 2026",
    techStack: ["Linux", "SSH", "Docker", "Tailscale"],
    source: "Open Source",
    links: [
      { label: "Post", url: "https://notes.ryhub.dev/Forest/Linux-Server/Building-Personal-Linux-SSH-Server" },
    ],
  },
  {
    id: "protocol-tracker",
    title: "Protocol Tracker",
    subtitle: "Private Health Tracking System",
    description: "Designed and deployed a private, self-hosted fitness tracking platform running on a Linux server, accessible securely via Tailscale VPN. Implemented real-time data logging through iOS Shortcuts and built a live visualization dashboard using Svelte. Containerized services with Docker for portability and automated restarts.",
    image: null, // add gym-proj.png to src/assets/
    type: "Project",
    start: "May 2025",
    end: "Feb 2026",
    techStack: ["Python", "FastAPI", "Svelte", "Chart.js", "Docker", "Tailscale", "Linux Server"],
    source: "Open Source",
    links: [
      { label: "Repository", url: "https://github.com/hub-ry/protocol" },
    ],
  },
  {
    id: "chatterbox",
    title: "Chatterbox",
    subtitle: "Social Media Platform Built in CS180 Team Project",
    description: "This project implements the backend for a social media platform, focusing on both the database and client-server communication. It includes user management, direct messaging, and data persistence using MySQL. The server handles multiple client connections concurrently, with a command-line client application for user interaction. This is close-source to maintain academic integrity with Purdue University.",
    image: chatter,
    type: "Project",
    start: "October 2024",
    end: "December 2024",
    techStack: ["Java", "MySQL", "Swing GUI", "Unit Testing"],
    source: "Closed Source",
  },
]
