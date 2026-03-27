export const projects = [
  {
    id: "ticketing-system",
    title: "Full Stack Ticketing System",
    subtitle: "Building a Full-Stack Ticketing System for Purdue GrandPrix 2027",
    description: "Building a full-stack ticketing system for Purdue Grand Prix 2027 using FastAPI, SQLite3, OpenCV, and Stripe to handle payments, QR code generation, and secure entry validation. Still in active development, with QR code email delivery, frontend implementation, and stress testing on the roadmap.",
    image: null, // add ticket.jpg to src/assets/
    type: "Project",
    start: "September 2025",
    end: "Present",
    techStack: ["Python", "FastAPI", "Sqlite3", "OpenCV", "Stripe API"],
    source: "In Development",
  },
  {
    id: "attendance-automation",
    title: "Attendance Automation",
    subtitle: "Automated meeting and office hours attendance using Python and Excel in my role at Purdue Grand Prix.",
    description: "Included openpyxl to automate meeting attendance through pulling from Microsoft Forms, coloring cells, and reuploading to cloud. An idea I have is to work with an OCR library like Tesseract to work with paper logs more efficiently.",
    image: null, // add attendance.jpg to src/assets/
    type: "Presentation",
    start: "September 2025",
    end: "October 2025",
    techStack: ["Python", "Excel"],
    source: "Closed Source",
  },
  {
    id: "personal-server",
    title: "Self-Hosted Linux Server",
    subtitle: "Secure remote infrastructure for private application hosting",
    description: "Built and configured a personal Linux server for self-hosting applications and experimentation. Implemented secure remote access via SSH and mesh VPN networking using Tailscale. Configured firewall rules, user permissions, and service management to support reliable, private deployment of containerized applications.",
    image: null, // add ssh-project.png to src/assets/
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
    start: "Aug 2025",
    end: "Feb 2026",
    techStack: ["Python", "FastAPI", "Svelte", "Chart.js", "Docker", "Tailscale", "Linux Server"],
    source: "Open Source",
    links: [
      { label: "Repository", url: "https://github.com/hub-ry/protocol" },
      { label: "Live Demo", url: "https://hub-ry.github.io/protocol-demo/" },
    ],
  },
  {
    id: "chatterbox",
    title: "Chatterbox",
    subtitle: "Social Media Platform Built in CS180 Team Project",
    description: "This project implements the backend for a social media platform, focusing on both the database and client-server communication. It includes user management, direct messaging, and data persistence using MySQL. The server handles multiple client connections concurrently, with a command-line client application for user interaction.",
    image: null, // add chatter-proj.png to src/assets/
    type: "Project",
    start: "October 2024",
    end: "December 2024",
    techStack: ["Java", "MySQL", "Swing GUI", "Unit Testing"],
    source: "Closed Source",
  },
]
