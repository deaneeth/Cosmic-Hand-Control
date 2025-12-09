# 🌌 Cosmic Hand Control

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-0.181.2-000000?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite)

**A 3D interactive playground where you control floating iridescent blocks using hand gestures via your webcam.** ✨

[Live Demo](#-getting-started) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🎮 Gesture Controls](#-gesture-controls)
- [🚀 Getting Started](#-getting-started)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🎨 How It Works](#-how-it-works)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

🎥 **Real-time Hand Tracking** - Powered by MediaPipe Hands AI model  
🎨 **Beautiful 3D Graphics** - Iridescent blocks with dynamic lighting  
👋 **Intuitive Gestures** - Control objects with natural hand movements  
🌟 **Particle Effects** - Explosive visual feedback on interactions  
⚡ **Smooth Performance** - Optimized rendering with Three.js and React Three Fiber  
📱 **Responsive Design** - Works seamlessly across different screen sizes  
🎭 **Real-time Gesture Recognition** - Instant response to hand gestures  

---

## 🎮 Gesture Controls

| Gesture | Icon | Action | Description |
|---------|------|--------|-------------|
| **Open Palm** | ✋ | Hover/Select | Move your hand to interact with blocks |
| **Pinch** | 🤏 | Grab/Move | Pinch thumb and index finger to grab and move blocks |
| **Fist** | ✊ | Explode | Make a fist to create explosive particle effects |
| **Thumbs Up** | 👍 | Duplicate | Thumbs up to duplicate blocks |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- 📦 **Node.js** (v16 or higher)
- 📦 **npm** or **yarn**
- 🎥 **Webcam** (required for hand tracking)
- 🌐 **Modern Browser** (Chrome, Edge, or Firefox recommended)

### Installation

1️⃣ **Clone the repository**

```bash
git clone https://github.com/deaneeth/Cosmic-Hand-Control.git
cd Cosmic-Hand-Control
```

2️⃣ **Install dependencies**

```bash
npm install
```

3️⃣ **Start the development server**

```bash
npm run dev
```

4️⃣ **Open your browser**

Navigate to `http://localhost:5173` (or the URL shown in your terminal)

5️⃣ **Allow camera permissions**

When prompted, grant camera access to enable hand tracking 📸

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

### Core Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=white) | UI Framework | 19.2.1 |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | Type Safety | 5.8.2 |
| ![Three.js](https://img.shields.io/badge/-Three.js-000000?logo=three.js&logoColor=white) | 3D Graphics | 0.181.2 |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) | Build Tool | 6.2.0 |

### Key Libraries

- 🎨 **@react-three/fiber** (9.4.2) - React renderer for Three.js
- 🔧 **@react-three/drei** (10.7.7) - Useful helpers for React Three Fiber
- 🤖 **@mediapipe/hands** (0.4.1675469240) - AI-powered hand tracking
- 🎭 **lucide-react** (0.555.0) - Beautiful icon library

---

## 📁 Project Structure

```
Cosmic-Hand-Control/
│
├── 📄 App.tsx                    # Main application component
├── 📄 index.tsx                  # Application entry point
├── 📄 types.ts                   # TypeScript type definitions
├── 📄 package.json               # Project dependencies
├── 📄 vite.config.ts             # Vite configuration
├── 📄 tsconfig.json              # TypeScript configuration
├── 📄 index.html                 # HTML template
├── 📄 metadata.json              # Project metadata
│
├── 📁 components/
│   ├── 🎥 HandTracker.tsx        # Webcam & MediaPipe integration
│   ├── 🎨 Scene3D.tsx            # Three.js 3D scene & physics
│   └── 🖥️ UIOverlay.tsx          # Gesture display & status UI
│
└── 📁 utils/
    └── 👋 gestureRecognition.ts  # Hand gesture detection logic
```

---

## 🎨 How It Works

### 🔄 Architecture Overview

```
┌─────────────────┐
│   👤 User Hand  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  📹 Webcam Feed │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 🤖 MediaPipe AI │ ◄── Hand landmark detection (21 points)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 👋 Gesture      │ ◄── Recognizes: Pinch, Fist, Open Palm, etc.
│   Recognition   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 🎮 3D Scene     │ ◄── Updates block positions, effects
│   Controller    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 🌌 Three.js     │ ◄── Renders beautiful 3D graphics
│   Renderer      │
└─────────────────┘
```

### 🧠 Gesture Recognition

The system uses **21 hand landmarks** detected by MediaPipe:

- **🤏 Pinch**: Distance between thumb tip (4) and index tip (8) < 0.05
- **✊ Fist**: All fingers curled close to wrist (0)
- **👍 Thumbs Up**: Thumb extended upward, other fingers curled
- **✋ Open Palm**: All fingers extended away from palm

### 🎯 Component Responsibilities

#### 🎥 **HandTracker**
- Manages webcam access
- Runs MediaPipe Hands model
- Detects 21 hand landmarks in real-time
- Identifies current gesture
- Sends hand data to parent components

#### 🎨 **Scene3D**
- Renders 3D environment with Three.js
- Manages floating iridescent blocks
- Handles physics simulations
- Creates particle effects
- Responds to gesture commands

#### 🖥️ **UIOverlay**
- Displays current gesture
- Shows system status
- Provides visual feedback
- Renders instructions

---

## 🎯 Performance Optimizations

✅ **Ref-based updates** - High-frequency hand data uses refs to avoid React re-renders  
✅ **Throttled UI updates** - Gesture state only updates when changed  
✅ **Efficient 3D rendering** - Uses React Three Fiber's optimized rendering pipeline  
✅ **WebGL acceleration** - Hardware-accelerated graphics via Three.js  
✅ **Lazy loading** - MediaPipe models loaded asynchronously  

---

## 🐛 Troubleshooting

### Camera Not Working?

1. ✅ Ensure browser has camera permissions
2. ✅ Check if another app is using your webcam
3. ✅ Try refreshing the page
4. ✅ Use HTTPS (required for camera access in production)

### Hand Not Detected?

1. ✅ Ensure good lighting
2. ✅ Keep hand within camera frame
3. ✅ Show palm facing camera
4. ✅ Maintain moderate distance (30-60cm)

### Performance Issues?

1. ✅ Close other browser tabs
2. ✅ Use a modern browser (Chrome recommended)
3. ✅ Ensure adequate GPU resources
4. ✅ Reduce number of blocks in scene

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place! Any contributions you make are **greatly appreciated**. 🙏

1. 🍴 Fork the Project
2. 🌿 Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the Branch (`git push origin feature/AmazingFeature`)
5. 🔀 Open a Pull Request

---

## 💡 Future Enhancements

- [ ] 🎵 Add sound effects for gestures
- [ ] 🎨 Customizable block colors and shapes
- [ ] 🏆 Achievement system for gesture combos
- [ ] 👥 Multi-hand support (two hands)
- [ ] 💾 Save and load block configurations
- [ ] 🎮 VR support
- [ ] 📱 Mobile support with AR
- [ ] 🌐 Multiplayer mode

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- 🤖 [MediaPipe](https://mediapipe.dev/) - For amazing hand tracking AI
- 🎨 [Three.js](https://threejs.org/) - For powerful 3D graphics
- ⚛️ [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - For React integration
- 🎭 [Lucide Icons](https://lucide.dev/) - For beautiful icons
- 💜 [Vite](https://vitejs.dev/) - For lightning-fast development

---

<div align="center">

**Made with ❤️ and ✨ by [deaneeth](https://github.com/deaneeth)**

⭐ Star this repo if you find it useful! ⭐

</div>
