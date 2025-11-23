import "./Logo.css";
import logoImg from "../../assets/logo.png";

export const Logo = () => {
  return (
    <div className="app-logo">
      <img src={logoImg} alt="AI Show Logo" className="logo-img" />
    </div>
  );
};
