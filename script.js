// PixiJS compatible implementation
// PIXI is already available globally from the CDN script

// Check if PIXI is available globally
if (typeof PIXI !== 'undefined') {
  console.log("Using global PIXI v" + PIXI.VERSION);
} else {
  console.error("PIXI not found globally - make sure the script tag is loaded first");
}

// Enhanced noise function for more dramatic movement
const createNoise = () => {
  return {
    noise2D: (x, y) => {
      // Combine multiple sine/cosine waves for more complex movement
      const wave1 = Math.sin(x * 0.02) * Math.cos(y * 0.02);
      const wave2 = Math.sin(x * 0.05) * Math.cos(y * 0.03) * 0.5;
      const wave3 = Math.sin(x * 0.03) * Math.cos(y * 0.05) * 0.3;
      return (wave1 + wave2 + wave3) * 0.8;
    }
  };
};

// Simple HSL to hex converter
const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Simple debounce function
const createDebounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// return a random number within a range
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// map a number from 1 range to another
function map(n, start1, end1, start2, end2) {
  return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
}

// Create a noise instance
const simplex = createNoise();

// ColorPalette class
class ColorPalette {
  constructor() {
    this.setColors();
    this.setCustomProperties();
  }

  setColors() {
    // pick a random hue somewhere between 220 and 360
    this.hue = ~~random(220, 360);
    this.complimentaryHue1 = this.hue + 30;
    this.complimentaryHue2 = this.hue + 60;
    // define a fixed saturation and lightness
    this.saturation = 95;
    this.lightness = 50;

    // define a base color
    this.baseColor = hslToHex(this.hue, this.saturation, this.lightness);
    // define a complimentary color, 30 degrees away from the base
    this.complimentaryColor1 = hslToHex(
      this.complimentaryHue1,
      this.saturation,
      this.lightness
    );
    // define a second complimentary color, 60 degrees away from the base
    this.complimentaryColor2 = hslToHex(
      this.complimentaryHue2,
      this.saturation,
      this.lightness
    );

    // store the color choices in an array so that a random one can be picked later
    this.colorChoices = [
      this.baseColor,
      this.complimentaryColor1,
      this.complimentaryColor2
    ];
  }

  randomColor() {
    // pick a random color
    return this.colorChoices[~~random(0, this.colorChoices.length)].replace(
      "#",
      "0x"
    );
  }

  setCustomProperties() {
    // set CSS custom properties so that the colors defined here can be used throughout the UI
    document.documentElement.style.setProperty("--hue", this.hue);
    document.documentElement.style.setProperty(
      "--hue-complimentary1",
      this.complimentaryHue1
    );
    document.documentElement.style.setProperty(
      "--hue-complimentary2",
      this.complimentaryHue2
    );
  }
}

// Orb class with improved animation parameters
class Orb {
  constructor(fill = 0x000000) {
    // bounds = the area an orb is "allowed" to move within
    this.bounds = this.setBounds();
    // initialise the orb's { x, y } values to a random point within it's bounds
    this.x = random(this.bounds["x"].min, this.bounds["x"].max);
    this.y = random(this.bounds["y"].min, this.bounds["y"].max);

    // how large the orb is vs it's original radius (this will modulate over time)
    this.scale = 1;

    // what color is the orb?
    this.fill = fill;

    // the original radius of the orb, set relative to window height - made much larger for visibility
    this.radius = random(window.innerHeight / 4, window.innerHeight / 2);

    // starting points in "time" for the noise/self similar random values
    this.xOff = random(0, 1000);
    this.yOff = random(0, 1000);
    // how quickly the noise/self similar random values step through time - increased for more movement
    this.inc = 0.015;

    // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
    this.graphics = new PIXI.Graphics();
    this.graphics.alpha = 0.4; // Better visibility while maintaining blending

    // 250ms after the last window resize event, recalculate orb positions.
    window.addEventListener(
      "resize",
      createDebounce(() => {
        this.bounds = this.setBounds();
      }, 250)
    );
  }

  setBounds() {
    // how far from the { x, y } origin can each orb move - increased for more coverage
    const maxDist =
      window.innerWidth < 1000 ? window.innerWidth / 2 : window.innerWidth / 2.5;
    // the { x, y } origin for each orb - moved more toward center for better visibility
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    // allow each orb to move x distance away from it's x / y origin
    return {
      x: {
        min: originX - maxDist,
        max: originX + maxDist
      },
      y: {
        min: originY - maxDist,
        max: originY + maxDist
      }
    };
  }

  update() {
    // Fixed noise implementation for smoother animations
    // Use different noise coordinates for x and y for more natural movement
    const xNoise = simplex.noise2D(this.xOff, 0);
    const yNoise = simplex.noise2D(0, this.yOff);
    const scaleNoise = simplex.noise2D(this.xOff * 0.5, this.yOff * 0.5);

    // map the xNoise/yNoise values (between -1 and 1) to a point within the orb's bounds
    this.x = map(xNoise, -1, 1, this.bounds["x"].min, this.bounds["x"].max);
    this.y = map(yNoise, -1, 1, this.bounds["y"].min, this.bounds["y"].max);
    // map scaleNoise (between -1 and 1) to a scale value for more dramatic size changes
    this.scale = map(scaleNoise, -1, 1, 0.7, 1.4);

    // step through "time"
    this.xOff += this.inc;
    this.yOff += this.inc;
  }

  render() {
    // update the PIXI.Graphics position and scale values
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    this.graphics.scale.set(this.scale);

    // clear anything currently drawn to graphics
    this.graphics.clear();

    // Use the traditional PIXI graphics API that works across versions
    this.graphics.beginFill(this.fill);
    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();
  }
}

// Initialize app with error handling
let app;
let orbs = [];
let colorPalette;

async function initializeApp() {
  try {
    // Check if PIXI is available
    if (typeof PIXI === 'undefined') {
      console.error("PIXI is not available. Make sure to include the PIXI.js script tag.");
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    const canvas = document.querySelector(".orb-canvas");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    console.log("Initializing PIXI Application...");

    // Create PixiJS app - compatible with both v6 and v8
    if (PIXI.Application.prototype.init) {
      // v8.x way
      app = new PIXI.Application();
      await app.init({
        canvas: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window
      });
    } else {
      // v6.x way
      app = new PIXI.Application({
        view: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window
      });
    }

    console.log("PIXI Application created successfully");

    // Apply blur filter with error handling (skip if not available)
    try {
      if (PIXI.BlurFilter) {
        const filter = new PIXI.BlurFilter(10, 8);
        app.stage.filters = [filter];
        console.log("Blur filter applied successfully");
      } else {
        console.log("Blur filter not available, continuing without it");
      }
    } catch (error) {
      console.warn("Could not apply blur filter:", error);
    }

    // Create colour palette
    colorPalette = new ColorPalette();
    console.log("Color palette created");

    // Create orbs
    for (let i = 0; i < 8; i++) {
      const orb = new Orb(colorPalette.randomColor());
      app.stage.addChild(orb.graphics);
      orbs.push(orb);
    }

    console.log(`Created ${orbs.length} orbs`);

    // Improved animation loop with error handling and performance optimization
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      app.ticker.add(() => {
        try {
          orbs.forEach((orb) => {
            orb.update();
            orb.render();
          });
        } catch (error) {
          console.error("Animation error:", error);
        }
      });
      console.log("Animation loop started");
    } else {
      // Render static version for users who prefer reduced motion
      orbs.forEach((orb) => {
        orb.update();
        orb.render();
      });
      console.log("Static render applied (reduced motion)");
    }

    // Color change button event listener
    const colorButton = document.querySelector(".overlay__btn--colors");
    if (colorButton) {
      colorButton.addEventListener("click", () => {
        try {
          colorPalette.setColors();
          colorPalette.setCustomProperties();

          orbs.forEach((orb) => {
            orb.fill = colorPalette.randomColor();
          });
          console.log("Colors changed");
        } catch (error) {
          console.error("Color change error:", error);
        }
      });
    }

    console.log("PIXI initialization complete");

  } catch (error) {
    console.error("Failed to initialize PIXI application:", error);
    // Hide the canvas if initialization fails
    const canvas = document.querySelector(".orb-canvas");
    if (canvas) {
      canvas.style.display = "none";
    }
  }
}

// Contact button functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing app...");
  
  // Initialize the PIXI app
  initializeApp();

  // Setup contact button
  const contactButton = document.getElementById("contactBtn");
  if (contactButton) {
    contactButton.addEventListener("click", function () {
      const emailAddress = "a@jlisten.com";
      const subject = "Inquiry from JListen Website";
      const body = "Hello,\n\nI would like to inquire about...";
      const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.location.href = mailtoLink;
    });
  }
});

// Cleanup function for when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy(true, true);
  }
}); 