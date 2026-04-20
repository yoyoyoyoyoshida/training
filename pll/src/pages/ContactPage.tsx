const contactUrl = 'https://math-365-24.com/puzzle/cubePage/toiawase/';

function ContactPage() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 640 }}>
      <h1>お問い合わせ</h1>
      <p>
        ご意見・不具合のご連絡は、以下の公式フォームよりお願いいたします。新しいタブで開きますので、記入後に戻って学習を続けられます。
      </p>
      <a
        href={contactUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.85rem 1.5rem',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 15px 35px -20px rgba(14, 165, 233, 0.8)',
        }}
      >
        お問い合わせフォームを開く
      </a>
      <p style={{ fontSize: '0.95rem', color: 'rgba(15, 23, 42, 0.7)' }}>
        URL: <br />
        <a href={contactUrl} target="_blank" rel="noreferrer">
          {contactUrl}
        </a>
      </p>
    </section>
  );
}

export default ContactPage;
