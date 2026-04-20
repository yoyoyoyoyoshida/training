const privacyUrl = 'https://math-365-24.com/puzzle/cubePage/toiawase/privacy_policy.html';

function PrivacyPage() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 640 }}>
      <h1>プライバシーポリシー</h1>
      <p>
        データの取り扱いについては公式サイトにて公開しています。下記リンクから最新のプライバシーポリシーをご確認ください。
      </p>
      <a
        href={privacyUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.85rem 1.5rem',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #14b8a6, #22d3ee)',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 15px 35px -20px rgba(20, 184, 166, 0.8)',
        }}
      >
        プライバシーポリシーを開く
      </a>
      <p style={{ fontSize: '0.95rem', color: 'rgba(15, 23, 42, 0.7)' }}>
        URL: <br />
        <a href={privacyUrl} target="_blank" rel="noreferrer">
          {privacyUrl}
        </a>
      </p>
    </section>
  );
}

export default PrivacyPage;
