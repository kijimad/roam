import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function initDrumScroll() {
    const content = document.getElementById('content');
    if (!content || window.innerWidth < 800) return;

    // Reset scroll position to top
    window.scrollTo(0, 0);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 0, 450);

    // Renderer setup
    const renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    document.body.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;

    // Create single page
    const el = document.createElement('div');
    el.style.width = '600px';
    el.style.backgroundColor = '#fafafa';
    el.style.padding = '40px';
    el.style.fontSize = '18px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)';
    el.innerHTML = content.innerHTML;

    // Get actual content height
    document.body.appendChild(el);
    const contentHeight = el.scrollHeight;
    document.body.removeChild(el);

    // Hide original content
    content.style.display = 'none';

    // Create spacer for scrolling (add window height to ensure full scroll)
    const spacer = document.createElement('div');
    spacer.style.height = (contentHeight + window.innerHeight) + 'px';
    spacer.style.width = '1px';
    spacer.style.pointerEvents = 'none';
    document.body.appendChild(spacer);

    const obj = new CSS3DObject(el);
    // ファイルの上端が画面中央（y=0）に来るように配置
    obj.position.set(0, 0, 0);
    // 初期角度をつける
    obj.rotation.x = -0.5;
    scene.add(obj);

    // リンクの上ではOrbitControlsを無効化
    el.addEventListener('mouseenter', (e) => {
        if (e.target.tagName === 'A') {
            controls.enabled = false;
        }
    }, true);

    el.addEventListener('mouseleave', (e) => {
        if (e.target.tagName === 'A') {
            controls.enabled = true;
        }
    }, true);

    // スクロールで縦移動
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.pageYOffset;
    }, { passive: true });

    // Animation loop
    const tiltAngle = 0.5; // ドキュメントの傾き角度

    function animate() {
        requestAnimationFrame(animate);

        // ドキュメント上のスクロール位置をワールド座標に変換
        const docY = scrollY * Math.cos(tiltAngle);
        const docZ = -scrollY * Math.sin(tiltAngle);

        // ドキュメントをスクロール位置に応じて移動
        obj.position.y = docY;
        obj.position.z = docZ;

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrumScroll);
} else {
    initDrumScroll();
}
