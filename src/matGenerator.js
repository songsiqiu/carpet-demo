import * as THREE from 'three';
import { MAT_CONFIG, COLORS } from './config.js';
import { createArucoMarker } from './aruco.js';

/**
 * 地毯几何体生成器 - 产品化版本
 * 参考设计：简洁、专业、CV优化
 */

export class MatGenerator {
  constructor(options = {}) {
    this.config = { ...MAT_CONFIG, ...options };
    this.pixelsPerMeter = options.pixelsPerMeter || 1200; // 提高分辨率
    this.canvas = null;
    this.ctx = null;
    this.texture = null;
    
    // 颜色配置
    this.colors = {
      background: '#1a1a1a',      // 深黑色背景
      border: '#c9a227',          // 金色边框
      scaleYellow: '#c9a227',     // 金黄色刻度
      scaleFine: '#c9a227',       // 精密刻度
      textGold: '#c9a227',        // 金色文字
      textWhite: '#ffffff',       // 白色文字
      arucoWhite: '#ffffff',
      arucoBlack: '#000000'
    };
  }

  /**
   * 初始化 Canvas
   */
  initCanvas() {
    const width = (this.config.totalLength + 0.3) * this.pixelsPerMeter;
    const height = this.config.totalWidth * this.pixelsPerMeter;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * 米转换为像素
   */
  meterToPixel(meter) {
    return meter * this.pixelsPerMeter;
  }

  /**
   * 获取 X 坐标 (位置转像素，考虑起跳区偏移)
   */
  getX(position) {
    return this.meterToPixel(position + 0.3);
  }

  /**
   * 绘制背景
   */
  drawBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 填充深黑色背景
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // 添加微妙的纹理效果（模拟哑光材质）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      ctx.fillRect(x, y, size, size);
    }
  }

  /**
   * 绘制边框
   */
  drawBorder() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const borderWidth = this.meterToPixel(0.008); // 8mm 边框
    
    ctx.strokeStyle = this.colors.border;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
    
    // 添加内边框装饰线
    const innerOffset = this.meterToPixel(0.015);
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(innerOffset, innerOffset, width - innerOffset * 2, height - innerOffset * 2);
  }

  /**
   * 绘制 ArUco 标记 - 按规范放置在 0m、1m、1.8m、2.4m 两侧边缘
   */
  drawArucoMarkers() {
    const ctx = this.ctx;
    const size = this.meterToPixel(0.08); // 8cm 核心区 (规范要求)
    const quietZone = this.meterToPixel(0.015); // 1.5cm 白色静默区 (规范要求)
    const totalSize = size + quietZone * 2;
    const margin = this.meterToPixel(0.02); // 距离边缘 2cm
    
    // ArUco 位置：0m、1.0m、1.8m、2.4m 两侧边缘
    const arucoPositions = [0, 1.0, 1.8, 2.4];
    
    arucoPositions.forEach((pos, index) => {
      const x = this.getX(pos);
      
      // 左侧 (上方) ArUco
      const leftId = index;
      const leftY = margin;
      
      // 白色静默区背景
      ctx.fillStyle = this.colors.arucoWhite;
      ctx.fillRect(x - totalSize / 2, leftY, totalSize, totalSize);
      
      // 绘制 ArUco 标记
      const leftMarker = createArucoMarker(leftId, size, 0);
      ctx.drawImage(leftMarker, x - size / 2, leftY + quietZone, size, size);
      
      // 右侧 (下方) ArUco
      const rightId = index + 4;
      const rightY = this.canvas.height - totalSize - margin;
      
      // 白色静默区背景
      ctx.fillStyle = this.colors.arucoWhite;
      ctx.fillRect(x - totalSize / 2, rightY, totalSize, totalSize);
      
      // 绘制 ArUco 标记
      const rightMarker = createArucoMarker(rightId, size, 0);
      ctx.drawImage(rightMarker, x - size / 2, rightY + quietZone, size, size);
    });
  }

  /**
   * 绘制起跳区刻度 (稀疏)
   */
  drawTakeoffZoneScales() {
    const ctx = this.ctx;
    const startX = this.getX(0);
    const endX = this.getX(1.4); // 0-1.4m 稀疏区 (飞行区)
    const centerY = this.canvas.height / 2;
    
    ctx.strokeStyle = this.colors.scaleYellow;
    ctx.fillStyle = this.colors.textGold;
    
    // 起跳线 (0m) - 占满整个宽度
    ctx.lineWidth = this.meterToPixel(0.004); // 4mm 线宽
    
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, this.canvas.height);
    ctx.stroke();
    
    // 稀疏刻度 (每 10cm) - 飞行区
    for (let pos = 0.1; pos <= 1.4; pos += 0.1) {
      const x = this.getX(pos);
      const height = (pos * 10) % 5 === 0 ? this.meterToPixel(0.25) : this.meterToPixel(0.15);
      
      ctx.lineWidth = this.meterToPixel(0.002);
      ctx.beginPath();
      ctx.moveTo(x, centerY - height / 2);
      ctx.lineTo(x, centerY + height / 2);
      ctx.stroke();
    }
  }

  /**
   * 绘制精密区刻度 (密集) - CV 核心区域
   */
  drawPrecisionZoneScales() {
    const ctx = this.ctx;
    const startPos = 1.4; // 精密区从 1.4m 开始 (核心落地区)
    const endPos = 2.8;   // 到 2.8m 结束 (规范要求)
    const centerY = this.canvas.height / 2;
    
    ctx.strokeStyle = this.colors.scaleFine;
    
    // 绘制每 1cm 的精密刻度
    for (let pos = startPos; pos <= endPos; pos += 0.01) {
      const x = this.getX(pos);
      const cmValue = Math.round(pos * 100);
      
      // 根据位置决定刻度高度
      let height;
      let lineWidth;
      
      if (cmValue % 100 === 0) {
        // 整米刻度 - 最长
        height = this.meterToPixel(0.45);
        lineWidth = this.meterToPixel(0.003);
      } else if (cmValue % 50 === 0) {
        // 50cm 刻度
        height = this.meterToPixel(0.35);
        lineWidth = this.meterToPixel(0.0025);
      } else if (cmValue % 10 === 0) {
        // 10cm 刻度
        height = this.meterToPixel(0.25);
        lineWidth = this.meterToPixel(0.002);
      } else {
        // 1cm 精密刻度
        height = this.meterToPixel(0.12);
        lineWidth = this.meterToPixel(0.0012);
      }
      
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x, centerY - height / 2);
      ctx.lineTo(x, centerY + height / 2);
      ctx.stroke();
    }
    
    // 扩展区稀疏刻度 (2.8m - 3.0m，每 10cm)
    for (let pos = 2.9; pos <= 3.0; pos += 0.1) {
      const x = this.getX(pos);
      const height = this.meterToPixel(0.2);
      
      ctx.lineWidth = this.meterToPixel(0.002);
      ctx.beginPath();
      ctx.moveTo(x, centerY - height / 2);
      ctx.lineTo(x, centerY + height / 2);
      ctx.stroke();
    }
  }

  /**
   * 绘制标签 - 只在关键位置标注
   */
  drawLabels() {
    const ctx = this.ctx;
    const height = this.canvas.height;
    
    ctx.fillStyle = this.colors.textGold;
    ctx.textAlign = 'center';
    
    // 起跳线标签
    ctx.save();
    ctx.translate(this.getX(0), height - this.meterToPixel(0.08));
    ctx.rotate(-Math.PI / 2);
    ctx.font = `bold ${this.meterToPixel(0.025)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('0mm (起跳线)', 0, 0);
    ctx.restore();
    
    // 精密区起点标签
    ctx.save();
    ctx.translate(this.getX(1.2), height - this.meterToPixel(0.08));
    ctx.rotate(-Math.PI / 2);
    ctx.font = `bold ${this.meterToPixel(0.022)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('1200mm (精密区起点)', 0, 0);
    ctx.restore();
    
    // 底部刻度标签 - 只标注关键位置
    ctx.font = `${this.meterToPixel(0.018)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    
    // 稀疏区标签
    const sparseLabels = [
      { pos: 0, label: '1cm/10cm' },
      { pos: 0.2, label: '200mm' },
      { pos: 0.4, label: '400mm' },
      { pos: 0.6, label: '600mm' },
      { pos: 0.8, label: '800mm' },
      { pos: 1.0, label: '1000mm' }
    ];
    
    sparseLabels.forEach(item => {
      ctx.save();
      ctx.translate(this.getX(item.pos), height - this.meterToPixel(0.035));
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    });
    
    // 精密区标签 - 每 10cm 标注一次
    const precisionLabels = [];
    for (let i = 1200; i <= 3000; i += 100) {
      precisionLabels.push({ pos: i / 1000, label: i + 'mm' });
    }
    
    precisionLabels.forEach(item => {
      ctx.save();
      ctx.translate(this.getX(item.pos), height - this.meterToPixel(0.035));
      ctx.rotate(-Math.PI / 4);
      ctx.font = `${this.meterToPixel(0.014)}px "JetBrains Mono", monospace`;
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    });
  }

  /**
   * 绘制简化版标签 - 只保留关键米数
   */
  drawSimplifiedLabels() {
    const ctx = this.ctx;
    const height = this.canvas.height;
    
    ctx.fillStyle = this.colors.textGold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 起跳线标签 (左侧，竖向) - 正向旋转90度
    ctx.save();
    ctx.translate(this.getX(-0.08), height / 2);
    ctx.rotate(Math.PI / 2);  // 正向旋转，文字从下往上读
    ctx.font = `bold ${this.meterToPixel(0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('0mm (起跳线)', 0, 0);
    ctx.restore();
    
    // 精密区起点标签
    ctx.save();
    ctx.translate(this.getX(1.35), height / 2);  // 1.4m 位置附近
    ctx.rotate(Math.PI / 2);  // 正向旋转
    ctx.font = `bold ${this.meterToPixel(0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('1.4m (精密区起点)', 0, 0);
    ctx.restore();
    
    // 底部关键刻度标签 - 只标 0.5m 间隔
    ctx.font = `${this.meterToPixel(0.016)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    
    const keyLabels = [
      { pos: 0, label: '0' },
      { pos: 0.5, label: '500mm' },
      { pos: 1.0, label: '1000mm' },
      { pos: 1.5, label: '1.5m' },
      { pos: 1.6, label: '1.6m' },
      { pos: 1.7, label: '1.7m' },
      { pos: 1.8, label: '1.8m' },
      { pos: 1.9, label: '1.9m' },
      { pos: 2.0, label: '2.0m' },
      { pos: 2.1, label: '2.1m' },
      { pos: 2.2, label: '2.2m' },
      { pos: 2.3, label: '2.3m' },
      { pos: 2.4, label: '2.4m' },
      { pos: 2.5, label: '2.5m' },
      { pos: 2.6, label: '2.6m' },
      { pos: 2.7, label: '2.7m' },
      { pos: 2.8, label: '2.8m' },
      { pos: 2.9, label: '2.9m' },
      { pos: 3.0, label: '3.0m' }
    ];
    
    keyLabels.forEach(item => {
      ctx.save();
      ctx.translate(this.getX(item.pos), height - this.meterToPixel(0.04));
      ctx.rotate(-Math.PI / 4);
      
      // 整米数用更大字体
      if (item.pos >= 1.5 && item.label.includes('m')) {
        ctx.font = `bold ${this.meterToPixel(0.018)}px "JetBrains Mono", monospace`;
      } else {
        ctx.font = `${this.meterToPixel(0.014)}px "JetBrains Mono", monospace`;
      }
      
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    });
  }

  /**
   * 生成完整地毯纹理
   */
  generate() {
    this.initCanvas();
    
    // 按层级绘制
    this.drawBackground();
    this.drawTakeoffZoneScales();
    this.drawPrecisionZoneScales();
    this.drawSimplifiedLabels();
    this.drawBorder();
    this.drawArucoMarkers();
    
    return this.canvas;
  }

  /**
   * 创建 Three.js 纹理
   */
  createTexture() {
    if (!this.canvas) {
      this.generate();
    }
    
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 16;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    
    return this.texture;
  }

  /**
   * 创建地毯 3D 网格
   */
  createMesh() {
    const texture = this.createTexture();
    
    // 几何体 (平面)
    const geometry = new THREE.PlaneGeometry(
      this.config.totalLength + 0.3,
      this.config.totalWidth
    );
    
    // 材质 (哑光PBR)
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    // 网格
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      (this.config.totalLength + 0.3) / 2 - 0.3,
      0,
      0
    );
    
    return mesh;
  }

  /**
   * 获取 Canvas 的 Data URL
   */
  getDataURL(format = 'image/png', quality = 1.0) {
    if (!this.canvas) {
      this.generate();
    }
    return this.canvas.toDataURL(format, quality);
  }

  /**
   * 下载地毯图片
   */
  downloadImage(filename = 'jump-mat.png') {
    const dataURL = this.getDataURL();
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  }
}

export default MatGenerator;
