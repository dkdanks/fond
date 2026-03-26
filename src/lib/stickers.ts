export interface StickerDef {
  id: string
  name: string
  category: string
  src: string
}

export interface StickerCategory {
  id: string
  label: string
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  { id: 'florals',    label: 'Florals'    },
  { id: 'ribbon',     label: 'Ribbon'     },
  { id: 'frames',     label: 'Frames'     },
  { id: 'script',     label: 'Script'     },
  { id: 'geometric',  label: 'Geometric'  },
]

export const STICKERS: StickerDef[] = [
  // Florals
  { id: 'rose',           name: 'Rose',           category: 'florals',   src: '/stickers/florals/rose.svg'          },
  { id: 'peony',          name: 'Peony',          category: 'florals',   src: '/stickers/florals/peony.svg'         },
  { id: 'leaf-branch',    name: 'Leaf Branch',    category: 'florals',   src: '/stickers/florals/leaf-branch.svg'   },
  { id: 'wildflower',     name: 'Wildflower',     category: 'florals',   src: '/stickers/florals/wildflower.svg'    },
  { id: 'eucalyptus',     name: 'Eucalyptus',     category: 'florals',   src: '/stickers/florals/eucalyptus.svg'    },
  // Ribbon
  { id: 'bow',            name: 'Bow',            category: 'ribbon',    src: '/stickers/ribbon/bow.svg'            },
  { id: 'ribbon-corner',  name: 'Corner',         category: 'ribbon',    src: '/stickers/ribbon/ribbon-corner.svg'  },
  { id: 'wavy-line',      name: 'Wavy Line',      category: 'ribbon',    src: '/stickers/ribbon/wavy-line.svg'      },
  // Frames
  { id: 'arch',           name: 'Arch',           category: 'frames',    src: '/stickers/frames/arch.svg'           },
  { id: 'corner-flourish',name: 'Flourish',       category: 'frames',    src: '/stickers/frames/corner-flourish.svg'},
  { id: 'oval-frame',     name: 'Oval Frame',     category: 'frames',    src: '/stickers/frames/oval-frame.svg'     },
  // Script
  { id: 'ampersand',      name: 'Ampersand',      category: 'script',    src: '/stickers/script/ampersand.svg'      },
  { id: 'heart',          name: 'Heart',          category: 'script',    src: '/stickers/script/heart.svg'          },
  { id: 'heart-outline',  name: 'Heart Outline',  category: 'script',    src: '/stickers/script/heart-outline.svg'  },
  { id: 'forever',        name: 'Forever',        category: 'script',    src: '/stickers/script/forever.svg'        },
  // Geometric
  { id: 'diamond',        name: 'Diamond',        category: 'geometric', src: '/stickers/geometric/diamond.svg'     },
  { id: 'star',           name: 'Star',           category: 'geometric', src: '/stickers/geometric/star.svg'        },
  { id: 'circle-dots',    name: 'Circle',         category: 'geometric', src: '/stickers/geometric/circle-dots.svg' },
  { id: 'confetti-dot',   name: 'Confetti',       category: 'geometric', src: '/stickers/geometric/confetti-dot.svg'},
]

export function stickersByCategory(categoryId: string): StickerDef[] {
  return STICKERS.filter(s => s.category === categoryId)
}
