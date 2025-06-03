# Everything About My Car

A comprehensive vehicle management Progressive Web App (PWA) that helps you keep track of all your vehicle information in one place.

## Features

- **Document Analysis**: Import and analyze vehicle-related documents (images, PDFs) using OpenAI
- **Vehicle Information**: Store and manage detailed information about your vehicles
- **Maintenance Tracking**: Keep track of maintenance records and service history
- **Upcoming Maintenance**: Get notified about upcoming maintenance tasks
- **Recall Notifications**: Stay informed about vehicle recalls
- **PWA Support**: Install the app on your device for offline access

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **CSS Framework**: Tailwind CSS 3.4 with @tailwindcss/forms plugin
- **Routing**: React Router DOM 7
- **Backend/Database**: Supabase (authentication, data storage)
- **AI Integration**: OpenAI API for document analysis
- **PWA Support**: Vite PWA plugin with service worker

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/dlarmitage/everythingaboutmycar.git
   cd everythingaboutmycar
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your API keys
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Building for Production

```bash
npm run build
```

## License

This project is private and not licensed for public use.
