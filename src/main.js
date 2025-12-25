import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { MatGenerator } from './matGenerator.js';
import { MAT_CONFIG, COLORS, RENDER_CONFIG } from './config.js';

/**
 * 立定跳远测量地毯 - Three.js 可视化应用
 * 专为计算机视觉设计的精密测量地毯
 */

class JumpMatViewer {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.matMesh = null;
    this.matGenerator = null;
    this.animationId = null;
    
    // 配置状态
    this.state = {
      showAruco: true,
      showFineScale: true,
      showGrid: false,  // 默认关闭辅助网格
      pixelsPerMeter: 1000,
      cameraAngle: 45
    };
    
    // 演示模式
    this.demoMode = {
      active: false,
      person: null,
      tripod: null,
      phoneCamera: null,
      animationPhase: 0,      // 0: 准备, 1: 起跳, 2: 飞行, 3: 落地
      animationProgress: 0,
      jumpDistance: 2.1       // 模拟跳跃距离 2.1m
    };
    
    this.init();
  }

  /**
   * 初始化应用
   */
  init() {
    this.createDOM();
    this.initThree();
    this.createScene();
    this.createMat();
    this.createLights();
    this.createHelpers();
    this.bindEvents();
    this.hideLoading();
    this.animate();
  }

  /**
   * 创建 DOM 结构
   */
  createDOM() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- 加载状态 -->
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在生成地毯...</div>
      </div>
      
      <!-- 顶部导航 -->
      <header class="header">
        <div class="header-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <div>
            <div class="header-title">立定跳远测量地毯 <span>CV</span></div>
            <div class="header-subtitle">Computer Vision Optimized</div>
          </div>
        </div>
      </header>
      
      <!-- Canvas 容器 -->
      <div id="canvas-container">
        <canvas id="three-canvas"></canvas>
      </div>
      
      <!-- 图例面板 -->
      <div class="legend-panel">
        <div class="legend-title">区域图例</div>
        <div class="legend-item">
          <div class="legend-color takeoff"></div>
          <span>起跳区 (0m)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color flight"></div>
          <span>飞行区 (0-1.4m 稀疏刻度)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color landing"></div>
          <span>核心落地区 (1.4-2.8m 精密刻度)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color aruco"></div>
          <span>ArUco 锚点标记</span>
        </div>
      </div>
      
      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="panel-section">
          <div class="panel-title">视图控制</div>
          
          <div class="slider-group">
            <div class="slider-label">
              <span class="slider-label-text">相机角度</span>
              <span class="slider-value" id="camera-angle-value">45°</span>
            </div>
            <input type="range" id="camera-angle" min="10" max="90" value="45">
          </div>
          
          <div class="slider-group">
            <div class="slider-label">
              <span class="slider-label-text">缩放级别</span>
              <span class="slider-value" id="zoom-value">100%</span>
            </div>
            <input type="range" id="zoom-level" min="50" max="200" value="100">
          </div>
        </div>
        
        <div class="panel-section">
          <div class="panel-title">显示选项</div>
          
          <div class="toggle-group">
            <span class="toggle-label">ArUco 标记</span>
            <div class="toggle active" id="toggle-aruco"></div>
          </div>
          
          <div class="toggle-group">
            <span class="toggle-label">精细刻度 (1cm)</span>
            <div class="toggle active" id="toggle-fine-scale"></div>
          </div>
          
          <div class="toggle-group">
            <span class="toggle-label">辅助网格</span>
            <div class="toggle" id="toggle-grid"></div>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="panel-title">导出</div>
          <div class="btn-group">
            <button class="btn btn-primary" id="btn-download-png">下载 PNG</button>
            <button class="btn btn-secondary" id="btn-download-svg">导出规格</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="panel-title">预设视角</div>
          <div class="btn-group">
            <button class="btn btn-secondary" id="btn-view-top">俯视</button>
            <button class="btn btn-secondary" id="btn-view-side">侧视</button>
            <button class="btn btn-secondary" id="btn-view-3d">3D</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="panel-title">🎬 模拟演示</div>
          <div class="btn-group">
            <button class="btn btn-primary" id="btn-demo">开始演示</button>
            <button class="btn btn-secondary" id="btn-reset-demo">重置</button>
          </div>
        </div>
      </div>
      
      <!-- 信息面板 -->
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">总长度</div>
          <div class="info-value">3.3<span class="info-unit">m</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">宽度</div>
          <div class="info-value">0.9<span class="info-unit">m</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">落地区精度</div>
          <div class="info-value">1<span class="info-unit">cm</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">ArUco 标记</div>
          <div class="info-value">8<span class="info-unit">个</span></div>
        </div>
      </div>
      
      <!-- 提示框 -->
      <div class="tooltip" id="tooltip"></div>
    `;
    
    this.container = document.getElementById('canvas-container');
  }

  /**
   * 初始化 Three.js
   */
  initThree() {
    const canvas = document.getElementById('three-canvas');
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(COLORS.background);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(COLORS.background, 8, 20);
    
    // 相机
    const config = RENDER_CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(
      config.fov,
      width / height,
      config.near,
      config.far
    );
    this.camera.position.set(config.position.x, config.position.y, config.position.z);
    this.camera.lookAt(config.lookAt.x, config.lookAt.y, config.lookAt.z);
    
    // 轨道控制器
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(1.5, 0, 0);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
  }

  /**
   * 创建场景元素
   */
  createScene() {
    // 地面
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.95,
      metalness: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.001;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  /**
   * 创建地毯
   */
  createMat() {
    this.matGenerator = new MatGenerator({
      pixelsPerMeter: this.state.pixelsPerMeter
    });
    
    this.matMesh = this.matGenerator.createMesh();
    this.scene.add(this.matMesh);
  }

  /**
   * 创建灯光
   */
  createLights() {
    const config = RENDER_CONFIG.lighting;
    
    // 环境光
    const ambient = new THREE.AmbientLight(
      config.ambient.color,
      config.ambient.intensity
    );
    this.scene.add(ambient);
    
    // 主方向光
    const directional = new THREE.DirectionalLight(
      config.directional.color,
      config.directional.intensity
    );
    directional.position.set(
      config.directional.position.x,
      config.directional.position.y,
      config.directional.position.z
    );
    directional.castShadow = true;
    this.scene.add(directional);
    
    // 点光源 (荧光黄强调)
    const point = new THREE.PointLight(
      config.point.color,
      config.point.intensity,
      10
    );
    point.position.set(
      config.point.position.x,
      config.point.position.y,
      config.point.position.z
    );
    this.scene.add(point);
    
    // 边缘光
    const rimLight = new THREE.DirectionalLight('#e6ff00', 0.1);
    rimLight.position.set(-5, 3, -3);
    this.scene.add(rimLight);
  }

  /**
   * 创建辅助元素
   */
  createHelpers() {
    // 网格辅助
    const gridHelper = new THREE.GridHelper(10, 50, 0x333333, 0x222222);
    gridHelper.position.y = 0.001;
    gridHelper.name = 'gridHelper';
    gridHelper.visible = false;  // 默认隐藏
    this.scene.add(gridHelper);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 窗口大小变化
    window.addEventListener('resize', () => this.onResize());
    
    // 相机角度滑块
    const cameraAngleSlider = document.getElementById('camera-angle');
    cameraAngleSlider.addEventListener('input', (e) => {
      const angle = parseInt(e.target.value);
      document.getElementById('camera-angle-value').textContent = angle + '°';
      this.setCameraAngle(angle);
    });
    
    // 缩放滑块
    const zoomSlider = document.getElementById('zoom-level');
    zoomSlider.addEventListener('input', (e) => {
      const zoom = parseInt(e.target.value);
      document.getElementById('zoom-value').textContent = zoom + '%';
      this.setZoom(zoom / 100);
    });
    
    // 开关按钮
    document.getElementById('toggle-aruco').addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      this.state.showAruco = e.target.classList.contains('active');
      this.regenerateMat();
    });
    
    document.getElementById('toggle-fine-scale').addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      this.state.showFineScale = e.target.classList.contains('active');
      this.regenerateMat();
    });
    
    document.getElementById('toggle-grid').addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      const grid = this.scene.getObjectByName('gridHelper');
      if (grid) grid.visible = e.target.classList.contains('active');
    });
    
    // 下载按钮
    document.getElementById('btn-download-png').addEventListener('click', () => {
      this.matGenerator.downloadImage('jump-mat-cv-optimized.png');
    });
    
    document.getElementById('btn-download-svg').addEventListener('click', () => {
      this.downloadSpecs();
    });
    
    // 预设视角
    document.getElementById('btn-view-top').addEventListener('click', () => {
      this.setView('top');
    });
    
    document.getElementById('btn-view-side').addEventListener('click', () => {
      this.setView('side');
    });
    
    document.getElementById('btn-view-3d').addEventListener('click', () => {
      this.setView('3d');
    });
    
    // 演示按钮
    document.getElementById('btn-demo').addEventListener('click', () => {
      this.startDemo();
    });
    
    document.getElementById('btn-reset-demo').addEventListener('click', () => {
      this.resetDemo();
    });
  }

  /**
   * 窗口大小变化处理
   */
  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 设置相机角度
   */
  setCameraAngle(degrees) {
    const radians = THREE.MathUtils.degToRad(degrees);
    const distance = this.camera.position.distanceTo(this.controls.target);
    
    this.camera.position.y = Math.sin(radians) * distance;
    this.camera.position.z = Math.cos(radians) * distance * 0.8;
  }

  /**
   * 设置缩放
   */
  setZoom(factor) {
    const target = this.controls.target;
    const direction = new THREE.Vector3().subVectors(this.camera.position, target).normalize();
    const distance = 3 / factor;
    
    this.camera.position.copy(target).add(direction.multiplyScalar(distance));
  }

  /**
   * 设置预设视角
   */
  setView(view) {
    const target = new THREE.Vector3(1.5, 0, 0);
    let position;
    
    switch (view) {
      case 'top':
        position = new THREE.Vector3(1.5, 4, 0.01);
        break;
      case 'side':
        position = new THREE.Vector3(1.5, 0.5, 3);
        break;
      case '3d':
      default:
        position = new THREE.Vector3(1.5, 2.5, 2);
    }
    
    // 平滑过渡
    this.animateCamera(position, target);
  }

  /**
   * 相机动画
   */
  animateCamera(targetPosition, lookAtTarget) {
    const startPosition = this.camera.position.clone();
    const startTime = performance.now();
    const duration = 800;
    
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.controls.target.copy(lookAtTarget);
      this.controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * 重新生成地毯
   */
  regenerateMat() {
    if (this.matMesh) {
      this.scene.remove(this.matMesh);
      this.matMesh.geometry.dispose();
      this.matMesh.material.dispose();
    }
    
    this.matGenerator = new MatGenerator({
      pixelsPerMeter: this.state.pixelsPerMeter
    });
    
    this.matMesh = this.matGenerator.createMesh();
    this.scene.add(this.matMesh);
  }

  /**
   * 下载技术规格
   */
  downloadSpecs() {
    const specs = `
立定跳远测量地毯 - 技术规格书
=====================================

一、整体尺寸
- 总长度: 3.3米 (含30cm起跳区)
- 总宽度: 0.9米 (90cm)
- 建议厚度: 8-10mm

二、区域划分
1. 起跳区: -0.3m ~ 0m
   - 极简设计，防止干扰
   - 起跳线位置: 0m

2. 飞行区: 0m ~ 1.4m
   - 刻度稀疏 (10cm间隔)
   - 无1cm精细刻度

3. 核心落地区: 1.4m ~ 2.8m
   - 全精度刻度覆盖
   - 1cm精细刻度 (两侧3cm宽边缘)
   - 10cm中等刻度 (中央区域)

4. 扩展区: 2.8m ~ 3.0m
   - 稀疏刻度

三、ArUco标记规格
- 类型: ArUco 4x4_50 字典
- 核心区尺寸: 8cm x 8cm
- 白色边框: 1.5cm
- 总占用面积: 约11cm x 11cm
- 位置: 0m, 1.0m, 1.8m, 2.4m 两侧
- 数量: 8个

四、刻度线规格
1. 1cm精细刻度:
   - 线宽: 1.5mm
   - 长度: 3cm
   - 颜色: Pantone 123C (荧光黄) 或纯白

2. 10cm中等刻度:
   - 线宽: 3mm
   - 长度: 6-10cm
   - 颜色: 纯白 #FFFFFF

3. 整米刻度:
   - 线宽: 5mm
   - 长度: 15cm
   - 颜色: 纯白 #FFFFFF

4. 起跳线:
   - 线宽: 6mm
   - 颜色: 红色 #FF4444

五、颜色规格
- 底色: 深空灰 #1A1A1A (哑光)
- 刻度线: 荧光黄 #E6FF00 或纯白 #FFFFFF
- 起跳线: 红色 #FF4444
- ArUco: 纯黑 #000000 + 纯白 #FFFFFF

六、材质要求
- 推荐: 天然橡胶底 + PU表层 或 加厚TPE
- 表面: 必须哑光 (Matte Finish)
- 禁止: 反光/光面处理

七、印刷精度要求
- ArUco标记精度: ±0.5mm
- 刻度线位置精度: ±1mm
- 颜色色差: ΔE < 3

=====================================
生成时间: ${new Date().toLocaleString('zh-CN')}
    `.trim();
    
    const blob = new Blob([specs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jump-mat-specs.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    setTimeout(() => {
      const loading = document.querySelector('.loading-overlay');
      if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 500);
      }
    }, 500);
  }

  /**
   * 创建简易人物模型
   */
  createPerson() {
    const group = new THREE.Group();
    
    // 身体颜色
    const skinColor = 0xffdbac;
    const clothColor = 0x2563eb;
    const shoeColor = 0xffffff;
    
    // 头部
    const headGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    group.add(head);
    
    // 身体
    const bodyGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: clothColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    group.add(body);
    
    // 左臂
    const armGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.18, 1.3, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.name = 'leftArm';
    group.add(leftArm);
    
    // 右臂
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.18, 1.3, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.name = 'rightArm';
    group.add(rightArm);
    
    // 左腿
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: clothColor });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.08, 0.75, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);
    
    // 右腿
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.08, 0.75, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);
    
    // 左脚（运动鞋）
    const shoeGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.15);
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: shoeColor });
    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    leftShoe.position.set(-0.08, 0.48, 0.02);
    leftShoe.name = 'leftShoe';
    group.add(leftShoe);
    
    // 右脚
    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    rightShoe.position.set(0.08, 0.48, 0.02);
    rightShoe.name = 'rightShoe';
    group.add(rightShoe);
    
    group.name = 'person';
    return group;
  }

  /**
   * 创建摄像机三脚架模型
   */
  createTripodWithPhone() {
    const group = new THREE.Group();
    
    const metalColor = 0x333333;
    const phoneColor = 0x1a1a1a;
    
    // 三脚架腿
    const legGeometry = new THREE.CylinderGeometry(0.015, 0.02, 1.2, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.8, roughness: 0.3 });
    
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      const angle = (i * 2 * Math.PI) / 3;
      leg.position.set(Math.sin(angle) * 0.3, 0.6, Math.cos(angle) * 0.3);
      leg.rotation.x = Math.PI / 12;
      leg.rotation.z = -Math.sin(angle) * Math.PI / 12;
      group.add(leg);
    }
    
    // 中心连接柱
    const centerGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.8, 8);
    const center = new THREE.Mesh(centerGeometry, legMaterial);
    center.position.y = 1.3;
    group.add(center);
    
    // 手机夹持器
    const holderGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.08);
    const holder = new THREE.Mesh(holderGeometry, legMaterial);
    holder.position.y = 1.75;
    group.add(holder);
    
    // 手机
    const phoneGeometry = new THREE.BoxGeometry(0.075, 0.15, 0.01);
    const phoneMaterial = new THREE.MeshStandardMaterial({ color: phoneColor });
    const phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
    phone.position.y = 1.75;
    phone.rotation.x = -Math.PI / 6; // 略微向下倾斜
    group.add(phone);
    
    // 手机屏幕（亮起）
    const screenGeometry = new THREE.PlaneGeometry(0.065, 0.12);
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x4ade80 }); // 绿色屏幕
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1.75, 0.006);
    screen.rotation.x = -Math.PI / 6;
    group.add(screen);
    
    // 摄像头指示灯（红色闪烁）
    const indicatorGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(0.03, 1.82, 0.005);
    indicator.name = 'recordingIndicator';
    group.add(indicator);
    
    group.name = 'tripod';
    return group;
  }

  /**
   * 开始演示
   */
  startDemo() {
    if (this.demoMode.active) return;
    
    // 创建人物 (缩小到 0.5 倍)
    if (!this.demoMode.person) {
      this.demoMode.person = this.createPerson();
      this.demoMode.person.scale.set(0.5, 0.5, 0.5);  // 缩小人物
      this.demoMode.person.position.set(-0.15, 0, 0); // 起跳区
      this.scene.add(this.demoMode.person);
    }
    
    // 创建三脚架 (也缩小)
    if (!this.demoMode.tripod) {
      this.demoMode.tripod = this.createTripodWithPhone();
      this.demoMode.tripod.scale.set(0.6, 0.6, 0.6);  // 缩小三脚架
      this.demoMode.tripod.position.set(1.5, 0, -0.8); // 侧面位置，更靠近地毯
      this.demoMode.tripod.rotation.y = Math.PI / 4; // 朝向地毯
      this.scene.add(this.demoMode.tripod);
    }
    
    // 切换到演示视角 (远距离俯视斜角)
    this.setDemoView();
    
    // 开始动画
    this.demoMode.active = true;
    this.demoMode.animationPhase = 0;
    this.demoMode.animationProgress = 0;
    
    // 更新按钮状态
    document.getElementById('btn-demo').textContent = '演示中...';
    document.getElementById('btn-demo').disabled = true;
  }
  
  /**
   * 设置演示专用视角
   */
  setDemoView() {
    // 远距离俯视斜角，能看到整个地毯和人物
    const target = new THREE.Vector3(1.2, 0, 0);
    const position = new THREE.Vector3(1.5, 3.5, 3.5);  // 更远，更高
    this.animateCamera(position, target);
  }

  /**
   * 重置演示
   */
  resetDemo() {
    this.demoMode.active = false;
    this.demoMode.animationPhase = 0;
    this.demoMode.animationProgress = 0;
    
    // 移除人物
    if (this.demoMode.person) {
      this.scene.remove(this.demoMode.person);
      this.demoMode.person = null;
    }
    
    // 移除三脚架
    if (this.demoMode.tripod) {
      this.scene.remove(this.demoMode.tripod);
      this.demoMode.tripod = null;
    }
    
    // 恢复按钮状态
    document.getElementById('btn-demo').textContent = '开始演示';
    document.getElementById('btn-demo').disabled = false;
  }

  /**
   * 更新演示动画
   */
  updateDemoAnimation() {
    if (!this.demoMode.active || !this.demoMode.person) return;
    
    const person = this.demoMode.person;
    const speed = 0.015;
    this.demoMode.animationProgress += speed;
    
    const progress = this.demoMode.animationProgress;
    const jumpDist = this.demoMode.jumpDistance;
    
    switch (this.demoMode.animationPhase) {
      case 0: // 准备阶段 - 下蹲
        if (progress < 1) {
          // 下蹲动作 (参数适配缩小后的人物)
          person.position.y = -0.05 * Math.sin(progress * Math.PI);
          person.rotation.x = 0.2 * Math.sin(progress * Math.PI);
          
          // 手臂向后摆
          const leftArm = person.getObjectByName('leftArm');
          const rightArm = person.getObjectByName('rightArm');
          if (leftArm) leftArm.rotation.x = -0.5 * Math.sin(progress * Math.PI);
          if (rightArm) rightArm.rotation.x = -0.5 * Math.sin(progress * Math.PI);
        } else {
          this.demoMode.animationPhase = 1;
          this.demoMode.animationProgress = 0;
        }
        break;
        
      case 1: // 起跳阶段
        if (progress < 0.3) {
          const t = progress / 0.3;
          person.position.y = 0.15 * t;  // 降低起跳高度
          person.position.x = -0.15 + jumpDist * 0.1 * t;
          person.rotation.x = -0.3 * t;
          
          // 手臂向上摆
          const leftArm = person.getObjectByName('leftArm');
          const rightArm = person.getObjectByName('rightArm');
          if (leftArm) leftArm.rotation.x = -Math.PI / 3 * t;
          if (rightArm) rightArm.rotation.x = -Math.PI / 3 * t;
        } else {
          this.demoMode.animationPhase = 2;
          this.demoMode.animationProgress = 0;
        }
        break;
        
      case 2: // 飞行阶段 - 抛物线
        if (progress < 1) {
          const startX = -0.15 + jumpDist * 0.1;
          const endX = -0.15 + jumpDist;
          
          // 抛物线轨迹 (降低飞行高度)
          person.position.x = startX + (endX - startX) * progress;
          person.position.y = 0.15 + 0.25 * Math.sin(progress * Math.PI); // 最高点约 0.4m
          
          // 身体前倾
          person.rotation.x = -0.3 + 0.4 * progress;
          
          // 腿部动作
          const leftLeg = person.getObjectByName('leftLeg');
          const rightLeg = person.getObjectByName('rightLeg');
          if (leftLeg) leftLeg.rotation.x = 0.5 * Math.sin(progress * Math.PI * 2);
          if (rightLeg) rightLeg.rotation.x = -0.5 * Math.sin(progress * Math.PI * 2);
        } else {
          this.demoMode.animationPhase = 3;
          this.demoMode.animationProgress = 0;
        }
        break;
        
      case 3: // 落地阶段
        if (progress < 0.5) {
          const t = progress / 0.5;
          person.position.y = 0 + 0.05 * (1 - t); // 下蹲缓冲
          person.rotation.x = 0.1 * (1 - t);
          
          // 手臂前伸保持平衡
          const leftArm = person.getObjectByName('leftArm');
          const rightArm = person.getObjectByName('rightArm');
          if (leftArm) leftArm.rotation.x = 0.3 * (1 - t);
          if (rightArm) rightArm.rotation.x = 0.3 * (1 - t);
        } else {
          // 演示完成，回到初始状态
          setTimeout(() => {
            this.demoMode.animationPhase = 0;
            this.demoMode.animationProgress = 0;
            if (this.demoMode.person) {
              this.demoMode.person.position.set(-0.15, 0, 0);
              this.demoMode.person.rotation.x = 0;
            }
          }, 1500);
          this.demoMode.active = false;
          document.getElementById('btn-demo').textContent = '再次演示';
          document.getElementById('btn-demo').disabled = false;
        }
        break;
    }
    
    // 摄像头指示灯闪烁
    if (this.demoMode.tripod) {
      const indicator = this.demoMode.tripod.getObjectByName('recordingIndicator');
      if (indicator) {
        indicator.visible = Math.floor(Date.now() / 500) % 2 === 0;
      }
    }
  }

  /**
   * 动画循环
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // 更新演示动画
    this.updateDemoAnimation();
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.renderer.dispose();
    this.controls.dispose();
  }
}

// 启动应用
new JumpMatViewer();
