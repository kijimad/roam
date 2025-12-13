import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

export function createNavigationButtons(scene, controls, camera, renderer) {
    // ライトを追加（3Dボタンを照らす）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 500, 500);
    directionalLight.castShadow = true;  // 影を投射
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1500;
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    scene.add(directionalLight);

    // 影を受け取る背景平面を追加（コンテンツと同じ角度・高さ）
    const shadowPlaneGeometry = new THREE.PlaneGeometry(2000, 2000);
    const shadowPlaneMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeometry, shadowPlaneMaterial);
    shadowPlane.rotation.x = -0.5;  // コンテンツと同じ角度
    shadowPlane.position.set(0, 0, 0);  // コンテンツと同じ高さ
    shadowPlane.receiveShadow = true;  // 影を受け取る
    scene.add(shadowPlane);

    // 3Dボタンを作成する関数
    function create3DButton(text, baseColor = 0x3c3c3c, topColor = 0xFFD700) {
        const group = new THREE.Group();

        // ボタンベース（丸みのあるシリンダー形状）
        const baseGeometry = new THREE.CylinderGeometry(50, 50, 20, 32);
        baseGeometry.rotateX(Math.PI / 2); // Z軸方向に向ける
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: baseColor,
            shininess: 60,
            specular: 0x666666
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.z = 10;
        baseMesh.castShadow = true;  // 影を投射
        group.add(baseMesh);

        // ボタン上部（押せる部分）
        const topGeometry = new THREE.CylinderGeometry(45, 48, 15, 32);
        topGeometry.rotateX(Math.PI / 2);
        const topMaterial = new THREE.MeshPhongMaterial({
            color: topColor,
            shininess: 80,
            specular: 0x888888
        });
        const topMesh = new THREE.Mesh(topGeometry, topMaterial);
        topMesh.position.z = 25;
        topMesh.castShadow = true;  // 影を投射
        group.add(topMesh);

        // エッジハイライト（リング）
        const ringGeometry = new THREE.TorusGeometry(45, 2, 16, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 100,
            specular: 0xaaaaaa
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.z = 20;
        ringMesh.castShadow = true;  // 影を投射
        group.add(ringMesh);

        // テキストをCanvasで描画
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;

        context.font = 'bold 180px "ヒラギノ明朝 ProN", "Hiragino Mincho ProN", "游明朝", "Yu Mincho", "HG行書体", "HGP行書体", cursive, serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 黒い枠線を描く
        context.strokeStyle = '#000000';
        context.lineWidth = 6;
        context.strokeText(text, 256, 256);

        // 白い文字を描く
        context.fillStyle = '#ffffff';
        context.fillText(text, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });

        // テキストを前面に配置
        const textGeometry = new THREE.PlaneGeometry(100, 100);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.z = 33;
        group.add(textMesh);

        return { group, baseMesh, topMesh, textMesh, originalZ: 25, originalColor: topColor };
    }

    // 前ボタン（赤色）
    const prevButton = create3DButton('前', 0x3c3c3c, 0xDC143C);
    prevButton.group.position.set(-600, 0, 0);
    prevButton.group.rotation.x = -0.5;
    scene.add(prevButton.group);

    // 次ボタン（赤色）
    const nextButton = create3DButton('次', 0x3c3c3c, 0xDC143C);
    nextButton.group.position.set(600, 0, 0);
    nextButton.group.rotation.x = -0.5;
    scene.add(nextButton.group);

    // ランダムボタン（黄色）
    const randomButton = create3DButton('運', 0x3c3c3c, 0xFFD700);
    const tiltAngle = 0.5;
    const offset = 470;
    randomButton.group.position.set(
        600,
        offset * Math.cos(tiltAngle),
        -offset * Math.sin(tiltAngle)
    );
    randomButton.group.rotation.x = -0.5;
    scene.add(randomButton.group);

    // Raycasterでクリック検出
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([
            prevButton.group,
            nextButton.group,
            randomButton.group
        ], true);

        if (intersects.length > 0) {
            event.stopPropagation();
            event.preventDefault();

            const clickedObject = intersects[0].object;
            let button = null;
            let buttonName = '';

            // 親グループを特定
            if (clickedObject.parent === prevButton.group || clickedObject === prevButton.group) {
                button = prevButton;
                buttonName = 'prev';
            } else if (clickedObject.parent === nextButton.group || clickedObject === nextButton.group) {
                button = nextButton;
                buttonName = 'next';
            } else if (clickedObject.parent === randomButton.group || clickedObject === randomButton.group) {
                button = randomButton;
                buttonName = 'random';
            }

            if (button) {
                // 押し込みアニメーション
                button.topMesh.position.z = button.originalZ - 5;
                button.textMesh.position.z = 33 - 5;

                setTimeout(() => {
                    button.topMesh.position.z = button.originalZ;
                    button.textMesh.position.z = 33;
                }, 100);

                // ナビゲーション
                if (buttonName === 'prev' && button.url) {
                    location.href = button.url;
                } else if (buttonName === 'next' && button.url) {
                    location.href = button.url;
                } else if (buttonName === 'random') {
                    fetch('/api/random')
                        .then(r => r.json())
                        .then(data => {
                            if (data.random) {
                                location.href = data.random;
                            }
                        });
                }
            }
        }
    });

    // ホバー効果
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([
            prevButton.group,
            nextButton.group,
            randomButton.group
        ], true);

        // 全ボタンを元の色に戻す
        prevButton.topMesh.material.color.setHex(prevButton.originalColor);
        nextButton.topMesh.material.color.setHex(nextButton.originalColor);
        randomButton.topMesh.material.color.setHex(randomButton.originalColor);

        // ホバー中のボタンを明るくする
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            let hoveredButton = null;

            if (hoveredObject.parent === prevButton.group || hoveredObject === prevButton.group) {
                hoveredButton = prevButton;
            } else if (hoveredObject.parent === nextButton.group || hoveredObject === nextButton.group) {
                hoveredButton = nextButton;
            } else if (hoveredObject.parent === randomButton.group || hoveredObject === randomButton.group) {
                hoveredButton = randomButton;
            }

            if (hoveredButton) {
                // 元の色より明るくする
                const brightColor = new THREE.Color(hoveredButton.originalColor).offsetHSL(0, 0, 0.15);
                hoveredButton.topMesh.material.color.copy(brightColor);
                document.body.style.cursor = 'pointer';
                controls.enabled = false; // ボタンの上ではカメラ操作を無効化
            }
        } else {
            document.body.style.cursor = 'default';
            // リンクの上でない場合のみカメラ操作を有効化
            const target = document.elementFromPoint(event.clientX, event.clientY);
            if (target && target.tagName !== 'A') {
                controls.enabled = true;
            }
        }
    });

    // Fetch and setup navigation
    const currentPath = location.pathname.slice(1);

    fetch(`/api/prev?current=${encodeURIComponent(currentPath)}`)
        .then(r => r.json())
        .then(data => {
            if (data.prev) {
                prevButton.url = data.prev;
            } else {
                prevButton.topMesh.material.opacity = 0.3;
                prevButton.topMesh.material.transparent = true;
                prevButton.baseMesh.material.opacity = 0.3;
                prevButton.baseMesh.material.transparent = true;
            }
        });

    fetch(`/api/next?current=${encodeURIComponent(currentPath)}`)
        .then(r => r.json())
        .then(data => {
            if (data.next) {
                nextButton.url = data.next;
            } else {
                nextButton.topMesh.material.opacity = 0.3;
                nextButton.topMesh.material.transparent = true;
                nextButton.baseMesh.material.opacity = 0.3;
                nextButton.baseMesh.material.transparent = true;
            }
        });
}
