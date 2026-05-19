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

function DodgeGame({ onBack }) {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem("dodgeBestScore")) || 0;
  });

  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState((BOARD_WIDTH - PLAYER_SIZE) / 2);
  const [obstacles, setObstacles] = useState([]);
  const [items, setItems] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);

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
      localStorage.setItem("dodgeBestScore", String(nextBestScore));
      return nextBestScore;
    });
  }, []);

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
  
  const startMove = (direction) => {
    if (!isPlaying) return;

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
    if (!isPlaying) return;

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
    if (!isPlaying) return;

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
        const difficulty = Math.min(7, scoreRef.current / 6);
        const spawnSpeed = Math.max(8, 18 - Math.floor(scoreRef.current / 5));

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
            speed: 4 + difficulty,
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
  }, [isPlaying, activateInvincible, finishGame]);

  return (
    <div className="game-page">
      <button className="back-btn" onClick={onBack}>
        ← 메뉴로
      </button>

      <h1>방향키 장애물 피하기</h1>

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
            <p>방향키로 장애물을 피하세요.</p>
            <p>아이템을 먹으면 유리해집니다.</p>
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
      </div>
	  
	  <div className="mobile-controls">
	    <button
	      type="button"
	      className="mobile-control-btn"
	      onPointerDown={() => startMove("left")}
	      onPointerUp={() => stopMove("left")}
	      onPointerLeave={() => stopMove("left")}
	      onPointerCancel={() => stopMove("left")}
	    >
	      ←
	    </button>

	    <button
	      type="button"
	      className="mobile-control-btn"
	      onPointerDown={() => startMove("right")}
	      onPointerUp={() => stopMove("right")}
	      onPointerLeave={() => stopMove("right")}
	      onPointerCancel={() => stopMove("right")}
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
    </div>
  );
}

export default DodgeGame;