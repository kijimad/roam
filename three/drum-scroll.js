import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createNavigationButtons } from './navigation-buttons.js';

function initDrumScroll() {
    const content = document.getElementById('content');
    if (!content || window.innerWidth < 800) return;

    // Reset scroll position to top
    window.scrollTo(0, 0);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
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

    // Create single page with segments
    const pageWidth = 800;
    const segmentHeight = 1000; // 各セグメントの高さ

    // Get total content height
    const tempEl = document.createElement('div');
    tempEl.style.width = pageWidth + 'px';
    tempEl.style.padding = '20px';
    tempEl.innerHTML = content.innerHTML;
    document.body.appendChild(tempEl);
    const contentHeight = tempEl.scrollHeight;
    document.body.removeChild(tempEl);

    // Hide original content
    content.style.display = 'none';

    // Create spacer for scrolling
    const spacer = document.createElement('div');
    spacer.style.height = (contentHeight + window.innerHeight) + 'px';
    spacer.style.width = '1px';
    spacer.style.pointerEvents = 'none';
    document.body.appendChild(spacer);

    // Create segments
    const segments = [];
    const numSegments = Math.ceil(contentHeight / segmentHeight);

    for (let i = 0; i < numSegments; i++) {
        const el = document.createElement('div');
        el.style.width = pageWidth + 'px';
        el.style.height = segmentHeight + 'px';
        el.style.backgroundColor = '#fafafa';
        el.style.padding = '20px';
        el.style.fontSize = '18px';
        el.style.overflow = 'hidden';
        el.style.position = 'relative';
        el.style.boxSizing = 'border-box';

        // Clone content and position it to show the correct segment
        const contentClone = document.createElement('div');
        contentClone.innerHTML = content.innerHTML;
        contentClone.style.position = 'absolute';
        contentClone.style.top = (-i * segmentHeight) + 'px';
        contentClone.style.left = '20px';
        contentClone.style.right = '20px';
        el.appendChild(contentClone);

        const obj = new CSS3DObject(el);
        obj.rotation.x = -0.5;
        scene.add(obj);

        segments.push(obj);
    }

    // リンクの上ではOrbitControlsを無効化（各セグメントに適用）
    segments.forEach(seg => {
        seg.element.addEventListener('mouseenter', (e) => {
            if (e.target.tagName === 'A') {
                controls.enabled = false;
            }
        }, true);

        seg.element.addEventListener('mouseleave', (e) => {
            if (e.target.tagName === 'A') {
                controls.enabled = true;
            }
        }, true);
    });

    // スクロールで縦移動
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.pageYOffset;
    }, { passive: true });

    // Animation loop
    const tiltAngle = 0.5; // ドキュメントの傾き角度

    function animate() {
        requestAnimationFrame(animate);

        // 各セグメントをスクロール位置に応じて移動
        segments.forEach((seg, i) => {
            const segmentOffset = i * segmentHeight;
            const yPos = scrollY - segmentOffset;
            seg.position.y = yPos * Math.cos(tiltAngle);
            seg.position.z = -yPos * Math.sin(tiltAngle);
        });

        controls.update();
        renderer.render(scene, camera);
    }

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Add navigation buttons
    createNavigationButtons(scene, controls);

    // Start animation
    animate();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrumScroll);
} else {
    initDrumScroll();
}
