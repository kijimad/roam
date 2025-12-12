import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

export function createNavigationButtons(scene, controls) {
    // Add navigation buttons as 3D objects
    const buttonStyle = `
        padding: 16px 24px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-radius: 12px;
        cursor: pointer;
        font-size: 20px;
        font-weight: 600;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← 前';
    prevBtn.style.cssText = buttonStyle;
    prevBtn.addEventListener('mouseenter', () => {
        prevBtn.style.background = 'rgba(0, 0, 0, 0.95)';
    });
    prevBtn.addEventListener('mouseleave', () => {
        prevBtn.style.background = 'rgba(0, 0, 0, 0.8)';
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '次 →';
    nextBtn.style.cssText = buttonStyle;
    nextBtn.addEventListener('mouseenter', () => {
        nextBtn.style.background = 'rgba(0, 0, 0, 0.95)';
    });
    nextBtn.addEventListener('mouseleave', () => {
        nextBtn.style.background = 'rgba(0, 0, 0, 0.8)';
    });

    const prevBtnObj = new CSS3DObject(prevBtn);
    prevBtnObj.position.set(-600, 0, 0);
    prevBtnObj.rotation.x = -0.5;
    scene.add(prevBtnObj);

    const nextBtnObj = new CSS3DObject(nextBtn);
    nextBtnObj.position.set(600, 0, 0);
    nextBtnObj.rotation.x = -0.5;
    scene.add(nextBtnObj);

    // Random button
    const randomBtn = document.createElement('button');
    randomBtn.textContent = '🎲';
    randomBtn.style.cssText = buttonStyle;
    randomBtn.addEventListener('mouseenter', () => {
        randomBtn.style.background = 'rgba(0, 0, 0, 0.95)';
    });
    randomBtn.addEventListener('mouseleave', () => {
        randomBtn.style.background = 'rgba(0, 0, 0, 0.8)';
    });
    randomBtn.addEventListener('click', () => {
        fetch('/api/random')
            .then(r => r.json())
            .then(data => {
                if (data.random) {
                    location.href = data.random;
                }
            });
    });

    const randomBtnObj = new CSS3DObject(randomBtn);
    const tiltAngle = 0.5;
    const offset = 470; // コンテンツ上端に配置（ボタンの高さを考慮）
    randomBtnObj.position.set(
        600,
        offset * Math.cos(tiltAngle),
        -offset * Math.sin(tiltAngle)
    );
    randomBtnObj.rotation.x = -0.5;
    scene.add(randomBtnObj);

    // ボタンの上ではOrbitControlsを無効化
    [prevBtn, nextBtn, randomBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            controls.enabled = false;
        });
        btn.addEventListener('mouseleave', () => {
            controls.enabled = true;
        });
    });

    // Fetch and setup navigation
    const currentPath = location.pathname.slice(1);

    fetch(`/api/prev?current=${encodeURIComponent(currentPath)}`)
        .then(r => r.json())
        .then(data => {
            if (data.prev) {
                prevBtn.addEventListener('click', () => location.href = data.prev);
            } else {
                prevBtn.disabled = true;
                prevBtn.style.opacity = '0.3';
                prevBtn.style.cursor = 'not-allowed';
            }
        });

    fetch(`/api/next?current=${encodeURIComponent(currentPath)}`)
        .then(r => r.json())
        .then(data => {
            if (data.next) {
                nextBtn.addEventListener('click', () => location.href = data.next);
            } else {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.3';
                nextBtn.style.cursor = 'not-allowed';
            }
        });
}
