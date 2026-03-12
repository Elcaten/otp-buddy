import {useEffect, useState} from 'react';
import clsx from 'clsx';
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
      <img
        src="/assets/images/loading_splash_light.webp"
        alt="Loading"
        className={clsx(s.splashImage, s.splashImageLight)}
      />
      <img
        src="/assets/images/loading_splash_dark.webp"
        alt="Loading"
        className={clsx(s.splashImage, s.splashImageDark)}
      />
      <div className={s.progressBarContainer}>
        <div className={s.progressBarTrack}>
          <div 
            className={s.progressBarFill}
            style={{width: `${progress}%`}}
          />
        </div>
      </div>
    </div>
  );
};
