import { useEffect, useState } from 'react';
import { PLL_OPTIONS, getLearnImagePath, LEARN_2D_IMAGES, type PllId } from '../data/pllData';
import { progressManager, type PllStatus } from '../utils/progressManager';
import './NameLearnPage.css';

const statusLabel: Record<PllStatus, string> = {
  correct: '習得済み',
  wrong: '復習中',
  untested: '未学習',
};

function NameLearnPage() {
  const [statuses, setStatuses] = useState<Record<PllId, PllStatus>>({} as Record<PllId, PllStatus>);

  useEffect(() => {
    const loadStatus = async () => {
      const entries = await Promise.all(
        PLL_OPTIONS.map(async (pll) => ({ pll, status: await progressManager.getStatus(pll) })),
      );
      setStatuses(
        entries.reduce((acc, { pll, status }) => {
          acc[pll] = status;
          return acc;
        }, {} as Record<PllId, PllStatus>),
      );
    };
    loadStatus();
  }, []);

  return (
    <section className="name-learn">
      <header className="name-learn__header">
        <h1>名前を覚える</h1>
        <p>
          3D視点と2D視点の両方からPLLを確認できます。正解したPLLは「習得済み」と表示され、誤答したものは「復習中」としてハイライトされます。
        </p>
      </header>

      <div className="name-learn__grid">
        {PLL_OPTIONS.map((pll) => {
          const [front, top] = LEARN_2D_IMAGES[pll];
          const status = statuses[pll] ?? 'untested';
          return (
            <article key={pll} className={`name-card name-card--${status}`}>
              <header>
                <span className="name-card__badge">PLL</span>
                <h2>{pll}</h2>
                <span className="name-card__status">{statusLabel[status]}</span>
              </header>
              <div className="name-card__images">
                <figure>
                  <img src={getLearnImagePath(pll, front)} alt={`${pll} front`} loading="lazy" />
                  <figcaption>正面図</figcaption>
                </figure>
                <figure>
                  <img src={getLearnImagePath(pll, top)} alt={`${pll} top`} loading="lazy" />
                  <figcaption>上面図</figcaption>
                </figure>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default NameLearnPage;
