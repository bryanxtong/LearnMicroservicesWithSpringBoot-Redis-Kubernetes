import './App.css';
import ChallengeComponent from "./components/ChallengeComponent";
import { getUsername, logout } from './keycloak';

function App() {
  const username = getUsername();

  return (
    <div>
      <header className="app-header">
        <span className="user-info">Welcome, <strong>{username}</strong></span>
        <button className="logout-button" onClick={logout}>Logout</button>
      </header>
      <ChallengeComponent/>
    </div>
  );
}

export default App;
