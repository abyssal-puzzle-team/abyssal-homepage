// ================================
// 几何场景类 (二十面体) - 从 GeometryBackground.vue 移植
// ================================
class GeometryScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        
        this.points = [];
        this.lines = [];
        
        this.rotation = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        
        this.width = 0;
        this.height = 0;
        this.cx = 0;
        this.cy = 0;
        
        this.animationId = null;

        this.init();
    }

    init() {
        this.resize();
        this.initGeometry();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
    }

    updateMouse(x, y) {
        const nx = (x / this.width) * 2 - 1;
        const ny = -(y / this.height) + 0.5;
        this.targetRotation.x = ny * 0.5; 
        this.targetRotation.y = nx * 0.5; 
    }

    initGeometry() {
        const t = (1 + Math.sqrt(5)) / 2;
        const size = 180; 

        const vertices = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
        ];

        this.points = vertices.map(([x, y, z]) => ({
            x: x * size, y: y * size, z: z * size
        }));

        this.lines = [];
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                const p1 = this.points[i];
                const p2 = this.points[j];
                const dist = Math.sqrt(
                    (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2
                );
                if (dist < size * 2.1) {
                    this.lines.push({ p1: i, p2: j });
                }
            }
        }
    }

    project(x, y, z) {
        const scale = 1000 / (1000 + z);
        return {
            x: this.cx + x * scale,
            y: this.cy + y * scale,
            scale
        };
    }

    rotatePoint(p, rot) {
        let y = p.y * Math.cos(rot.x) - p.z * Math.sin(rot.x);
        let z = p.y * Math.sin(rot.x) + p.z * Math.cos(rot.x);
        let x = p.x;

        const z2 = z * Math.cos(rot.y) - x * Math.sin(rot.y);
        const x2 = z * Math.sin(rot.y) + x * Math.cos(rot.y);

        return { x: x2, y, z: z2 };
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.rotation.x = this.lerp(this.rotation.x, this.targetRotation.x, 0.05);
        this.rotation.y = this.lerp(this.rotation.y, this.targetRotation.y, 0.05);

        this.rotation.y += 0.003; 
        this.rotation.x += 0.001; 

        const transformed = this.points.map((p) =>
            this.rotatePoint(p, this.rotation)
        );

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; 
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.lines.forEach((line) => {
            const p1 = transformed[line.p1];
            const p2 = transformed[line.p2];
            const a = this.project(p1.x, p1.y, p1.z);
            const b = this.project(p2.x, p2.y, p2.z);
            this.ctx.moveTo(a.x, a.y);
            this.ctx.lineTo(b.x, b.y);
        });
        this.ctx.stroke();

        transformed.forEach((p) => {
            const pr = this.project(p.x, p.y, p.z);
            const alpha = 0.5 + (pr.scale - 0.5); 
            this.ctx.beginPath();
            this.ctx.arc(pr.x, pr.y, 2.5 * pr.scale, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        });

        this.animationId = requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

// --- 自定义光标逻辑 ---
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;
let isMobile = false;

const lerp = (a, b, n) => (1 - n) * a + n * b;

const checkDevice = () => {
    isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    if (isMobile) {
        document.body.style.cursor = 'auto';
        cursorDot.style.display = 'none';
        cursorRing.style.display = 'none';
    } else {
        document.body.style.cursor = 'none';
        cursorDot.style.display = 'block';
        cursorRing.style.display = 'block';
    }
};

let sceneInstance = null;

const handleMouseMove = (e) => {
    if (!isMobile) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    }
    if (sceneInstance) {
        sceneInstance.updateMouse(e.clientX, e.clientY);
    }
};

const cursorLoop = () => {
    if (isMobile) return;
    ringX = lerp(ringX, mouseX, 0.15);
    ringY = lerp(ringY, mouseY, 0.15);
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(cursorLoop);
};

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const loaderStatusText = document.getElementById('loader-status-text');
    const progressBar = document.getElementById('loader-progress-bar');
    const heroLabel = document.querySelector('.hero-label');
    const heroActions = document.querySelector('.hero-actions');
    const navbar = document.querySelector('.navbar');

    const loadingMessages = [
        "INITIALIZING SYSTEM...",
        "LOADING ASSETS...",
        "ESTABLISHING CONNECTION...",
        "SYSTEM READY."
    ];
    let currentMessageIndex = 0;
    let progress = 0;
    const totalLoadingTime = 1000; // 总加载时间 1.5 秒 (调整为更快)
    const updateInterval = 50; // 每 50ms 更新一次进度

    function updateLoader() {
        if (progress <= 100) {
            progressBar.style.width = `${progress}%`;
            if (progress % 25 === 0 && progress !== 0) { // 每 25% 更新一次状态文本
                currentMessageIndex++;
                if (currentMessageIndex < loadingMessages.length) {
                    loaderStatusText.textContent = loadingMessages[currentMessageIndex];
                    loaderStatusText.style.opacity = 1;
                }
            }
            progress += (100 / (totalLoadingTime / updateInterval));
            setTimeout(updateLoader, updateInterval);
        } else {
            // 进度条完成后，触发幕布升起动画
            setTimeout(() => {
                loader.classList.add('hidden'); // 触发幕布升起动画

                // 延时显示文字，配合幕布升起
                setTimeout(() => {
                    if (heroLabel) heroLabel.classList.add('visible');
                        if (heroActions) heroActions.classList.add('visible');
                        // if (navbar) navbar.classList.add('visible'); // 导航栏不再包含链接，无需淡入

                    // 初始化文本解密特效
                    const heroTitleRef = document.querySelector('.hero-title');
                    if (heroTitleRef) {
                        const fx = new TextScramble(heroTitleRef);
                        fx.setText(heroTitleRef.dataset.value);
                    }
                }, 600); // 延时与 home.vue 保持一致
            }, 500); // 模拟加载动画持续时间，在进度条完成后再延迟0.5秒
        }
    }

    loaderStatusText.textContent = loadingMessages[0]; // 显示初始状态文本
    loaderStatusText.style.opacity = 1;
    updateLoader(); // 开始进度条动画

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('mousemove', handleMouseMove);

    // 初始化光标位置
    if (!isMobile) {
        mouseX = window.innerWidth / 2;
        mouseY = window.innerHeight / 2;
        ringX = mouseX;
        ringY = mouseY;
        cursorLoop();
    }

    // 初始化几何背景
    const canvas = document.getElementById('geometry-canvas');
    if (canvas) {
        sceneInstance = new GeometryScene(canvas);
        window.addEventListener('resize', () => sceneInstance.resize());
    }

    // 按钮 hover 效果
    const buttons = document.querySelectorAll('.main-btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            if (!isMobile) {
                cursorRing.classList.add('hovered');
            }
        });
        button.addEventListener('mouseleave', () => {
            if (!isMobile) {
                cursorRing.classList.remove('hovered');
            }
        });
    });

    // --- 文本解密特效类 (保持不变) ---
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_/[]{}—=+*^?#________';
            this.queue = [];
            this.frame = 0;
            this.frameRequest = null;
            this.update = this.update.bind(this);
        }

        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
        }

        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.chars[Math.floor(Math.random() * this.chars.length)];
                        this.queue[i].char = char;
                    }
                    output += `<span class="dud">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete !== this.queue.length) {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
    }
});