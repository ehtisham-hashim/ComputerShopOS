// Brand image asset imports
import tasnimHeader from '../../assets/brands/tasnim_computers/header.jpg';
import tasnimStamp from '../../assets/brands/tasnim_computers/stamp.jpg';
import tasnimPc from '../../assets/brands/tasnim_computers/pc.png';

import farhanPcHeader from '../../assets/brands/farhan_computers/header.jpg';
import farhanPcStamp from '../../assets/brands/farhan_computers/stamp.png';
import farhanPcFooter from '../../assets/brands/farhan_computers/footer.jpg';
import farhanPcPc from '../../assets/brands/farhan_computers/pc.jpg';

import farhanEntHeader from '../../assets/brands/farhan_enterprises/header.jpg';
import farhanEntStamp from '../../assets/brands/farhan_enterprises/stamp.png';
import farhanEntFooter from '../../assets/brands/farhan_enterprises/footer.jpg';
import farhanEntDevice from '../../assets/brands/farhan_enterprises/device.jpg';

import tasnimWm from '../../assets/brands/tasnim_computers/watermark.png';
import farhanPcWm from '../../assets/brands/farhan_computers/watermark.png';
import farhanEntWm from '../../assets/brands/farhan_enterprises/watermark.png';

import { BrandType } from '../../db/schema';

export const BRAND_ASSETS_MAP = {
  tasnim_computers: {
    header: tasnimHeader,
    stamp: tasnimStamp,
    graphic: tasnimPc,
    watermark: tasnimWm,
  },
  farhan_computers: {
    header: farhanPcHeader,
    stamp: farhanPcStamp,
    footer: farhanPcFooter,
    graphic: farhanPcPc,
    watermark: farhanPcWm,
  },
  farhan_enterprises: {
    header: farhanEntHeader,
    stamp: farhanEntStamp,
    footer: farhanEntFooter,
    graphic: farhanEntDevice,
    watermark: farhanEntWm,
  },
};

export interface BrandImageBuffers {
  header: Uint8Array | null;
  stamp: Uint8Array | null;
  footer?: Uint8Array | null;
  graphic?: Uint8Array | null;
  watermark?: Uint8Array | null;
}

const bufferCache = new Map<string, Uint8Array>();

async function urlToUint8Array(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  if (bufferCache.has(url)) return bufferCache.get(url)!;

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    bufferCache.set(url, uint8);
    return uint8;
  } catch (err) {
    console.warn('Failed to load image asset as Uint8Array:', url, err);
    return null;
  }
}

export async function loadBrandAssets(brand: BrandType): Promise<BrandImageBuffers> {
  if (brand === 'tasnim_computers') {
    const [header, stamp, graphic, watermark] = await Promise.all([
      urlToUint8Array(tasnimHeader),
      urlToUint8Array(tasnimStamp),
      urlToUint8Array(tasnimPc),
      urlToUint8Array(tasnimWm),
    ]);
    return { header, stamp, graphic, watermark };
  } else if (brand === 'farhan_computers') {
    const [header, stamp, footer, graphic, watermark] = await Promise.all([
      urlToUint8Array(farhanPcHeader),
      urlToUint8Array(farhanPcStamp),
      urlToUint8Array(farhanPcFooter),
      urlToUint8Array(farhanPcPc),
      urlToUint8Array(farhanPcWm),
    ]);
    return { header, stamp, footer, graphic, watermark };
  } else {
    // Farhan Enterprises
    const [header, stamp, footer, graphic, watermark] = await Promise.all([
      urlToUint8Array(farhanEntHeader),
      urlToUint8Array(farhanEntStamp),
      urlToUint8Array(farhanEntFooter),
      urlToUint8Array(farhanEntDevice),
      urlToUint8Array(farhanEntWm),
    ]);
    return { header, stamp, footer, graphic, watermark };
  }
}
