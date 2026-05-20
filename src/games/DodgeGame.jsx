import { useCallback, useEffect, useRef, useState } from "react";
import LifeHearts from "../components/LifeHearts";
import GameOverModal from "../components/GameOverModal";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PLAYER_SIZE,
  OBSTACLE_SIZE,
  ITEM_SIZE,
  PLAYER_Y,
  clamp,
} from "../utils/gameUtils";

const DODGE_DIFFICULTY = {
  easy: {
    label: "Easy",
    obstacleSpeed: 3,
    speedDivider: 9,
    maxSpeedBonus: 5,
    spawnBase: 24,
    spawnDivider: 7,
    minSpawnSpeed: 12,
  },
  normal: {
    label: "Normal",
    obstacleSpeed: 5,
    speedDivider: 6,
    maxSpeedBonus: 10,
    spawnBase: 18,
    spawnDivider: 5,
    minSpawnSpeed: 8,
  },
  hard: {
    label: "Hard",
    obstacleSpeed: 7,
    speedDivider: 4,
    maxSpeedBonus: 18,
    spawnBase: 14,
    spawnDivider: 2,
    minSpawnSpeed: 4,
  },
};

function DodgeGame({ onBack }) {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem("dodgeBestScore_normal")) || 0;
  });
  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState((BOARD_WIDTH - PLAYER_SIZE) / 2);
  const [obstacles, setObstacles] = useState([]);
  const [items, setItems] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);
  const [difficulty, setDifficulty] = useState("normal");
  const [isPaused, setIsPaused] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const dodgeSetting = DODGE_DIFFICULTY[difficulty];
  const getDodgeBestScoreKey = (level = difficulty) => {
    return `dodgeBestScore_${level}`;
  };

  const changeDifficulty = (level) => {
    setDifficulty(level);
    setBestScore(Number(localStorage.getItem(getDodgeBestScoreKey(level))) || 0);
  };
  
  const keysRef = useRef({
    left: false,
    right: false,
  });

  const playerXRef = useRef((BOARD_WIDTH - PLAYER_SIZE) / 2);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const frameRef = useRef(0);
  const crashedRef = useRef(false);
  const invincibleRef = useRef(false);
  const invincibleTimerRef = useRef(null);

  const finishGame = useCallback(() => {
    const finalScore = scoreRef.current;

    setIsPlaying(false);
    setIsGameOver(true);

    setBestScore((prevBestScore) => {
      const nextBestScore = Math.max(prevBestScore, finalScore);
      localStorage.setItem(getDodgeBestScoreKey(), String(nextBestScore));
      return nextBestScore;
    });
  }, [difficulty]);

  const activateInvincible = useCallback((duration = 3000) => {
    invincibleRef.current = true;
    setIsInvincible(true);

    if (invincibleTimerRef.current) {
      clearTimeout(invincibleTimerRef.current);
    }

    invincibleTimerRef.current = setTimeout(() => {
      invincibleRef.current = false;
      setIsInvincible(false);
    }, duration);
  }, []);

  const startGame = () => {
    const startX = (BOARD_WIDTH - PLAYER_SIZE) / 2;

	setIsPaused(false);
    setScore(0);
    setLives(3);
    setPlayerX(startX);
    setObstacles([]);
    setItems([]);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsInvincible(false);

    playerXRef.current = startX;
    scoreRef.current = 0;
    livesRef.current = 3;
    frameRef.current = 0;
    crashedRef.current = false;
    invincibleRef.current = false;

	keysRef.current.left = false;
	keysRef.current.right = false;
    if (invincibleTimerRef.current) {
      clearTimeout(invincibleTimerRef.current);
    }
  };
  
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setObstacles([]);
    setItems([]);
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    setIsInvincible(false);

    scoreRef.current = 0;
    livesRef.current = 3;
    frameRef.current = 0;
    crashedRef.current = false;
    invincibleRef.current = false;

    keysRef.current.left = false;
    keysRef.current.right = false;

    if (invincibleTimerRef.current) {
      clearTimeout(invincibleTimerRef.current);
    }
  };
  
  useEffect(() => {
    const handleEnterStart = (event) => {
      if (event.key !== "Enter") return;
      if (event.repeat) return;

      if (!isPlaying) {
        document.querySelector(".start-btn")?.click();
      }
    };

    window.addEventListener("keydown", handleEnterStart);

    return () => {
      window.removeEventListener("keydown", handleEnterStart);
    };
  }, [isPlaying]);
  
  useEffect(() => {
    const handleEscBack = (event) => {
      if (event.key === "Escape") {
        keysRef.current.left = false;
        keysRef.current.right = false;
        onBack();
      }
    };

    window.addEventListener("keydown", handleEscBack);

    return () => {
      window.removeEventListener("keydown", handleEscBack);
    };
  }, [onBack]);
  
  const startMove = (direction) => {
    if (!isPlaying || isPaused) return;

    keysRef.current[direction] = true;
  };

  const stopMove = (direction) => {
    keysRef.current[direction] = false;
  };

  const stopAllMoves = () => {
    keysRef.current.left = false;
    keysRef.current.right = false;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        keysRef.current.left = true;
        event.preventDefault();
      }

      if (event.key === "ArrowRight") {
        keysRef.current.right = true;
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "ArrowLeft") {
        keysRef.current.left = false;
        event.preventDefault();
      }

      if (event.key === "ArrowRight") {
        keysRef.current.right = false;
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const scoreTimer = setInterval(() => {
      setScore((prevScore) => {
        const nextScore = prevScore + 1;
        scoreRef.current = nextScore;
        return nextScore;
      });
    }, 1000);

    return () => clearInterval(scoreTimer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const gameLoop = setInterval(() => {
      frameRef.current += 1;

      setPlayerX((prevX) => {
        let move = 0;

        if (keysRef.current.left) move -= 8;
        if (keysRef.current.right) move += 8;

        const nextX = clamp(prevX + move, 0, BOARD_WIDTH - PLAYER_SIZE);
        playerXRef.current = nextX;

        return nextX;
      });

      setObstacles((prevObstacles) => {
		const speedBonus = Math.min(
		  dodgeSetting.maxSpeedBonus,
		  scoreRef.current / dodgeSetting.speedDivider
		);

		const spawnSpeed = Math.max(
		  dodgeSetting.minSpawnSpeed,
		  dodgeSetting.spawnBase - Math.floor(scoreRef.current / dodgeSetting.spawnDivider)
		);
		
        let nextObstacles = prevObstacles
          .map((obstacle) => ({
            ...obstacle,
            y: obstacle.y + obstacle.speed,
          }))
          .filter((obstacle) => obstacle.y < BOARD_HEIGHT + 50);

        if (frameRef.current % spawnSpeed === 0) {
          nextObstacles.push({
            id: Date.now() + Math.random(),
            x: Math.random() * (BOARD_WIDTH - OBSTACLE_SIZE),
            y: -OBSTACLE_SIZE,
            speed: dodgeSetting.obstacleSpeed + speedBonus,
          });
        }

        const px = playerXRef.current;

        const isHit = nextObstacles.some((obstacle) => {
          return (
            obstacle.x < px + PLAYER_SIZE &&
            obstacle.x + OBSTACLE_SIZE > px &&
            obstacle.y < PLAYER_Y + PLAYER_SIZE &&
            obstacle.y + OBSTACLE_SIZE > PLAYER_Y
          );
        });

        if (isHit && !invincibleRef.current && !crashedRef.current) {
          const nextLives = livesRef.current - 1;

          livesRef.current = nextLives;
          setLives(nextLives);

          if (nextLives <= 0) {
            crashedRef.current = true;
            finishGame();
          } else {
            activateInvincible(1200);
          }

          return [];
        }

        return nextObstacles;
      });

      setItems((prevItems) => {
        let nextItems = prevItems
          .map((item) => ({
            ...item,
            y: item.y + item.speed,
          }))
          .filter((item) => item.y < BOARD_HEIGHT + 50);

        if (frameRef.current % 120 === 0) {
          const itemTypes = ["star", "heart", "shield"];
          const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

          nextItems.push({
            id: Date.now() + Math.random(),
            type: randomType,
            x: Math.random() * (BOARD_WIDTH - ITEM_SIZE),
            y: -ITEM_SIZE,
            speed: 3,
          });
        }

        const px = playerXRef.current;

        nextItems = nextItems.filter((item) => {
          const isItemHit =
            item.x < px + PLAYER_SIZE &&
            item.x + ITEM_SIZE > px &&
            item.y < PLAYER_Y + PLAYER_SIZE &&
            item.y + ITEM_SIZE > PLAYER_Y;

          if (!isItemHit) return true;

          if (item.type === "star") {
            setScore((prevScore) => {
              const nextScore = prevScore + 5;
              scoreRef.current = nextScore;
              return nextScore;
            });
          }

          if (item.type === "heart") {
            const nextLives = Math.min(3, livesRef.current + 1);
            livesRef.current = nextLives;
            setLives(nextLives);
          }

          if (item.type === "shield") {
            activateInvincible(3000);
          }

          return false;
        });

        return nextItems;
      });
    }, 30);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, difficulty, activateInvincible, finishGame]);

  return (
    <div className="game-page">
      <button className="back-btn" onClick={onBack}>
        ← 메뉴로
      </button>

	  <div className="game-title-row">
	    <h1>방향키 장애물 피하기</h1>

	    {isPlaying && !isGameOver && (
	      <>
	        <button
	          className="pause-btn"
	          onClick={() => setIsPaused((prev) => !prev)}
	        >
	          {isPaused ? "▶️" : "⏸️"}
	        </button>

	        <button className="pause-btn" onClick={resetGame}>
	          🔄
	        </button>
	      </>
	    )}
	  </div>

	  <div className="status-box dodge-status">
	    <span>점수: {score}점</span>
	    <span>최고점수: {bestScore}점</span>

	    <div className="life-panel">
	      <span>목숨</span>
	      <LifeHearts lives={lives} />
	    </div>
	  </div>

	  <div className="dodge-layout">
      <div className="dodge-board">
        <div
          className={`player ${isInvincible ? "invincible" : ""}`}
          style={{
            left: `${playerX}px`,
            top: `${PLAYER_Y}px`,
          }}
        />

        {obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className="obstacle"
            style={{
              left: `${obstacle.x}px`,
              top: `${obstacle.y}px`,
            }}
          />
        ))}

        {items.map((item) => (
          <div
            key={item.id}
            className={`item item-${item.type}`}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
            }}
          >
            {item.type === "star" && "⭐"}
            {item.type === "heart" && "❤️"}
            {item.type === "shield" && "🛡️"}
          </div>
        ))}

		{!isPlaying && !isGameOver && (
		  <div className="board-overlay">
		    <h3>게임 방법</h3>
		    <p>← → 방향키 또는 모바일 버튼으로 이동합니다.</p>
		    <p>빨간 장애물을 피하세요.</p>
		    <p>⭐ 점수 +5 / ❤️ 목숨 회복 / 🛡️ 3초 무적</p>

		    <div className="difficulty-buttons">
		      {Object.entries(DODGE_DIFFICULTY).map(([key, value]) => (
		        <button
		          key={key}
		          className={`difficulty-btn ${difficulty === key ? "active" : ""}`}
		          onClick={() => changeDifficulty(key)}
		        >
		          {value.label}
		        </button>
		      ))}
		    </div>

			<button className="start-btn" onClick={startGame}>
			  게임 시작
			</button>
		  </div>
		)}

		{isGameOver && (
		  <GameOverModal
		    title="게임오버!"
		    score={score}
		    bestScore={bestScore}
		    onRestart={startGame}
		  />
		)}
		
		{isPaused && (
		  <div className="pause-overlay">
		    <div className="pause-card">
		      <h2>일시정지</h2>
		      <div className="btn-row">
		        <button className="start-btn" onClick={() => setIsPaused(false)}>
		          계속하기
		        </button>
		        <button className="start-btn" onClick={onBack}>
		          메뉴로
		        </button>
		      </div>
		    </div>
		  </div>
		)}
      </div>
	  
	  <div className="mobile-controls">
	    <button
	      type="button"
	      className="mobile-control-btn"
	      onPointerDown={() => startMove("left")}
	      onPointerUp={() => stopMove("left")}
		  onPointerLeave={stopAllMoves}
		  onPointerCancel={stopAllMoves}
	    >
	      ←
	    </button>

	    <button
	      type="button"
	      className="mobile-control-btn"
	      onPointerDown={() => startMove("right")}
	      onPointerUp={() => stopMove("right")}
		  onPointerLeave={stopAllMoves}
		  onPointerCancel={stopAllMoves}
	    >
	      →
	    </button>
	  </div>
	  
	  <div className="item-guide">
	    <p className="guide-title">아이템</p>
	    <p>⭐ 점수 +5</p>
	    <p>❤️ 목숨 회복</p>
	    <p>🛡️ 3초 무적</p>

	    {isInvincible && <p className="invincible-text">현재 무적 상태</p>}
	  </div>
	  </div>
	  {showGuide && (
	    <div className="pause-overlay">
	      <div className="pause-card guide-card">
	        <h2>게임 방법</h2>
	        <p>← → 방향키 또는 모바일 버튼으로 이동합니다.</p>
	        <p>빨간 장애물을 피하세요.</p>
	        <p>⭐ 별: 점수 +5</p>
	        <p>❤️ 하트: 목숨 회복</p>
	        <p>🛡️ 방패: 3초 무적</p>

	        <button className="start-btn" onClick={() => setShowGuide(false)}>
	          확인
	        </button>
	      </div>
	    </div>
	  )}
    </div>
  );
}

export default DodgeGame;