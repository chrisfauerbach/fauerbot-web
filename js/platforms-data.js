// Generated from src/fauerbot_robot/robots/*.yaml by scripts/platforms_page.py. Do not edit.
window.FAUERBOT_PLATFORMS = {
 "ion": {
  "name": "ion",
  "title": "Ion",
  "accent": "#d9500c",
  "x_min": -0.12,
  "x_max": 0.49,
  "half_width": 0.3,
  "height": 0.35,
  "deck": {
   "x": 0.19,
   "length": 0.6,
   "width": 0.42,
   "z": 0.2,
   "height": 0.2
  },
  "mast": null,
  "solar": null,
  "drive": {
   "type": "differential",
   "wheel_radius": 0.12,
   "wheel_width": 0.06,
   "track": 0.5,
   "wheels_x": [
    0.0
   ],
   "casters": [
    [
     0.38,
     0.0
    ]
   ],
   "caster_radius": 0.05
  },
  "blades": [
   {
    "x": 0.19,
    "y": 0.0,
    "diameter": 0.36
   }
  ],
  "sensors": {
   "lidar2d": {
    "x": 0.47,
    "y": 0.0,
    "z": 0.15,
    "pitch_deg": 0.0
   },
   "lidar3d": {
    "x": 0.4,
    "y": 0.0,
    "z": 0.3,
    "pitch_deg": 0.0
   },
   "gnss": {
    "x": 0.19,
    "y": 0.0,
    "z": 0.42,
    "pitch_deg": 0.0
   },
   "imu": {
    "x": 0.19,
    "y": 0.0,
    "z": 0.22,
    "pitch_deg": 0.0
   },
   "camera": {
    "x": 0.46,
    "y": 0.0,
    "z": 0.32,
    "pitch_deg": 8
   }
  }
 },
 "quark": {
  "name": "quark",
  "title": "Quark",
  "accent": "#8bbf2a",
  "x_min": -0.08,
  "x_max": 0.38,
  "half_width": 0.21,
  "height": 0.3,
  "deck": {
   "x": 0.15,
   "length": 0.46,
   "width": 0.3,
   "z": 0.14,
   "height": 0.12
  },
  "mast": null,
  "solar": null,
  "drive": {
   "type": "differential",
   "wheel_radius": 0.08,
   "wheel_width": 0.05,
   "track": 0.36,
   "wheels_x": [
    0.0
   ],
   "casters": [
    [
     0.3,
     0.0
    ]
   ],
   "caster_radius": 0.035
  },
  "blades": [
   {
    "x": 0.15,
    "y": 0.0,
    "diameter": 0.24
   }
  ],
  "sensors": {
   "lidar2d": {
    "x": 0.37,
    "y": 0.0,
    "z": 0.12,
    "pitch_deg": 0.0
   },
   "lidar3d": {
    "x": 0.3,
    "y": 0.0,
    "z": 0.27,
    "pitch_deg": 0.0
   },
   "gnss": {
    "x": 0.15,
    "y": 0.0,
    "z": 0.33,
    "pitch_deg": 0.0
   },
   "imu": {
    "x": 0.15,
    "y": 0.0,
    "z": 0.14,
    "pitch_deg": 0.0
   },
   "camera": {
    "x": 0.36,
    "y": 0.0,
    "z": 0.22,
    "pitch_deg": 14.3
   }
  }
 },
 "photon": {
  "name": "photon",
  "title": "Photon",
  "accent": "#e0a400",
  "x_min": -0.12,
  "x_max": 0.49,
  "half_width": 0.3,
  "height": 1.15,
  "deck": {
   "x": 0.19,
   "length": 0.6,
   "width": 0.42,
   "z": 0.2,
   "height": 0.2
  },
  "mast": {
   "x": 0.25,
   "height": 1.1
  },
  "solar": {
   "x": 0.19,
   "z": 0.32,
   "length": 0.55,
   "width": 0.4
  },
  "drive": {
   "type": "differential",
   "wheel_radius": 0.12,
   "wheel_width": 0.06,
   "track": 0.5,
   "wheels_x": [
    0.0
   ],
   "casters": [
    [
     0.38,
     0.0
    ]
   ],
   "caster_radius": 0.05
  },
  "blades": [
   {
    "x": 0.19,
    "y": 0.0,
    "diameter": 0.36
   }
  ],
  "sensors": {
   "lidar2d": {
    "x": 0.47,
    "y": 0.0,
    "z": 0.15,
    "pitch_deg": 0.0
   },
   "lidar3d": {
    "x": 0.25,
    "y": 0.0,
    "z": 1.0,
    "pitch_deg": 30
   },
   "gnss": {
    "x": 0.25,
    "y": 0.0,
    "z": 1.15,
    "pitch_deg": 0.0
   },
   "imu": {
    "x": 0.19,
    "y": 0.0,
    "z": 0.22,
    "pitch_deg": 0.0
   },
   "camera": {
    "x": 0.27,
    "y": 0.0,
    "z": 0.95,
    "pitch_deg": 25
   }
  }
 },
 "vector": {
  "name": "vector",
  "title": "Vector",
  "accent": "#1c9c8f",
  "x_min": -0.4,
  "x_max": 0.42,
  "half_width": 0.37,
  "height": 0.42,
  "deck": {
   "x": 0.01,
   "length": 0.82,
   "width": 0.5,
   "z": 0.27,
   "height": 0.18
  },
  "mast": null,
  "solar": null,
  "drive": {
   "type": "skid",
   "wheel_radius": 0.13,
   "wheel_width": 0.1,
   "track": 0.62,
   "wheels_x": [
    -0.24,
    0.24
   ],
   "casters": [],
   "caster_radius": 0.05
  },
  "blades": [
   {
    "x": 0.0,
    "y": 0.0,
    "diameter": 0.46
   }
  ],
  "sensors": {
   "lidar2d": {
    "x": 0.41,
    "y": 0.0,
    "z": 0.16,
    "pitch_deg": 0.0
   },
   "lidar3d": {
    "x": 0.36,
    "y": 0.0,
    "z": 0.42,
    "pitch_deg": 0.0
   },
   "gnss": {
    "x": 0.0,
    "y": 0.0,
    "z": 0.52,
    "pitch_deg": 0.0
   },
   "imu": {
    "x": 0.0,
    "y": 0.0,
    "z": 0.24,
    "pitch_deg": 0.0
   },
   "camera": {
    "x": 0.4,
    "y": 0.0,
    "z": 0.38,
    "pitch_deg": 14.3
   }
  }
 },
 "graviton": {
  "name": "graviton",
  "title": "Graviton",
  "accent": "#6b7a3a",
  "x_min": -0.43,
  "x_max": 0.43,
  "half_width": 0.38,
  "height": 0.45,
  "deck": {
   "x": 0.0,
   "length": 0.8,
   "width": 0.44,
   "z": 0.27,
   "height": 0.18
  },
  "mast": null,
  "solar": null,
  "drive": {
   "type": "tracked",
   "wheel_radius": 0.09,
   "wheel_width": 0.14,
   "track": 0.6,
   "wheels_x": [
    -0.3,
    0.0,
    0.3
   ],
   "casters": [],
   "caster_radius": 0.05
  },
  "blades": [
   {
    "x": 0.0,
    "y": 0.0,
    "diameter": 0.46
   }
  ],
  "sensors": {
   "lidar2d": {
    "x": 0.42,
    "y": 0.0,
    "z": 0.16,
    "pitch_deg": 0.0
   },
   "lidar3d": {
    "x": 0.38,
    "y": 0.0,
    "z": 0.45,
    "pitch_deg": 0.0
   },
   "gnss": {
    "x": 0.0,
    "y": 0.0,
    "z": 0.55,
    "pitch_deg": 0.0
   },
   "imu": {
    "x": 0.0,
    "y": 0.0,
    "z": 0.24,
    "pitch_deg": 0.0
   },
   "camera": {
    "x": 0.42,
    "y": 0.0,
    "z": 0.4,
    "pitch_deg": 14.3
   }
  }
 },
 "tachyon": {
  "name": "tachyon",
  "title": "Tachyon",
  "accent": "#7b4fd6",
  "x_min": -0.15,
  "x_max": 0.8,
  "half_width": 0.5,
  "height": 0.4,
  "deck": {
   "x": 0.325,
   "length": 0.95,
   "width": 0.8,
   "z": 0.25,
   "height": 0.18
  },
  "mast": null,
  "solar": null,
  "drive": {
   "type": "differential",
   "wheel_radius": 0.16,
   "wheel_width": 0.07,
   "track": 0.86,
   "wheels_x": [
    0.0
   ],
   "casters": [
    [
     0.7,
     0.3
    ],
    [
     0.7,
     -0.3
    ]
   ],
   "caster_radius": 0.06
  },
  "blades": [
   {
    "x": 0.38,
    "y": 0.17,
    "diameter": 0.36
   },
   {
    "x": 0.38,
    "y": -0.17,
    "diameter": 0.36
   }
  ],
  "sensors": {
   "lidar2d": {
    "x": 0.79,
    "y": 0.0,
    "z": 0.16,
    "pitch_deg": 0.0
   },
   "lidar3d": {
    "x": 0.74,
    "y": 0.0,
    "z": 0.4,
    "pitch_deg": 0.0
   },
   "gnss": {
    "x": 0.32,
    "y": 0.0,
    "z": 0.5,
    "pitch_deg": 0.0
   },
   "imu": {
    "x": 0.32,
    "y": 0.0,
    "z": 0.24,
    "pitch_deg": 0.0
   },
   "camera": {
    "x": 0.78,
    "y": 0.0,
    "z": 0.36,
    "pitch_deg": 14.3
   }
  }
 }
};
