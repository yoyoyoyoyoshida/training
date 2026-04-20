import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import './layout.css';

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M12 22a2.25 2.25 0 0 0 2.122-1.5h-4.244A2.25 2.25 0 0 0 12 22Zm7.5-6.75c-1.742-1.528-2.25-3.179-2.25-6 0-2.97-2.122-5.25-5.25-5.25S6.75 6.28 6.75 9.25c0 2.821-.508 4.472-2.25 6L4 16.25v1.5h16v-1.5l-.5-.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Layout({ children }: PropsWithChildren) {
  const location = useLocation();
  const isHomeActive = location.pathname === '/';
  const isAnnouncementsActive = location.pathname.startsWith('/announcements');
  const [menuOpen, setMenuOpen] = useState(false);
  const contactUrl = 'https://math-365-24.com/puzzle/cubePage/toiawase/';
  const privacyUrl = 'https://math-365-24.com/puzzle/cubePage/toiawase/privacy_policy.html';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const closeMenu = () => setMenuOpen(false);

  const pageBackdrop = {
    backgroundImage:
      'linear-gradient(135deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.97) 45%, rgba(255,255,255,0.98) 100%)',
  } as const;

  return (
    <div className="app-shell" style={pageBackdrop}>
      <div className="app-shell__background" aria-hidden="true">
        <span className="app-shell__grid" />
        <span className="app-shell__beam app-shell__beam--one" />
        <span className="app-shell__beam app-shell__beam--two" />
        <span className="app-shell__spark" />
        <span className="app-shell__cube app-shell__cube--one" />
        <span className="app-shell__cube app-shell__cube--two" />
        <span className="app-shell__cube app-shell__cube--three" />
      </div>
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <Link to="/" className="app-shell__brand">
            <span className="app-shell__brand-primary">2side PLL</span>
            <span className="app-shell__brand-secondary">Recognition</span>
          </Link>
          <div className="app-shell__nav-region">
            <nav className="app-shell__nav">
              <div className="app-shell__nav-group">
                <Link
                  to="/"
                  className={clsx('app-shell__nav-link', { 'is-active': isHomeActive })}
                >
                  PLLホーム
                </Link>
                <Link
                  to="/announcements"
                  className={clsx('app-shell__nav-icon', { 'is-active': isAnnouncementsActive })}
                  aria-label="お知らせ"
                >
                  <BellIcon />
                </Link>
              </div>
              <a
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
                className="app-shell__nav-link app-shell__nav-link--external"
              >
                お問い合わせ<span aria-hidden="true">↗</span>
              </a>
              <a
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="app-shell__nav-link app-shell__nav-link--external"
              >
                プライバシーポリシー<span aria-hidden="true">↗</span>
              </a>
            </nav>
            <button
              type="button"
              className={clsx('app-shell__menu-toggle', { 'is-open': menuOpen })}
              onClick={toggleMenu}
              aria-label="メニュー"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      {menuOpen ? <div className="app-shell__menu-backdrop" onClick={closeMenu} /> : null}
      <aside className={clsx('app-shell__menu', { 'is-open': menuOpen })}>
        <h2>メニュー</h2>
        <ul className="app-shell__menu-list">
          <li>
            <a href="https://apps.apple.com/jp/app/2sidepll/id6747999697" target="_blank" rel="noreferrer">
              App Store ダウンロード
            </a>
          </li>
          <li>
            <Link to="/profile">プロフィール</Link>
          </li>
          <li>
            <Link to="/practice">練習</Link>
          </li>
          <li>
            <Link to="/practice/time-attack">対戦</Link>
          </li>
          <li>
            <Link to="/ranking">ランキング</Link>
          </li>
          <li className="app-shell__menu-contact">
            <a href={contactUrl} target="_blank" rel="noreferrer">
              お問い合わせ ↗
            </a>
          </li>
          <li className="app-shell__menu-secondary">
            <a href={privacyUrl} target="_blank" rel="noreferrer">
              プライバシーポリシー ↗
            </a>
          </li>
        </ul>
        <button type="button" className="app-shell__menu-close" onClick={closeMenu}>
          閉じる
        </button>
      </aside>
      <main className="app-shell__main">
        <div className="app-shell__content">{children}</div>
      </main>
      <footer className="app-shell__footer">
        <small>© {new Date().getFullYear()} PLL Recognition</small>
      </footer>
    </div>
  );
}

export default Layout;
