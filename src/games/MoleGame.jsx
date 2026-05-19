import { useEffect, useRef, useState } from "react";
import LifeHearts from "../components/LifeHearts";
import GameOverModal from "../components/GameOverModal";
import { getRandomHole} from "../utils/gameUtils";

function MoleGame({ onBack }) {
	const getRandomTarget = (currentHole = -1) => {
	  const hole = getRandomHole(currentHole);
	  const random = Math.random();

	  let type = "mole";

	  if (random < 0.08) {
	    type = "heart";
	  } else if (random < 0.20) {
	    type = "bomb";
	  } else if (random < 0.36) {
	    type = "gold";
	  }

	  return { hole, type };
	};
	
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem("moleBestScore")) || 0;
  });

  const [time, setTime] = useState(30);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState(getRandomTarget());
  const [blocker, setBlocker] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState("게임 시작을 누르세요.");

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
      localStorage.setItem("moleBestScore", String(nextBestScore));
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
    const nextTarget = getRandomTarget(targetRef.current.hole);
    targetRef.current = nextTarget;
    setTarget(nextTarget);
  };

  const startGame = () => {
    const firstTarget = getRandomTarget();

    setScore(0);
    setTime(30);
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

  useEffect(() => {
    if (!isPlaying) return;

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
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const speed = Math.max(700, 1400 - score * 8);

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
  }, [isPlaying, score]);
  
  useEffect(() => {
    if (!isPlaying) return;

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
    }, 2600);

    return () => {
      clearInterval(blockerTimer);
      setBlocker(null);
    };
  }, [isPlaying]);

  const handleHoleClick = (index) => {
    if (!isPlaying) return;

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

      <h1>두더지 잡기</h1>

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
	  </div>

      {!isPlaying && !isGameOver && (
        <button className="start-btn" onClick={startGame}>
          게임 시작
        </button>
      )}


    </div>
  );
}

export default MoleGame;