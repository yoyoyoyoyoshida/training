/**
 * カルーセルの無限ループ座標計算を行うピュアドメインロジック
 * DOM非依存のため、テスト環境（Node/Vitest）でも100%単体テスト可能
 */
export class MarqueeCalculator {
    /**
     * ループ距離に基づき、シームレスな連続移動後のオフセットを計算する
     * @param currentOffset 現在の translateX（負値〜0）
     * @param delta 移動量（正で左方向へスクロール）
     * @param loopDistance 1グループ分の正確なスクロール距離（px）
     * @returns 補正後の translateX
     */
    public static step(currentOffset: number, delta: number, loopDistance: number): number {
        if (loopDistance <= 0) {
            return currentOffset;
        }

        let next = currentOffset - delta;

        // 左端へ1周期分進み切ったら、シームレスに手前に巻き戻す
        while (next <= -loopDistance) {
            next += loopDistance;
        }

        // 右方向へのドラッグ等で0を超えたら、奥へ巻き戻す
        while (next > 0) {
            next -= loopDistance;
        }

        return next;
    }

    /**
     * 指定した方向（次/前）へのボタン押下時スクロールオフセットを計算する
     */
    public static shift(currentOffset: number, direction: 'prev' | 'next', stepAmount: number, loopDistance: number): number {
        const delta = direction === 'next' ? stepAmount : -stepAmount;
        return this.step(currentOffset, delta, loopDistance);
    }
}
