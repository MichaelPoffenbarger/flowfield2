//boiler plate particle effect library//





const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
canvas.width = 500;
canvas.height = 500;

// Set the fill style
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;



class Particle {
    constructor(effect){
        this.effect = effect;
        this.reset();
        this.speedX = 0;
        this.speedY = 0;
        this.originalMaxLength = this.maxLength;
    }

    draw(context){
        
        context.beginPath();
        context.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 0; i < this.history.length; i++){
            context.lineTo(this.history[i].x, this.history[i].y);
        }
        context.strokeStyle = this.color;
        context.stroke();
    }

    update(){
        this.timer--;
        if (this.timer >= 1){
            let x = Math.floor(this.x / this.effect.cellSize);
            let y = Math.floor(this.y / this.effect.cellSize);
            let index = y * this.effect.cols + x;

            if(this.effect.flowField[index]){
                this.newAngle = this.effect.flowField[index].colorAngle;
                
                // Add sine and cosine oscillation
                let oscillationX = Math.sin(this.timer * 0.1) * 0.2;
                let oscillationY = Math.cos(this.timer * 0.1) * 0.2;
                
                this.speedX += (Math.cos(this.angle) + oscillationX) * this.speedModifier;
                this.speedY += (Math.sin(this.angle) + oscillationY) * this.speedModifier;
                
                this.x += this.speedX;
                this.y += this.speedY;

                // Update color based on current position
                this.color = this.effect.colors[index];

                this.history.push({x: this.x, y: this.y});
                if (this.history.length > this.maxLength){
                    this.history.shift();
                }
            } else {
                this.reset();
            }
        } else if (this.history.length > 1) {
            this.history.shift();
        } else {
            this.reset();
        }
    }

    reset() {
        this.x = Math.random() * this.effect.width;
        this.y = Math.random() * this.effect.height;
        this.history = [{x: this.x, y: this.y}];
        this.timer = this.maxLength * 2;
        this.angle = 0;
        this.maxLength = Math.floor(Math.random() * 10 + 10);
        this.originalMaxLength = this.maxLength;
        this.speedModifier = Math.random() * 0.001 + 0.1;
        this.speedX = 0;
        this.speedY = 0;
        this.color = 'rgb(255,255,255)'; // Default white color
    }
}

class Effect {
    constructor(canvas, ctx){
        this.canvas = canvas;
        this.context = ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 8000;
        this.cellSize = 2;
        this.rows;
        this.cols;
        this.flowField = [];
        this.colors = []; // Add this line
        
        this.debug = false; // Change this line from true to false
        this.image = new Image();
        this.image.src = 'img/strongbow.png'; // Replace with your image path
        this.image.onload = () => {
            this.init();
        }

        window.addEventListener('keydown', e=> {
            if (e.key === 'd') this.debug = !this.debug;
        });

        window.addEventListener('resize', e=> {
           //this.resize(e.target.innerWidth, e.target.innerHeight);
        });
        this.imageData = null; // Add this line

        this.mouse = {
            x: 0,
            y: 0,
            radius: 400, // Increased for a larger area of effect
            active: false
        };

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
            this.mouse.active = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });
    }

    init(){
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];
        this.colors = [];

        // Draw image and create flow field
        this.context.drawImage(this.image, 0, 0, this.width, this.height);
        const pixels = this.context.getImageData(0, 0, this.width, this.height).data;
        
        for (let y = 0; y < this.height; y += this.cellSize){
            for (let x = 0; x < this.width; x += this.cellSize){
                const index = (y * this.width + x) * 4;
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const alpha = pixels[index + 3];
                const grayscale = (red + green + blue) / 3;
                const colorAngle = ((grayscale / 255) * Math.PI * 2).toFixed(2);
                this.flowField.push({
                    x: x,
                    y: y,
                    alpha: alpha,
                    colorAngle: parseFloat(colorAngle)
                });
                this.colors.push(`rgb(${red},${green},${blue})`);
            }
        }

        // Initialize particles
        this.particles = [];
        for(let i = 0; i < this.numberOfParticles; i++){
            this.particles.push(new Particle(this));
        }
    }
    
    drawGrid(){
        this.context.save();
        this.context.strokeStyle = 'red';
        this.context.lineWidth = 0.0001;
        for (let c = 0; c < this.cols; c++){
            this.context.beginPath();
            this.context.moveTo(this.cellSize * c, 0);
            this.context.lineTo(this.cellSize * c, this.height);
            this.context.stroke();

        }
        for (let r = 0; r < this.rows; r++){
            this.context.beginPath();
            this.context.moveTo(0, this.cellSize * r);
            this.context.lineTo(this.width, this.cellSize * r);
            this.context.stroke();
        }
        this.context.restore();
    }
    resize(width, height){
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.init();
    }
    render(){
        if (this.debug) {
            this.drawGrid();
            this.drawFlowField();
        }
        this.update();
        this.particles.forEach(particle => {
            particle.draw(this.context);
        });

        // Reveal original image around mouse
        if (this.mouse.active && this.imageData) {
            let revealSize = 100; // Size of the reveal area
            let imageData = this.context.getImageData(
                Math.max(0, this.mouse.x - revealSize/2),
                Math.max(0, this.mouse.y - revealSize/2),
                Math.min(revealSize, this.width - this.mouse.x + revealSize/2),
                Math.min(revealSize, this.height - this.mouse.y + revealSize/2)
            );

            for (let i = 0; i < imageData.data.length; i += 4) {
                let x = (i / 4) % revealSize;
                let y = Math.floor((i / 4) / revealSize);
                let distance = Math.sqrt(Math.pow(x - revealSize/2, 2) + Math.pow(y - revealSize/2, 2));
                let alpha = Math.max(0, 1 - distance / (revealSize/2));

                imageData.data[i + 3] = Math.floor(alpha * 255);
            }

            this.context.putImageData(imageData, 
                Math.max(0, this.mouse.x - revealSize/2),
                Math.max(0, this.mouse.y - revealSize/2)
            );
        }
    }

    update() {
        this.particles.forEach(particle => {
            particle.update();
            this.applyMouseEffect(particle);
        });
    }

    applyMouseEffect(particle) {
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = this.mouse.radius;
        
        if (distance < maxDistance) {
            // Increase clarity (reduce trail length) near the mouse
            const clarity = 1 - (distance / maxDistance);
            particle.maxLength = Math.max(1, Math.floor((1 - clarity) * particle.originalMaxLength));
        } else {
            // Reset to original max length when far from mouse
            particle.maxLength = particle.originalMaxLength;
        }
    }
}

const effect = new Effect(canvas, ctx);




function animate() {
    effect.render();
    requestAnimationFrame(animate);
}
animate();