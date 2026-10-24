import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { MachineStatus } from '../model';
import { RenderError } from '../utils/errors';
import { PALETTE } from './look';

export interface CanvasTextureFactory {
  floor(): Texture;
  wall(): Texture;
  hazard(): Texture;
  photoSign(): Texture;
  screen(label: string, status: MachineStatus, inverted: boolean): Texture;
  sign(label: string): Texture;
}

const FONT_STACK = 'Arial Black, Arial, sans-serif';
const FULL_CIRCLE = Math.PI * 2;

function css(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

const STATUS_STYLE: Record<MachineStatus, { color: string; word: string; wordPx: number }> = {
  run: { color: css(PALETTE.screenRun), word: 'RUN', wordPx: 34 },
  warn: { color: css(PALETTE.screenWarn), word: 'WARN', wordPx: 34 },
  down: { color: css(PALETTE.screenDown), word: 'ALARM', wordPx: 46 },
};

export function createCanvasTextureFactory(doc: Document, options: { anisotropy: number }): CanvasTextureFactory {
  function canvasTexture(
    width: number,
    height: number,
    draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    repeating = false,
  ): Texture {
    const canvas = doc.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new RenderError('sceneBuild', `canvas 2d context unavailable: size=${width}x${height}`);
    draw(context, width, height);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = options.anisotropy;
    if (repeating) texture.wrapS = texture.wrapT = RepeatWrapping;
    return texture;
  }

  return {
    floor: () =>
      canvasTexture(
        128,
        128,
        (g, w, h) => {
          g.fillStyle = css(PALETTE.floorTile);
          g.fillRect(0, 0, w, h);
          g.fillStyle = css(PALETTE.floorHole);
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
              g.beginPath();
              g.arc(16 + i * 32, 16 + j * 32, 7, 0, FULL_CIRCLE);
              g.fill();
            }
          }
          g.strokeStyle = css(PALETTE.outline);
          g.lineWidth = 6;
          g.strokeRect(0, 0, w, h);
        },
        true,
      ),
    wall: () =>
      canvasTexture(
        256,
        256,
        (g, w, h) => {
          g.fillStyle = css(PALETTE.wallPanel);
          g.fillRect(0, 0, w, h);
          g.strokeStyle = css(PALETTE.outline);
          g.lineWidth = 8;
          g.strokeRect(0, 0, w, h);
          g.lineWidth = 4;
          g.beginPath();
          g.moveTo(0, 190);
          g.lineTo(w, 190);
          g.stroke();
          g.fillStyle = 'rgba(0,0,0,.45)';
          for (let x = 0; x < w; x += 8) {
            for (let y = 200; y < h; y += 8) {
              g.beginPath();
              g.arc(x + 4, y + 4, 1.6, 0, FULL_CIRCLE);
              g.fill();
            }
          }
        },
        true,
      ),
    hazard: () =>
      canvasTexture(
        128,
        128,
        (g, w, h) => {
          g.fillStyle = css(PALETTE.hazardYellow);
          g.fillRect(0, 0, w, h);
          g.fillStyle = css(PALETTE.hazardBlack);
          for (let k = -h; k < w + h; k += 32) {
            g.beginPath();
            g.moveTo(k, h);
            g.lineTo(k + 16, h);
            g.lineTo(k + 16 + h, 0);
            g.lineTo(k + h, 0);
            g.fill();
          }
        },
        true,
      ),
    photoSign: () =>
      canvasTexture(512, 128, (g, w, h) => {
        g.fillStyle = css(PALETTE.hazardBlack);
        g.fillRect(0, 0, w, h);
        g.fillStyle = css(PALETTE.hazardYellow);
        g.font = `900 64px ${FONT_STACK}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('PHOTO AREA', w / 2, h / 2 + 4);
      }),
    screen: (label, status, inverted) =>
      canvasTexture(256, 160, (g, w, h) => {
        const { color, word, wordPx } = STATUS_STYLE[status];
        const background = css(PALETTE.screenBg);
        g.fillStyle = inverted ? color : background;
        g.fillRect(0, 0, w, h);
        g.fillStyle = inverted ? background : color;
        g.fillRect(0, 0, w, 36);
        g.fillStyle = inverted ? color : background;
        g.font = `900 28px ${FONT_STACK}`;
        g.textBaseline = 'middle';
        g.fillText(label, 12, 19);
        g.fillStyle = inverted ? background : color;
        g.font = `900 ${wordPx}px ${FONT_STACK}`;
        g.fillText(word, 14, 84);
        for (let i = 0; i < 6; i++) g.fillRect(14, 112 + (i % 3) * 14, 40 + ((i * 53) % 150), 6);
      }),
    sign: (label) =>
      canvasTexture(256, 64, (g, w, h) => {
        g.fillStyle = css(PALETTE.mask);
        g.fillRect(0, 0, w, h);
        g.strokeStyle = css(PALETTE.outline);
        g.lineWidth = 8;
        g.strokeRect(0, 0, w, h);
        g.fillStyle = css(PALETTE.outline);
        g.font = `900 38px ${FONT_STACK}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(label, w / 2, h / 2 + 2);
      }),
  };
}
