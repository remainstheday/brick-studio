import "@livekit/react-components/dist/index.css";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import { PreJoinPage } from "./PreJoinPage";
import { RoomPage } from "./RoomPage";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<RoomPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
