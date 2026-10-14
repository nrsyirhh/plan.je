# 🗺️ plan.je

A web-based trip budget visualization and smart itinerary planner designed for exploring Malaysia. Built with a premium glassmorphism UI, plan.je helps travelers calculate costs, find accommodations, and organize their packing lists in seconds.
## 🚀 Getting Started

## 👨‍💻 Developer
Developed by Nur Insyirah binti Zaini for hackathon submission.

*   💰 **Dynamic Budget Visualization:** Interactive slider and live pie charts to track expenses across transport, accommodation, food, and activities.
*   🗺️ **Interactive Accommodation Map:** Integrated map view to select and compare hotels or homestays based on location and price.
*   🚆 **Smart Route & Transport Selection:** Compare the cheapest, fastest, or most balanced travel options (Bus, Train, Flight, e-hailing).
*   📅 **Day-by-Day Itinerary Planner:** Auto-generated travel schedules customized to your destination and trip duration.
*   🎒 **Customizable Packing List:** A smart, interactive checklist where users can add, delete, and categorize essential travel items.
*   📥 **Seamless Exports:** Download your full itinerary and budget breakdown as a PDF, or export it directly to your calendar.
*   🎨 **Premium UI/UX:** Smooth cinematic background crossfades, responsive glassmorphism containers, and intuitive navigation.

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Mapping:** [Leaflet.js](https://leafletjs.com/) (Interactive accommodation maps)
*   **Data Visualization:** [Chart.js](https://www.chartjs.org/) (Budget breakdown charts)
*   **Export Tools:** [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) (Itinerary PDF generation)

## 📋 Project Status & Roadmap

| Task / Feature | Status | Current State & Next Steps |
| :--- | :---: | :--- |
| **Glassmorphism UI** | ✅ Done | Frosted panels, custom signature red buttons (`#E3000F`), and floating interactive elements built in CSS. |
| **Budget & Charts** | ✅ Done | Chart.js integration with customized pie chart colors and interactive red budget slider. |
| **Itinerary Planner** | ✅ Done | Modular day-by-day activity cards with fixed text contrast and rounded export buttons. |
| **Mapping & Routing** | ✅ Done | Leaflet map integration and layout logic for comparing transport/hotels. |
| **Data Architecture** | ✅ Done | Local JSON structures created for routes, KTM schedules, and Malaysia food/hotel guides. |
| **Version Control** | ✅ Done | Resolved nested "folder inception", merged `master` to `main`, and pushed the clean repository to GitHub. |
| **Database Integration** | ❌ Pending | Data is currently static. Ready to swap local JSON files for a cloud database like MongoDB Atlas to save user trips persistently. |
| **Live Deployment** | ❌ Pending | Currently running locally. Ready to be pushed to a live hosting platform so anyone on the internet can access the URL. |
| **User Authentication** | ❌ Pending | (Optional) Adding a login system so users can retrieve their previously saved travel plans. |

## 🚀 Getting Started

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/nrsyirhh/hackathon.git](https://github.com/nrsyirhh/hackathon.git)
