let globalRotationY = 0;

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function updateDynamicFavicon(renderer, scene, camera, group) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    
    const originalScale = group.scale.x;
    const originalZ = camera.position.z;
    
    group.scale.set(1.6, 1.6, 1.6);
    camera.position.z = 2.2;
    
    renderer.render(scene, camera);

    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = renderer.domElement.toDataURL("image/png");
    
    if (!document.querySelector("link[rel*='icon']")) {
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    group.scale.set(originalScale, originalScale, originalScale);
    camera.position.z = originalZ;
}

function create3DLogo(containerId, size, isInteractive) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = ''; 
    
    const scene = new THREE.Scene();
    const cameraZ = size < 100 ? 2.5 : 3;
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        preserveDrawingBuffer: true 
    });
    
    renderer.setSize(size, size);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    
    const coreGeom = new THREE.IcosahedronGeometry(1, 0);
    const coreMat = new THREE.MeshPhongMaterial({ 
        color: 0x2563eb, 
        flatShading: true,
        shininess: 100
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    const wireframeGeom = new THREE.IcosahedronGeometry(1.05, 0);
    const wireframeMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const wireframe = new THREE.Mesh(wireframeGeom, wireframeMat);
    group.add(wireframe);

    scene.add(group);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = cameraZ;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    let rotationOffset = 0;
    let manualRotationX = 0;

    const onMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (isDragging && isInteractive) {
            if (e.cancelable && e.type === 'touchmove') e.preventDefault(); 
            
            const deltaMove = {
                x: clientX - previousMousePosition.x,
                y: clientY - previousMousePosition.y
            };
            
            rotationOffset += deltaMove.x * 0.005;
            manualRotationX += deltaMove.y * 0.005;
        }
        previousMousePosition = { x: clientX, y: clientY };
    };

    const startDrag = (e) => {
        if (!isInteractive) return;
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        previousMousePosition = { x: clientX, y: clientY };
    };

    const stopDrag = () => { isDragging = false; };

    if (isInteractive) {
        container.addEventListener('mousedown', startDrag);
        container.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
    }

    let frameCount = 0;

    function animate() {
        requestAnimationFrame(animate);
        
        if (containerId === 'logo-3d-container') {
            globalRotationY += 0.005;
            
            frameCount++;
            if (frameCount % 30 === 0) {
                updateDynamicFavicon(renderer, scene, camera, group);
            }
        }

        if (!isDragging) {
            rotationOffset = rotationOffset * 0.95; 
            manualRotationX = manualRotationX * 0.95;
        }

        group.rotation.y = globalRotationY + rotationOffset;
        group.rotation.x = 0.002 + manualRotationX;

        renderer.render(scene, camera);
    }
    animate();
}

function toggleTheme() {
    const checkbox = document.getElementById('themeCheckbox');
    const theme = checkbox.checked ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    setCookie('lax_theme', theme, 30);
}

function initTheme() {
    const savedTheme = getCookie('lax_theme') || 'dark';
    const checkbox = document.getElementById('themeCheckbox');
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    if(checkbox) checkbox.checked = (savedTheme === 'light');
}

const examples = [
    `[start\n  [image "Hello World!"]\n  [nl]\n]\n\n; Lax is ready to print Hello World!.`,
    `[start\n  [spot name [input "Enter your name: "]]\n  [image "Hello, "] [image name] [image "!"] [nl]]\n\n; Handle inputs with ease.`,
    `[start\n  [spot op_raw [input "Select operation (+, -, *, /, sqrt, expt): "]]\n   [spot op [string->sign op_raw]]\n\n   [spot is_unary [eq? op [string->sign "sqrt"]]]\n\n   [spot first_raw [if is_unary [input "Enter number: "] [input "First number: "]]]\n   [spot first_num [to-number first_raw]]\n   [spot first_ok [and [> [string-length first_raw] 0] [number? first_num]]]\n\n   [spot second_raw [if [not is_unary] [input "Second number: "] ""]]\n   [spot second_num [to-number second_raw]]\n   [spot second_ok [or is_unary [and [> [string-length second_raw] 0] [number? second_num]]]]\n   [spot dispatch_table\n    [list* [cons [string->sign "+"] +]\n      [cons [string->sign "-"] -]\n      [cons [string->sign "*"] *]\n      [cons [string->sign "/"] /]\n      [cons [string->sign "expt"] expt]\n      [cons [string->sign "sqrt"] sqrt]\n      []\n    ]\n  ]\n\n  [spot op_pair [assq op dispatch_table]]\n\n  [spot ans\n    [if [not first_ok] "Error: Bad first number"\n      [if [not second_ok] "Error: Bad second number"\n        [if [not op_pair] "Error: Unknown operation"\n          [start\n             [spot func [tail op_pair]]\n             \n             [if [and [eq? op [string->sign "/"]] [= second_num 0]]\n               "Error: Division by zero"\n               [if [and is_unary [< first_num 0]]\n                 "Error: Negative root"\n                 [if is_unary\n                    [func first_num]\n                    [func first_num second_num]\n                 ]\n               ]\n             ]\n          ]\n        ]\n      ]\n    ]\n  ]\n\n  [image first_raw] [image " "] [image op_raw] \n  [if [not is_unary] [start [image " "] [image second_raw]] ""]\n  [image " = "] [image ans] [nl]]\n\n; A full featured calculator in Lax.`,
    `[spot [println x]\n  [image x]\n  [nl]]\n\n[spot [is-print-cmd? str]\n  [let [[len [string-length str]]]\n    [if [>= len 6]\n        [eqv? [string->atom [substring str 0 6]] [string->atom "print "]]\n        #f]]]\n\n[spot [get-print-text str]\n  [substring str 6 [string-length str]]]\n\n[spot [string->command str]\n  [let [[a [string->atom str]]]\n    [if [sign? a] a [string->atom "unknown"]]]]\n\n[spot [shell-loop]\n  [let [[line [input "Lax$ "]]]\n\n    [if [eof-object? line] [quit]]\n\n    [if [<= [string-length line] 0]\n      [shell-loop]\n\n      [if [is-print-cmd? line]\n        [start\n          [println [get-print-text line]]\n          [shell-loop]]\n        \n        [let [[cmd [string->command line]]]\n          [chlet\n              [[eqv? cmd [string->atom "exit"]] \n                [quit]]\n\n              [[eqv? cmd [string->atom "help"]]\n                [start\n                  [println "=== Lax Terminal Help ==="]\n                  [println "  print <text>  : Print text to output"]\n                  [println "  help          : Show this menu"]\n                  [println "  nl            : Makes a paragraph"]\n                  [println "  exit          : Exit the shell"]\n                  [nl]\n                  [shell-loop]]]\n\n              [[eqv? cmd [string->atom "nl"]]\n                [start\n                  [nl]\n                  [shell-loop]]]\n\n              [else\n                [start\n                  [image "Error: Unknown command '"] [image line] [println "'"]\n                  [shell-loop]]]]]]]]\n]\n\n[start\n  [println "Welcome to Lax Terminal!"]\n  [println "Type 'help' to get started."]\n  [nl]\n  [shell-loop]]\n\n; A simple shell emulator.`
];

const fileNames = ["hello.lx", "input.lx", "math.lx", "shell.lx"];
let currentExampleIndex = 0;
const keywords = ['start', 'spot', 'if', 'let', 'chlet', 'else', 'and', 'or', 'not'];
const commands = ['image', 'input', 'nl', 'quit', 'println', 'string->sign', 'string->atom', 'to-number', 'number?', 'string-length', 'substring', 'eq?', 'eqv?', 'sign?', 'eof-object?', 'list*', 'cons', 'assq', 'tail', 'expt', 'sqrt'];

function highlightSyntax(text) {
    let highlighted = '';
    let i = 0;
    while (i < text.length) {
        const char = text[i];
        if (char === ';') {
            let comment = ';'; i++;
            while (i < text.length && text[i] !== '\n') { comment += text[i]; i++; }
            highlighted += `<span class="comment">${comment}</span>`; continue;
        }
        if (char === '"') {
            let str = '"'; i++;
            while (i < text.length && text[i] !== '"') { str += text[i]; i++; }
            if (i < text.length) { str += '"'; i++; }
            highlighted += `<span class="string">${str}</span>`; continue;
        }
        if (char === '[' || char === ']') {
            highlighted += `<span class="bracket">${char}</span>`; i++; continue;
        }
        if (char === '\\' && text[i+1] === 'n') {
            highlighted += `<span class="escape">\\n</span>`; i += 2; continue;
        }
        if (char === '\n') { highlighted += '<br>'; i++; continue; }
        if (char === ' ') { highlighted += '&nbsp;'; i++; continue; }
        if (/[a-zA-Z_\-\?\>\<\=\+\*\/]/.test(char)) {
            let word = '';
            while (i < text.length && /[a-zA-Z0-9_\-\?\>\<\=\+\*\/]/.test(text[i])) { word += text[i]; i++; }
            if (keywords.includes(word)) highlighted += `<span class="keyword">${word}</span>`;
            else if (commands.includes(word)) highlighted += `<span class="command">${word}</span>`;
            else highlighted += word;
            continue;
        }
        highlighted += char; i++;
    }
    return highlighted;
}

let animationFrame;
function typeCode(text) {
    const element = document.getElementById('typing-text');
    const highlighted = highlightSyntax(text);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    element.innerHTML = '';
    let animationStartTime = Date.now();
    function animate() {
        const elapsed = Date.now() - animationStartTime;
        const charsToShow = Math.floor(elapsed / 2);
        let visibleChars = 0;
        let result = '';
        let inTag = false;
        for (let i = 0; i < highlighted.length; i++) {
            if (highlighted[i] === '<') inTag = true;
            result += highlighted[i];
            if (highlighted[i] === '>') { inTag = false; continue; }
            if (!inTag && highlighted.substr(i, 6) !== '&nbsp;' && highlighted.substr(i, 4) !== '<br>') {
                visibleChars++;
                if (visibleChars >= charsToShow) {
                    element.innerHTML = result;
                    animationFrame = requestAnimationFrame(animate);
                    return;
                }
            }
        }
        element.innerHTML = highlighted;
    }
    animate();
}

function changeExample(index) {
    currentExampleIndex = index;
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.menu-item')[index].classList.add('active');
    typeCode(examples[index]);
}

function copyCode() {
    navigator.clipboard.writeText(examples[currentExampleIndex]);
}

function downloadCode() {
    const blob = new Blob([examples[currentExampleIndex]], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileNames[currentExampleIndex];
    a.click();
}

function initPowerTrail() {
    const textEl = document.getElementById('power-text');
    if (!textEl) return;

    const oldCanvas = document.getElementById('power-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'power-canvas';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let points = [];
    
    let isHoveringText = false; 
    let lastActiveTime = 0;     
    let mouse = { x: 0, y: 0 }; 

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        const timeSinceLeave = Date.now() - lastActiveTime;
        const isActive = isHoveringText || (lastActiveTime > 0 && timeSinceLeave < 1000);

        if (isActive) {
            points.push({ 
                x: mouse.x, 
                y: mouse.y, 
                age: 0,
                dx: (Math.random() - 0.5) * 2,
                dy: (Math.random() - 0.5) * 2
            });
        }
    });

    textEl.addEventListener('mouseenter', () => {
        isHoveringText = true;
        lastActiveTime = 0; 
    });

    textEl.addEventListener('mouseleave', () => {
        isHoveringText = false;
        lastActiveTime = Date.now();
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (points.length > 1) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fbbf24';
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];
                
                ctx.beginPath();
                ctx.moveTo(p1.x + p1.dx, p1.y + p1.dy);
                ctx.lineTo(p2.x + p2.dx, p2.y + p2.dy);
                
                const alpha = 1 - (p1.age / 30);
                if (alpha <= 0) continue;

                const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                gradient.addColorStop(0, `rgba(168, 85, 247, ${alpha})`);
                gradient.addColorStop(1, `rgba(251, 191, 36, ${alpha})`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 10 * alpha;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        for (let i = 0; i < points.length; i++) {
            points[i].age += 1;
            points[i].x += points[i].dx * 0.5;
            points[i].y += points[i].dy * 0.5;
        }
        
        points = points.filter(p => p.age < 30);
        
        requestAnimationFrame(animate);
    }
    animate();
}

window.onload = () => {
    initTheme();

    initPowerTrail();

    create3DLogo('logo-3d-container', 250, true);
    
    setTimeout(() => {
        create3DLogo('nav-mini-logo', 40, true);
        create3DLogo('footer-mini-logo', 40, true);
    }, 100);

    typeCode(examples[0]);
};
