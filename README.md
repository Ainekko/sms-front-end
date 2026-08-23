# Broadr SMS Frontend — SvelteKit & Tailwind CSS

This is the SvelteKit client dashboard for the Broadr SMS Marketing Platform, communicating with the FastAPI backend to visualize campaign metrics and schedule SMS outreach.

## 🚀 Key Features

- **Dynamic Campaign Analytics**: Charts tracking real-time delivery and click-through statistics.
- **Bulk CSV Upload Wizard**: Seamless client interface mapping to the backend validation pipeline.
- **B2B Contact CRM**: List view of verified contacts, filtering invalid or blacklisted numbers.
- **Active Chat Center**: Real-time conversation threads showing incoming Twilio replies and letting operators reply directly.

## ⚙️ Development Commands

This project uses `pnpm` for packages:
```bash
# Install dependencies
pnpm install

# Start local server
pnpm run dev
```
Ensure you have configured a `.env` file containing `VITE_API_BASE_URL` pointing to your running backend API.
