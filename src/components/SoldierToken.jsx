import './SoldierToken.css';

export default function SoldierToken({ color, size = 'medium' }) {
  return (
    <div 
      className={`soldier-token ${size}`} 
      style={{ backgroundColor: color }}
    >
    </div>
  );
}
