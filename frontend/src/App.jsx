import { GoogleMeet } from "./pages"


const activePage = import.meta.env.VITE_ACTIVE_PAGE

function App() {
  switch (activePage) {
    case 'google-meet':
      return <GoogleMeet />
    case 'zoom':
      return <ZoomPage />
    case 'teams':
      return <TeamsPage />
    default:
      return <div>Unknown page</div>
  }
}

export default App
