import {useEffect, useState} from 'react';
import s from './splash-screen.module.scss';

export const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const minDisplayTime = 1000;
    const animationDuration = 800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min((elapsed / animationDuration) * 100, 100);
      setProgress(progressValue);

      if (progressValue >= 100 && elapsed >= minDisplayTime) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={s.container}>
      <LightningMailIcon className={s.lightningMailIcon} />
      <div className={s.progressBarContainer}>
        <div className={s.progressBarTrack}>
          <div className={s.progressBarFill} style={{width: `${progress}%`}} />
        </div>
      </div>
    </div>
  );
};

const LightningMailIcon = ({className}: {className: string}) => (
  <svg
    viewBox="0 0 100 70"
    fill="none"
    stroke="currentColor"
    strokeWidth="5.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="5" width="90" height="60" rx="8" id="rect1" />
    <line x1="10" y1="10" x2="28" y2="28" id="line1" />
    <line x1="10" y1="60" x2="28" y2="42" id="line2" />
    <line x1="90" y1="10" x2="72" y2="28" id="line3" />
    <line x1="90" y1="60" x2="72" y2="42" id="line4" />
    <path
      d="M 58.06,17.87 Q 59.30,15.70 57.51,17.45 L 39.14,35.28 Q 37.35,37.02 39.84,37.29 L 46.66,38.00 Q 49.15,38.26 47.95,40.46 L 41.19,52.77 Q 39.99,54.96 41.73,53.16 L 58.98,35.25 Q 60.71,33.45 58.23,33.19 L 52.26,32.56 Q 49.77,32.30 51.02,30.13 Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
