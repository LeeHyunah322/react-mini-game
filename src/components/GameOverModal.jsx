function GameOverModal({ title = "게임오버!", score, bestScore, onRestart }) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <h2>{title}</h2>
        <p>최종 점수: {score}점</p>
        <p>최고 점수: {bestScore}점</p>

        <button className="start-btn" onClick={onRestart}>
          다시 시작
        </button>
      </div>
    </div>
  );
}

export default GameOverModal;