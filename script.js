// Load the Strongbow image
const strongbowImage = new Image();
strongbowImage.src = 'img/strongbow.png';

// Wait for the image to load before setting up the flow field
strongbowImage.onload = () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create an offscreen canvas to store the image data
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = strongbowImage.width;
    offscreenCanvas.height = strongbowImage.height;
    offscreenCtx.drawImage(strongbowImage, 0, 0);

    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const particles = [];

    // Create particles
    for (let i = 0; i < 10000; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0.5 + Math.random() * 1,
            length: 5 + Math.random() * 15, // Random length between 5 and 20
            angle: Math.random() * Math.PI * 2 // Random initial angle
        });
    }

    let startTime = Date.now();
    const loopDuration = 10000; // 4 seconds in milliseconds

    function animate() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // Reset particles if 4 seconds have passed
        if (elapsedTime >= loopDuration) {
            startTime = currentTime;
            particles.forEach(particle => {
                particle.x = Math.random() * canvas.width;
                particle.y = Math.random() * canvas.height;
            });
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            // Map particle position to image coordinates
            const imgX = Math.floor((particle.x / canvas.width) * imageData.width);
            const imgY = Math.floor((particle.y / canvas.height) * imageData.height);
            const index = (imgY * imageData.width + imgX) * 4;

            // Use color data to determine direction
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            const brightness = (r + g + b) / 2;
            const angle = (brightness / 255) * Math.PI / 1;

            // Update particle position
            particle.x += Math.cos(angle) * particle.speed + 1;
            particle.y += Math.sin(angle) * particle.speed *1;

            // Wrap particles around the canvas
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Draw particle
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(particle.x, particle.y, 1, 1);
        });

        requestAnimationFrame(animate);
    }

    animate();
};
