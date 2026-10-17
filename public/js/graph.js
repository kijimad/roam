import ForceGraph3D from "https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.1/+esm";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm";
import { CSS3DRenderer, CSS3DObject } from "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/renderers/CSS3DRenderer.js/+esm";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/postprocessing/ShaderPass.js/+esm";

const band = document.getElementById("main-graph");

const GOLD = "#ffd700";
const LINK = "#8a8470";
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
const pick = list => list[Math.floor(Math.random() * list.length)];
const tween = (ms, step, done) => {
    const started = performance.now();
    const frame = now => {
        const k = Math.min(1, (now - started) / ms);
        if (step(k) === false) return;
        if (k < 1) requestAnimationFrame(frame);
        else done?.();
    };
    requestAnimationFrame(frame);
};

// 頂点の画面上の位置を格子に丸め、初期の3Dゲーム機のように震わせる
const snap = { value: new THREE.Vector2() };
const snapVertex = shader => {
    shader.uniforms.uSnap = snap;
    shader.vertexShader = "uniform vec2 uSnap;\n" + shader.vertexShader.replace("#include <project_vertex>", `#include <project_vertex>
        gl_Position.xy = round(gl_Position.xy / gl_Position.w * uSnap) / uSnap * gl_Position.w;`);
};

// 15bit 相当に色を落とし、4x4 の網目で中間色を出す。
// 半透明の色は不透明度を割り戻してから sRGB に直す。掛けたままだと薄い線が明るくなりすぎる
const dither = {
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse;
        varying vec2 vUv;
        const mat4 bayer = mat4(0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.) / 16.;
        void main() {
            vec4 c = texture2D(tDiffuse, vUv);
            vec3 rgb = c.rgb / max(c.a, 1e-4);
            rgb = mix(rgb * 12.92, 1.055 * pow(rgb, vec3(1. / 2.4)) - .055, step(.0031308, rgb));
            ivec2 p = ivec2(mod(gl_FragCoord.xy, 4.));
            gl_FragColor = vec4(floor(rgb * 31. + bayer[p.x][p.y]) / 31. * c.a, c.a);
        }`,
};

try {
    const data = await (await fetch("js/graph.json")).json();
    const nameOf = d => d.label.replace(/"/g, "");

    // 大きいコミュニティだけにくすんだ色を付け、ここ30日のメモは灯りの色にする
    const palette = [0xc8a050, 0xb0603a, 0x8a9a50, 0x5a7aa0, 0x8a5a80, 0x6a9a8a];
    const sizes = new Map();
    for (const n of data.nodes) sizes.set(n.communityLabel, (sizes.get(n.communityLabel) || 0) + 1);
    const ranked = [...sizes.keys()].sort((a, b) => sizes.get(b) - sizes.get(a));
    const recent = d => {
        const m = d.lnk.match(/(\d{4})(\d{2})(\d{2})/);
        return m && Date.now() - new Date(m[1], m[2] - 1, m[3]) < 30 * 24 * 60 * 60 * 1000;
    };
    const colorOf = d => recent(d) ? 0xffd98a : palette[ranked.indexOf(d.communityLabel)] ?? 0x7d7766;

    const mesh = d => {
        const m = new THREE.Mesh(
            new THREE.IcosahedronGeometry(4 + 30 * Math.sqrt(d.centrality), 0),
            new THREE.MeshLambertMaterial({
                color: colorOf(d),
                flatShading: true,
                emissive: recent(d) ? 0x806020 : 0x000000,
                transparent: true,
            }),
        );
        m.material.onBeforeCompile = snapVertex;
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        return m;
    };

    const neighbors = new Map(data.nodes.map(n => [n.id, new Set([n.id])]));
    for (const e of data.edges) {
        neighbors.get(e.source).add(e.target);
        neighbors.get(e.target).add(e.source);
    }

    // 照らすのは手でホバーしたものを優先し、なければツアーの主役。
    // ホバーは周りを強く沈め、ツアーは全体が見えるようつながりを金色にするだけにする
    let hovered = null, featured = null;
    const focused = () => hovered || featured;
    const linkColor = l => {
        const f = focused();
        if (f && (l.source.id === f.id || l.target.id === f.id)) return GOLD;
        return hovered ? "#1a1814" : LINK;
    };

    const view = document.createElement("div");
    view.style.cssText = "position: absolute; inset: 0;";
    band.append(view);

    const labels = new CSS3DRenderer();
    const graph = new ForceGraph3D(view, {
        controlType: "orbit",
        rendererConfig: { antialias: false },
        extraRenderers: [labels],
    })
        .backgroundColor("rgba(0,0,0,0)")
        .showNavInfo(false)
        .graphData({ nodes: data.nodes, links: data.edges })
        .nodeThreeObject(mesh)
        .nodeLabel(nameOf)
        .linkColor(linkColor)
        .linkOpacity(0.35)
        .warmupTicks(300)
        .cooldownTicks(0)
        .onNodeClick(d => { location.href = "./" + d.lnk + ".html"; })
        .onNodeHover(d => hover(d));

    const illuminate = () => {
        const f = focused();
        const near = f && neighbors.get(f.id);
        for (const n of data.nodes) n.__threeObj.material.opacity = !hovered || near.has(n.id) ? 1 : 0.15;
        graph.linkColor(linkColor);
    };
    const hover = d => {
        hovered = d;
        view.style.cursor = d ? "pointer" : null;
        illuminate();
    };
    // ライブラリは最後のマウス位置で当たり判定を続けるので、帯の外では止める
    graph.enablePointerInteraction(false);
    view.addEventListener("pointerenter", () => graph.enablePointerInteraction(true));
    view.addEventListener("pointerleave", () => {
        graph.enablePointerInteraction(false);
        hover(null);
    });

    const camera = graph.camera();
    const controls = graph.controls();
    const composer = graph.postProcessingComposer();
    // 解像度を半分にして、ぼかさずに引き伸ばす
    graph.renderer().setPixelRatio(0.5);
    composer.setPixelRatio(0.5);
    composer.addPass(new ShaderPass(dither));
    graph.renderer().domElement.style.imageRendering = "pixelated";
    graph.scene().fog = new THREE.Fog(0x000000, 600, 1600);
    graph.cameraPosition({ x: 0, y: 0, z: 900 });

    // 主役の名前の注記。線は場面の中に描いてノードと同じ粗さにし、名前は読めるよう HTML で重ねる
    const title = (() => {
        const measure = document.createElement("canvas").getContext("2d");
        let current = null;
        const make = (n, from) => {
            const edge = n.__threeObj.geometry.parameters.radius * Math.SQRT1_2;
            const bend = edge + 40;
            const el = document.createElement("div");
            el.style.cssText = "width: 0; height: 0; pointer-events: none; backface-visibility: hidden;";
            const text = document.createElement("div");
            text.style.cssText = `position: absolute; left: ${bend}px; top: ${-bend}px; transform: translateY(-100%);
                white-space: nowrap; padding: 0 8px 4px 4px; font: 20px "Izumi16", monospace; line-height: 1.4; color: ${GOLD};`;
            text.textContent = nameOf(n);
            el.append(text);

            const obj = new CSS3DObject(el);
            obj.position.set(n.x, n.y, n.z);
            obj.lookAt(from);

            // CSS は下向きが正、場面は上向きが正なので y の符号が逆になる
            measure.font = '20px "Izumi16"';
            const end = bend + measure.measureText(text.textContent).width + 12;
            const points = [new THREE.Vector3(edge, edge, 0), new THREE.Vector3(bend, bend, 0), new THREE.Vector3(end, bend, 0)];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([points[0], points[0], points[0]]),
                // 名前の HTML は常に手前に出るので、線もノードに隠れないようにする
                new THREE.LineBasicMaterial({ color: GOLD, transparent: true, depthTest: false }),
            );
            line.renderOrder = 1;
            obj.add(line);
            graph.scene().add(obj);

            // 斜めの線、下線、名前の順に出す
            const position = line.geometry.getAttribute("position");
            tween(600, k => {
                if (!line.parent) return false;
                const tip = k < 0.5
                    ? points[0].clone().lerp(points[1], ease(k * 2))
                    : points[1].clone().lerp(points[2], ease(k * 2 - 1));
                position.setXYZ(1, ...(k < 0.5 ? tip : points[1]).toArray());
                position.setXYZ(2, ...tip.toArray());
                position.needsUpdate = true;
            });
            text.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 450, fill: "both" });
            return { obj, el, line };
        };
        return {
            show(n, from) {
                this.hide();
                current = make(n, from);
            },
            // 前の注記が消えきる前に次を出せるよう、消すものは手放してから消す
            hide() {
                if (!current) return;
                const { obj, el, line } = current;
                current = null;
                el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
                tween(300, k => { line.material.opacity = 1 - k; }, () => {
                    obj.removeFromParent();
                    line.geometry.dispose();
                    line.material.dispose();
                });
            },
        };
    })();

    // ツアー: 3本以上つながるノードをランダムに訪ね、照らして待つ → 移動 → 主役のまわりを水平に回る → 静止
    const candidates = data.nodes.filter(n => neighbors.get(n.id).size > 3);
    const UP = new THREE.Vector3(0, 1, 0);
    const WAIT = 1, TRAVEL = 2.5, MOVE = 6, HOLD = 1.5, RADIUS = 300, HEIGHT = 80;
    const positionOf = n => new THREE.Vector3(n.x, n.y, n.z);
    // 見る点からの位置 offset を、UP のまわりに sweep × p だけ回す。p は撮影の進み(0→1)
    const pose = (sh, p) => {
        const look = sh.look ?? positionOf(sh.node);
        return { eye: sh.offset.clone().applyAxisAngle(UP, sh.sweep * p).add(look), look };
    };

    let shot = null;
    const startShot = t => {
        let node;
        do node = pick(candidates); while (shot && node === shot.node);
        const a = Math.random() * Math.PI * 2;
        shot = {
            node,
            offset: new THREE.Vector3(RADIUS * Math.cos(a), HEIGHT, RADIUS * Math.sin(a)),
            sweep: 1,
            start: t + WAIT * 1000,
            travel: TRAVEL,
            fromEye: camera.position.clone(),
            fromLook: controls.target.clone(),
            arrived: false,
        };
        // 名前は着いてから出し、出る様子を画面の中で見せる
        featured = node;
        illuminate();
        title.hide();
    };

    // 手で動かしている間と、離してから 1 秒は止める。離したことは指をどこで離しても拾う
    let engaged = false, paused = false, lastInput = -Infinity;
    const touched = () => { lastInput = performance.now(); };
    const release = () => { if (engaged) { engaged = false; touched(); } };
    controls.addEventListener("start", () => { engaged = true; touched(); });
    controls.addEventListener("end", release);
    for (const type of ["pointerup", "pointercancel"]) addEventListener(type, release, true);

    const tour = t => {
        if (engaged || t - lastInput < 1000) {
            paused = true;
            return;
        }
        // 配置が済むまでは座標がない
        if (data.nodes[0].x === undefined) return;
        if (!shot) startShot(t);
        // 手で動かした後は、決めてあった構図へ戻らず今の視点から続ける。
        // 着く前なら主役への移動をやり直し、着いた後なら見ていた点のまわりを回る
        if (paused) {
            paused = false;
            Object.assign(shot, { start: t }, shot.arrived
                ? { travel: 0, sweep: 0.8, look: controls.target.clone(), offset: camera.position.clone().sub(controls.target) }
                : { fromEye: camera.position.clone(), fromLook: controls.target.clone() });
        }
        if ((t - shot.start) / 1000 > shot.travel + MOVE + HOLD) startShot(t);
        const e = (t - shot.start) / 1000;
        if (e < 0) return;

        if (e < shot.travel) {
            const q = ease(e / shot.travel);
            const start = pose(shot, 0);
            camera.position.lerpVectors(shot.fromEye, start.eye, q);
            controls.target.lerpVectors(shot.fromLook, start.look, q);
        } else {
            const { eye, look } = pose(shot, ease(Math.min(1, (e - shot.travel) / MOVE)));
            camera.position.copy(eye);
            controls.target.copy(look);
            if (!shot.arrived) {
                shot.arrived = true;
                title.show(shot.node, camera.position);
            }
        }
    };

    const resize = () => {
        graph.width(band.clientWidth).height(band.clientHeight);
        // 4px の格子。画面の端から端が -1 から 1 なので、半分の数で割る
        snap.value.set(band.clientWidth / 8, band.clientHeight / 8);
    };
    addEventListener("resize", resize);
    resize();

    // 描く回数だけを 20fps に間引く。カメラは時間どおり進む。
    // 名前の HTML も同じコマで描き、場面の中の線とずれないようにする
    const renderFrame = composer.render.bind(composer);
    const renderLabels = labels.render.bind(labels);
    let last = 0, drawn = false;
    labels.render = (...args) => { if (drawn) renderLabels(...args); };
    composer.render = () => {
        const now = performance.now();
        drawn = now - last >= 1000 / 20;
        if (!drawn) return;
        last = now;
        // ライブラリが作る線にも震えを付ける
        graph.scene().traverse(o => {
            if (o.isLine && o.material.onBeforeCompile !== snapVertex) {
                o.material.onBeforeCompile = snapVertex;
                o.material.needsUpdate = true;
            }
        });
        renderFrame();
    };
    // 帯が画面の外にある間は、ツアーも描画も止める
    let visible = true;
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) graph.resumeAnimation();
        else graph.pauseAnimation();
    }).observe(band);
    const loop = t => {
        if (visible) tour(t);
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    band.querySelector("svg")?.remove();
} catch (e) {
    console.error(e);
    const loading = band.querySelector(".graph-loading");
    loading?.querySelectorAll("rect").forEach(r => r.remove());
    loading?.insertAdjacentHTML("beforeend", '<text text-anchor="middle">グラフを読み込めませんでした</text>');
}
