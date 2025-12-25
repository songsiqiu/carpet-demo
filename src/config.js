/**
 * 立定跳远测量地毯配置
 * 所有尺寸单位为米 (m)
 */

export const MAT_CONFIG = {
  // 总体尺寸
  totalLength: 3.0,        // 总长度 3米
  totalWidth: 0.9,         // 总宽度 90cm
  
  // 区域划分
  zones: {
    takeoff: {
      start: -0.3,         // 起跳区开始 (-30cm，包含站立区)
      end: 0,              // 起跳区结束 (起跳线)
      color: '#1a1a1a',    // 深灰色
      name: '起跳区'
    },
    flight: {
      start: 0,            // 飞行区开始
      end: 1.4,            // 飞行区结束
      color: '#121218',    // 更深的灰色
      name: '飞行区 (稀疏刻度)'
    },
    landing: {
      start: 1.4,          // 核心落地区开始
      end: 2.8,            // 核心落地区结束
      color: '#0f0f15',    // 最深的颜色
      name: '核心落地区 (精密刻度)'
    },
    extended: {
      start: 2.8,          // 扩展区开始
      end: 3.0,            // 扩展区结束
      color: '#121218',
      name: '扩展区'
    }
  },
  
  // 刻度线配置
  scales: {
    // 精细刻度 (1cm) - 只在核心落地区两侧
    fine: {
      spacing: 0.01,       // 1cm
      lineWidth: 0.0015,   // 1.5mm
      lineLength: 0.03,    // 3cm (两侧边缘)
      color: '#e6ff00',    // 荧光黄
      startPosition: 1.4,  // 从 1.4m 开始
      endPosition: 2.8     // 到 2.8m 结束
    },
    // 中等刻度 (10cm)
    medium: {
      spacing: 0.1,        // 10cm
      lineWidth: 0.003,    // 3mm
      color: '#ffffff',    // 纯白色
      zones: {
        flight: {
          lineLength: 0.06,    // 6cm
          showLabel: true
        },
        landing: {
          lineLength: 0.10,    // 10cm (中央横跨)
          showLabel: true
        }
      }
    },
    // 粗刻度 (整米)
    major: {
      spacing: 1.0,        // 1m
      lineWidth: 0.005,    // 5mm
      lineLength: 0.15,    // 15cm
      color: '#ffffff',
      showLabel: true
    },
    // 起跳线
    startLine: {
      position: 0,
      lineWidth: 0.006,    // 6mm
      color: '#ff4444',    // 红色
      label: '起跳线'
    }
  },
  
  // ArUco 标记配置
  aruco: {
    size: 0.08,            // 8cm x 8cm
    borderSize: 0.015,     // 1.5cm 白色边框
    totalSize: 0.11,       // 总占用 11cm
    margin: 0.02,          // 距离边缘 2cm
    positions: [0, 1.0, 1.8, 2.4]  // 标记位置
  },
  
  // 边缘刻度尺区域
  rulerZone: {
    width: 0.03,           // 3cm 宽
    backgroundColor: '#1a1a24'
  },
  
  // 视觉效果
  visual: {
    backgroundColor: '#0a0a0f',
    matBaseColor: '#1a1a1a',
    gridOpacity: 0.3,
    glowIntensity: 0.5
  }
};

/**
 * 颜色配置 - 高对比度色系
 */
export const COLORS = {
  // 主色调
  background: '#0a0a0f',
  matBase: '#1a1a1a',
  matDark: '#121218',
  
  // 刻度线颜色
  scaleYellow: '#e6ff00',    // Pantone 123C 近似
  scaleWhite: '#ffffff',
  
  // 功能色
  startLine: '#ff4444',
  arucoWhite: '#ffffff',
  arucoBlack: '#000000',
  
  // 区域标识
  takeoffZone: '#2a1a1a',
  landingZone: '#1a1a10',
  
  // 辅助色
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textAccent: '#e6ff00',
  
  // 发光效果
  glowYellow: 'rgba(230, 255, 0, 0.3)',
  glowRed: 'rgba(255, 68, 68, 0.3)'
};

/**
 * 三维渲染配置
 */
export const RENDER_CONFIG = {
  // 相机设置
  camera: {
    fov: 45,
    near: 0.1,
    far: 100,
    position: { x: 1.5, y: 2.5, z: 2 },
    lookAt: { x: 1.5, y: 0, z: 0 }
  },
  
  // 光照设置
  lighting: {
    ambient: {
      color: '#ffffff',
      intensity: 0.4
    },
    directional: {
      color: '#ffffff',
      intensity: 0.8,
      position: { x: 5, y: 10, z: 5 }
    },
    point: {
      color: '#e6ff00',
      intensity: 0.3,
      position: { x: 1.5, y: 3, z: 0 }
    }
  },
  
  // 材质设置
  materials: {
    mat: {
      roughness: 0.9,      // 哑光表面
      metalness: 0.0,
      bumpScale: 0.002
    }
  },
  
  // 网格变换 (米转换为 Three.js 单位)
  scale: 1.0              // 1:1 比例
};

export default {
  MAT_CONFIG,
  COLORS,
  RENDER_CONFIG
};
