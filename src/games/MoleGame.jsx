import { useEffect, useRef, useState } from "react";
import LifeHearts from "../components/LifeHearts";
import GameOverModal from "../components/GameOverModal";
import { getRandomHole} from "../utils/gameUtils";

const MOLE_DIFFICULTY = {
	easy: {
	  label: "Easy",
	  time: 40,
	  speedMin: 900,
	  speedBase: 1700,
	  speedDown: 5,
	  blockerDelay: 6000,
	  heartRate: 0.14,
	  bombRate: 0.08,
	  goldRate: 0.20,
	},
	normal: {
	  label: "Normal",
	  time: 30,
	  speedMin: 700,
	  speedBase: 1400,
	  speedDown: 8,
	  blockerDelay: 4300,
	  heartRate: 0.08,
	  bombRate: 0.12,
	  goldRate: 0.16,
	},
	hard: {
	  label: "Hard",
	  time: 25,
	  speedMin: 500,
	  speedBase: 1100,
	  speedDown: 12,
	  blockerDelay: 3000,
	  heartRate: 0.04,
	  bombRate: 0.22,
	  goldRate: 0.10,
	},
};

function MoleGame({ onBack }) {
	const getRandomTarget = (currentHole = -1, setting = moleSetting) => {
	  const hole = getRandomHole(currentHole);
	  const random = Math.random();

	  let type = "mole";

	  if (random < setting.heartRate) {
	    type = "heart";
	  } else if (random < setting.heartRate + setting.bombRate) {
	    type = "bomb";
	  } else if (random < setting.heartRate + setting.bombRate + setting.goldRate) {
	    type = "gold";
	  }

	  return { hole, type };
	};
	
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem("moleBestScore_normal")) || 0;
  });

  const [time, setTime] = useState(30);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState(() =>
    getRandomTarget(-1, MOLE_DIFFICULTY.normal)
  );
  const [blocker, setBlocker] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState("게임 시작을 누르세요.");
  const [difficulty, setDifficulty] = useState("normal");
  const [isPaused, setIsPaused] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const moleSetting = MOLE_DIFFICULTY[difficulty];
  const getMoleBestScoreKey = (level = difficulty) => {
    return `moleBestScore_${level}`;
  };
  
  useEffect(() => {
    setBestScore(Number(localStorage.getItem(getMoleBestScoreKey())) || 0);
  }, [difficulty]);
  
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const targetRef = useRef(target);
  const gameEndedRef = useRef(false);

  const finishMoleGame = (text = "게임 종료!") => {
    if (gameEndedRef.current) return;

    gameEndedRef.current = true;

    const finalScore = scoreRef.current;

    setIsPlaying(false);
    setIsGameOver(true);
    setMessage(text);

    setBestScore((prevBestScore) => {
      const nextBestScore = Math.max(prevBestScore, finalScore);
      localStorage.setItem(getMoleBestScoreKey(), String(nextBestScore));
      return nextBestScore;
    });
  };

  const loseLife = (text) => {
    const nextLives = livesRef.current - 1;

    livesRef.current = nextLives;
    setLives(nextLives);
    setCombo(0);

    if (nextLives <= 0) {
      finishMoleGame("목숨이 모두 사라졌습니다.");
    } else {
      setMessage(text);
    }
  };

  const changeTarget = () => {
    const nextTarget = getRandomTarget(targetRef.current.hole, moleSetting);
    targetRef.current = nextTarget;
    setTarget(nextTarget);
  };

  const startGame = () => {
    const firstTarget = getRandomTarget(-1, moleSetting);

    setScore(0);
	setTime(moleSetting.time);
	setIsPaused(false);
    setLives(3);
    setTarget(firstTarget);
	setBlocker(null);
    setCombo(0);
    setMessage("두더지를 잡으세요!");
    setIsPlaying(true);
    setIsGameOver(false);

    scoreRef.current = 0;
    livesRef.current = 3;
    targetRef.current = firstTarget;
    gameEndedRef.current = false;
  };
  
  const resetGame = () => {
    setScore(0);
    setTime(moleSetting.time);
    setLives(3);
    setCombo(0);
    setBlocker(null);
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    setMessage("게임 시작을 누르세요.");

    scoreRef.current = 0;
    livesRef.current = 3;
    gameEndedRef.current = false;
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
        if (event.key === "Escape"){
			onBack();
		}
      };

      window.addEventListener("keydown", handleEscBack);

      return () => {
        window.removeEventListener("keydown", handleEscBack);
      };
    }, [onBack]);
  
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const timer = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          finishMoleGame("시간 종료!");
          return 0;
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying,isPaused]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;

	const speed = Math.max(
	  moleSetting.speedMin,
	  moleSetting.speedBase - score * moleSetting.speedDown
	);

	const moleTimer = setInterval(() => {
	  if (targetRef.current.type === "bomb") {
	    setMessage("폭탄 회피 성공!");
	  } else if (targetRef.current.type === "heart") {
	    setMessage("하트가 사라졌습니다.");
	} else {
	    setCombo(0);
	    setMessage("두더지를 놓쳤습니다!");
	  }

	  changeTarget();
	}, speed);
	
    return () => clearInterval(moleTimer);
  }, [isPlaying, isPaused, score, difficulty]);
  
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const blockerTimer = setInterval(() => {
      const size = Math.random() < 0.5 ? 130 : 165;

	  const blockerEmojis = ["🙈", "☁️", "🐾", "🍄", "🧸"];
	  const randomEmoji = blockerEmojis[Math.floor(Math.random() * blockerEmojis.length)];

	  setBlocker({
	    id: Date.now(),
	    emoji: randomEmoji,
	    left: Math.random() * (362 - size),
	    top: Math.random() * (362 - size),
	    size,
	    rotate: Math.random() * 24 - 12,
	  });

      setTimeout(() => {
        setBlocker(null);
      }, 850);
    }, moleSetting.blockerDelay);

    return () => {
      clearInterval(blockerTimer);
      setBlocker(null);
    };
  }, [isPlaying, isPaused, difficulty]);

  const handleHoleClick = (index) => {
    if (!isPlaying || isPaused) return;

    if (index !== target.hole) {
      loseLife("헛방! 목숨 -1");
      return;
    }

    if (target.type === "bomb") {
      loseLife("폭탄 클릭! 목숨 -1");
      changeTarget();
      return;
    }
	
	if (target.type === "heart") {
	  const nextLives = Math.min(3, livesRef.current + 1);

	  livesRef.current = nextLives;
	  setLives(nextLives);
	  setCombo(0);
	  setMessage(nextLives === 3 ? "목숨 최대!" : "하트 획득! 목숨 +1");
	  changeTarget();
	  return;
	}

    if (target.type === "gold") {
      const nextScore = scoreRef.current + 3;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setCombo((prevCombo) => prevCombo + 1);
      setMessage("황금 두더지 +3점!");
      changeTarget();
      return;
    }

    const bonus = combo >= 4 ? 2 : 1;
    const nextScore = scoreRef.current + bonus;

    scoreRef.current = nextScore;
    setScore(nextScore);
    setCombo((prevCombo) => prevCombo + 1);
    setMessage(bonus === 2 ? "콤보 보너스 +2점!" : "성공 +1점!");
    changeTarget();
  };
  
  

  return (
    <div className="game-page">
      <button className="back-btn" onClick={onBack}>
        ← 메뉴로
      </button>

	  <div className="game-title-row">
	    <h1>두더지 잡기</h1>

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

	  <div className="status-box mole-status">
	    <span>시간: {time}초</span>
	    <span>점수: {score}점</span>
	    <span>최고점수: {bestScore}점</span>
	    <span>콤보: {combo}</span>
	  </div>

	  <div className="mole-life-row">
	    <LifeHearts lives={lives} />
	  </div>

      <p className="message">{message}</p>

	  <div className="mole-board-wrap">
	    <div className={`mole-grid ${isGameOver ? "mole-grid-dimmed" : ""}`}>
	      {Array.from({ length: 9 }).map((_, index) => (
	        <button
	          key={index}
	          className={`hole ${index === target.hole && isPlaying ? "active" : ""}`}
	          onClick={() => handleHoleClick(index)}
	        >
	          {index === target.hole && isPlaying && (
	            <span className={`mole-target ${target.type}`}>
				{target.type === "mole" && "🐹"}
				{target.type === "gold" && "🌟"}
				{target.type === "bomb" && "💣"}
				{target.type === "heart" && "❤️"}
	            </span>
	          )}
	        </button>
	      ))}
	    </div>
		{isPlaying && blocker && (
		  <button
		    type="button"
		    className="mole-blocker"
		    style={{
		      left: `${blocker.left}px`,
		      top: `${blocker.top}px`,
		      width: `${blocker.size}px`,
		      height: `${blocker.size}px`,
		      "--rotate": `${blocker.rotate}deg`,
		    }}
		    onPointerDown={() => {
		      setMessage("방해물 제거!");
		      setBlocker(null);
		    }}
		  >
		    {blocker.emoji}
		  </button>
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

	  {!isPlaying && !isGameOver && (
	    <div className="pre-game-card">
	      <div className="difficulty-buttons">
	        {Object.entries(MOLE_DIFFICULTY).map(([key, value]) => (
	          <button
	            key={key}
	            className={`difficulty-btn ${difficulty === key ? "active" : ""}`}
	            onClick={() => setDifficulty(key)}
	          >
	            {value.label}
	          </button>
	        ))}
	      </div>

	      <div className="btn-row" style={{ justifyContent: "center" }}>
	        <button className="start-btn" onClick={startGame}>
	          게임 시작
	        </button>

			<button className="start-btn" onClick={() => setShowGuide(true)}>
			  게임 방법
			</button>
	      </div>
	    </div>
	  )}
	  
	  {showGuide && (
	    <div className="pause-overlay">
	      <div className="pause-card guide-card">
	        <h2>게임 방법</h2>
	        <p>🐹 두더지를 클릭하면 점수가 올라갑니다.</p>
	        <p>🌟 황금 두더지는 +3점입니다.</p>
	        <p>💣 폭탄을 누르면 목숨이 줄어듭니다.</p>
	        <p>❤️ 하트는 목숨을 회복합니다.</p>
	        <p>🙈 방해 이모티콘은 누르면 사라집니다.</p>

	        <button className="start-btn" onClick={() => setShowGuide(false)}>
	          확인
	        </button>
	      </div>
	    </div>
	  )}

    </div>
  );
}

export default MoleGame;