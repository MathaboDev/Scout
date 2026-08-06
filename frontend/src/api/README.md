frontend/
├── src/
│   ├── api/
│   │   └── client.js          # one place all API calls go through, attaches the auth token automatically
│   ├── context/
│   │   └── AuthContext.jsx      # stores ONLY the token — never profile data (see security note below)
│   ├── components/                # reusable pieces — a card, a button, a badge
│   └── pages/                       # one file per screen — Login, Profile, Opportunities, etc.