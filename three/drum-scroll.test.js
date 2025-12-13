import { describe, it, expect } from 'vitest';
import {
  calculateNumSegments,
  calculateSpacerHeight,
  calculateContentPosition
} from './drum-scroll-utils.js';

describe('drum-scroll 計算関数', () => {
  describe('calculateNumSegments', () => {
    it('コンテンツ高さとパディングからセグメント数を正しく計算する', () => {
      // 1000pxのコンテンツ + 150pxのパディング = 1150px
      // セグメント高さ1000pxで割ると、2セグメント必要
      expect(calculateNumSegments(1000, 150, 1000)).toBe(2);
    });

    it('ちょうど割り切れる場合', () => {
      // 850pxのコンテンツ + 150pxのパディング = 1000px
      // セグメント高さ1000pxで割ると、ちょうど1セグメント
      expect(calculateNumSegments(850, 150, 1000)).toBe(1);
    });

    it('小さいコンテンツの場合', () => {
      // 500pxのコンテンツ + 150pxのパディング = 650px
      // セグメント高さ1000pxで割ると、1セグメント
      expect(calculateNumSegments(500, 150, 1000)).toBe(1);
    });

    it('大きいコンテンツの場合', () => {
      // 3500pxのコンテンツ + 150pxのパディング = 3650px
      // セグメント高さ1000pxで割ると、4セグメント必要
      expect(calculateNumSegments(3500, 150, 1000)).toBe(4);
    });

    it('ゼロのコンテンツ高さ', () => {
      // 0pxのコンテンツ + 150pxのパディング = 150px
      // セグメント高さ1000pxで割ると、1セグメント
      expect(calculateNumSegments(0, 150, 1000)).toBe(1);
    });
  });

  describe('calculateSpacerHeight', () => {
    it('正しいスペーサー高さを計算する', () => {
      // 3セグメント、セグメント高さ1000px、ギャップ20px、ウィンドウ高さ800px
      // 最後のセグメントオフセット = (3-1) * (1000+20) = 2040px
      // スペーサー高さ = 2040 + 800 = 2840px
      expect(calculateSpacerHeight(3, 1000, 20, 800)).toBe(2840);
    });

    it('1セグメントのみの場合', () => {
      // 1セグメント = オフセット0
      // スペーサー高さ = 0 + 800 = 800px
      expect(calculateSpacerHeight(1, 1000, 20, 800)).toBe(800);
    });

    it('ギャップがない場合', () => {
      // 2セグメント、ギャップ0
      // 最後のセグメントオフセット = (2-1) * 1000 = 1000px
      // スペーサー高さ = 1000 + 600 = 1600px
      expect(calculateSpacerHeight(2, 1000, 0, 600)).toBe(1600);
    });
  });

  describe('calculateContentPosition', () => {
    it('最初のセグメントの位置を計算する', () => {
      // セグメント0: 150 - 0*1000 = 150px
      expect(calculateContentPosition(0, 150, 1000)).toBe(150);
    });

    it('2番目のセグメントの位置を計算する', () => {
      // セグメント1: 150 - 1*1000 = -850px
      expect(calculateContentPosition(1, 150, 1000)).toBe(-850);
    });

    it('3番目のセグメントの位置を計算する', () => {
      // セグメント2: 150 - 2*1000 = -1850px
      expect(calculateContentPosition(2, 150, 1000)).toBe(-1850);
    });

    it('異なるパディングでの位置計算', () => {
      // セグメント1、パディング200px: 200 - 1*1000 = -800px
      expect(calculateContentPosition(1, 200, 1000)).toBe(-800);
    });

    it('異なるセグメント高さでの位置計算', () => {
      // セグメント2、セグメント高さ500px: 150 - 2*500 = -850px
      expect(calculateContentPosition(2, 150, 500)).toBe(-850);
    });
  });
});
