/**
 * ArUco 标记码生成器
 * 用于生成 4x4 字典的 ArUco Markers
 * 这些标记码是计算机视觉识别的核心锚点
 */

// ArUco 4x4_50 字典 - 预定义的二进制编码
// 每个标记是一个 4x4 的二进制矩阵
const ARUCO_DICT_4X4_50 = [
  // ID 0
  [
    [0, 0, 0, 0],
    [0, 1, 0, 1],
    [1, 1, 0, 0],
    [0, 1, 1, 1]
  ],
  // ID 1
  [
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [1, 0, 0, 0],
    [0, 1, 0, 1]
  ],
  // ID 2
  [
    [1, 1, 0, 0],
    [0, 0, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 1, 0]
  ],
  // ID 3
  [
    [0, 1, 1, 0],
    [0, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 0, 0]
  ],
  // ID 4
  [
    [0, 0, 1, 1],
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [1, 1, 0, 1]
  ],
  // ID 5
  [
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 1, 0],
    [1, 1, 1, 1]
  ],
  // ID 6
  [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 0]
  ],
  // ID 7
  [
    [0, 1, 0, 1],
    [0, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 0]
  ],
  // ID 8 - 用于 0m 位置
  [
    [0, 0, 0, 1],
    [1, 0, 1, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 1]
  ],
  // ID 9 - 用于 1m 位置
  [
    [1, 0, 0, 0],
    [1, 0, 1, 0],
    [1, 0, 1, 0],
    [1, 0, 1, 1]
  ],
  // ID 10 - 用于 1.8m 位置
  [
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [0, 0, 1, 1],
    [0, 1, 0, 0]
  ],
  // ID 11 - 用于 2.4m 位置
  [
    [1, 1, 1, 0],
    [1, 1, 1, 0],
    [0, 1, 1, 1],
    [0, 0, 0, 0]
  ],
];

/**
 * 创建 ArUco 标记的 Canvas
 * @param {number} id - 标记ID (0-11)
 * @param {number} size - 标记尺寸 (像素)
 * @param {number} borderSize - 白色边框宽度 (像素)
 * @returns {HTMLCanvasElement}
 */
export function createArucoMarker(id, size = 128, borderSize = 16) {
  const canvas = document.createElement('canvas');
  const totalSize = size + borderSize * 2;
  canvas.width = totalSize;
  canvas.height = totalSize;
  
  const ctx = canvas.getContext('2d');
  
  // 白色背景 (静默区)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalSize, totalSize);
  
  // 黑色外边框 (1个单元格宽)
  const cellSize = size / 6; // 6 = 4 (数据) + 2 (边框)
  ctx.fillStyle = '#000000';
  ctx.fillRect(borderSize, borderSize, size, size);
  
  // 白色内部 (不包括边框)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    borderSize + cellSize,
    borderSize + cellSize,
    size - cellSize * 2,
    size - cellSize * 2
  );
  
  // 绘制数据单元格
  const pattern = ARUCO_DICT_4X4_50[id % ARUCO_DICT_4X4_50.length];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (pattern[row][col] === 1) {
        ctx.fillStyle = '#000000';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      ctx.fillRect(
        borderSize + cellSize * (col + 1),
        borderSize + cellSize * (row + 1),
        cellSize,
        cellSize
      );
    }
  }
  
  return canvas;
}

/**
 * 获取 ArUco 标记的 Data URL
 * @param {number} id - 标记ID
 * @param {number} size - 标记尺寸
 * @returns {string}
 */
export function getArucoMarkerDataURL(id, size = 128) {
  const canvas = createArucoMarker(id, size);
  return canvas.toDataURL('image/png');
}

/**
 * ArUco 标记配置
 * 定义地毯上各个 ArUco 标记的位置
 */
export const ARUCO_POSITIONS = [
  // 左侧标记
  { id: 8, position: 0, side: 'left', label: '0m' },
  { id: 9, position: 1.0, side: 'left', label: '1m' },
  { id: 10, position: 1.8, side: 'left', label: '1.8m' },
  { id: 11, position: 2.4, side: 'left', label: '2.4m' },
  // 右侧标记
  { id: 0, position: 0, side: 'right', label: '0m' },
  { id: 1, position: 1.0, side: 'right', label: '1m' },
  { id: 2, position: 1.8, side: 'right', label: '1.8m' },
  { id: 3, position: 2.4, side: 'right', label: '2.4m' },
];

export default {
  createArucoMarker,
  getArucoMarkerDataURL,
  ARUCO_POSITIONS,
  ARUCO_DICT_4X4_50
};
