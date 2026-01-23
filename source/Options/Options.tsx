import {useEffect, useState} from 'react';
import type {FC} from 'react';
import {getStorage, setStorage} from '../utils/storage';
import {Button} from '../components/Button/Button';
import {Input} from '../components/Input/Input';
import styles from './Options.module.scss';

const Options: FC = () => {
  const [fastmailApiKey, setFastmailApiKey] = useState('');
  // const [enableLogging, setEnableLogging] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStorage(['fastmailApiKey']).then((result) => {
      setFastmailApiKey(result.fastmailApiKey);
    });
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await setStorage({fastmailApiKey});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.options}>
      <header className={styles.header}>
        <h1>Extension Settings</h1>
        <p>Configure your extension preferences</p>
      </header>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.section}>
          <Input
            type="password"
            label="Fastmail API key"
            id="fastmailApiKey"
            name="fastmailApiKey"
            placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            spellCheck={false}
            autoComplete="off"
            value={fastmailApiKey}
            onChange={(e): void => setFastmailApiKey(e.target.value)}
          />
        </div>

        {/* <div className={styles.section}>
          <Checkbox
            id="logging"
            name="logging"
            label="Show the features enabled on each page in the console"
            checked={enableLogging}
            onChange={(e): void => setEnableLogging(e.target.checked)}
          />
        </div> */}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="large">
            Save Settings
          </Button>
          {saved && <span className={styles.status}>Settings saved</span>}
        </div>
      </form>

      {/* <footer className={styles.footer}>
        <a
          href="https://github.com/abhijithvijayan/web-extension-starter"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          <GitHubIcon size={18} />
          <span>View on GitHub</span>
        </a>
      </footer> */}
    </div>
  );
};

export default Options;
