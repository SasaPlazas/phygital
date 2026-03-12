import { useNavigate } from "react-router-dom";
import startBg from "../assets/image 1.png";
import "./StartScreen.css";

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="start-wrapper"
      style={{ backgroundImage: `url(${startBg})` }}
    >
      <div className="start-overlay" />
      <div className="start-content">

        <button
          className="start-cta"
          type="button"
          onClick={() => navigate("/register")}
        >
          Iniciar juego
        </button>
      </div>
    </div>
  );
}
