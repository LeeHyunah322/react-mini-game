import { useState } from "react";
import "./App.css";
import MoleGame from "./games/MoleGame";
import DodgeGame from "./games/DodgeGame";

function App() {
  const [game, setGame] = useState("menu");

  return (
    <div className="app">
      {game === "menu" && (
        <div className="menu">
          <h1>React Mini Game</h1>
          <p>React 상태관리와 이벤트 처리 기반 미니게임</p>

          <div className="menu-buttons">
            <button onClick={() => setGame("mole")}>두더지 잡기</button>
            <button onClick={() => setGame("dodge")}>방향키 장애물 피하기</button>
          </div>
        </div>
      )}

      {game === "mole" && <MoleGame onBack={() => setGame("menu")} />}
      {game === "dodge" && <DodgeGame onBack={() => setGame("menu")} />}
    </div>
  );
}

export default App;