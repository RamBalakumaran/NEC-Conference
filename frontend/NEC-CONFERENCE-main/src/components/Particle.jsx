import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

export default function Particle() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = (container) => {
  };

  const fireParticleConfig = {
    particles: {
      number: {
        value: 40, 
        density: {
          enable: true,
          value_area: 800
        }
      },
      color: {
        value: [
          "#8A2BE2", 
          "#9400D3",
          "#ff00ff",
          "#BA55D3",
          "#FF00FF" 
        ]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: 0.8, 
        random: true,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.2,
          sync: false
        }
      },
      size: {
        value: 6, 
        random: true,
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.8,
          sync: false
        }
      },
      links: {
        enable: true,
        distance: 180, 
        color: "#6A0DAD", 
        opacity: 0.4, 
        width: 1.2 
      },
      move: {
        enable: true,
        speed: 4, 
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "bounce"
        },
        attract: {
          enable: true,
          rotateX: 800,
          rotateY: 1500
        }
      },
      life: {
        duration: {
          sync: false,
          value: 20 
        },
        count: 1,
        delay: {
          random: {
            enable: true,
            minimumValue: 0.2
          }
        }
      }
    },
    interactivity: {
      detectsOn: "window",
      events: {
        onHover: {
          enable: true,
          mode: "repulse"
        },
        onClick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        repulse: {
          distance: 150,
          duration: 0.6
        },
        push: {
          quantity: 2 
        }
      }
    },
    background: {
    },
    fullScreen: {
      enable: false, // Changed to false so we can control it with the div wrapper
      zIndex: -1
    },
    detectRetina: true,
    emitters: {
      direction: "top",
      rate: {
        quantity: 1, 
        delay: 0.2
      },
      size: {
        width: 100, 
        height: 10
      },
      position: {
        x: 50,
        y: 100
      },
      life: {
        duration: 0.2, 
        count: 1
      }
    }
  };

  return (
    // FIX IS HERE: zIndex 0 and pointerEvents none allows clicks to pass through
    <div className="fixed inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={fireParticleConfig}
          className="!z-[-1]"
        />
      )}
    </div>
  );
}