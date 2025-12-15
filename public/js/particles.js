document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const homeSection = document.getElementById('home');
    canvas.width = homeSection.offsetWidth;
    canvas.height = homeSection.offsetHeight;

    const particles = [];
    const particleCount = 100;
    const colors = ['#8a0303', '#5a0202', '#adb5bd', '#6c757d'];

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedY = Math.random() * 1.5 + 0.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.y += this.speedY;
            if (this.y > canvas.height) {
                this.y = 0 - this.size;
                this.x = Math.random() * canvas.width;
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Simple circle for "petals"
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const particle of particles) {
            particle.update();
            particle.draw();
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        canvas.width = homeSection.offsetWidth;
        canvas.height = homeSection.offsetHeight;
    });

    init();
    animate();
});
