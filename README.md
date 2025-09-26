# Resonance Rooms

_A multi-user, real-time audio/visual collaboration experience using [Supabase Realtime](https://supabase.com/docs/guides/realtime), WebGL, and Web Audio APIs._

## ✨ Features

- **Real-time Collaboration**: Multiple users can join rooms and see each other's cursors in real-time
- **Generative Audio**: Cursor positions drive bytecode-based audio synthesis with customizable parameters
- **Visual Effects**: WebGL-powered visual feedback that responds to user interactions
- **Audio Controls**:
  - Envelope controls (_attack/release with adjustable trigger rates - disable for 'wall of noise'_)
  - Low-pass filtering with frequency control
  - Reverb with decay and wetness parameters
  - Volume control
- **Cursor Lock**: Lock cursor position to keep it in a particular X/Y position.
- **LFO Automation**: Automate cursor movement with sine, sawtooth, square, triangle, and noise waveforms (_available when cursor is locked_)
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (18+ recommended)
- A Supabase project with Realtime enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd resonance-rooms
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_PUBLISHABLE_KEY=<your_supabase_publishable_key>
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## 🎮 How to Use

1. **Join a Room**: Enter a room code or create a new room
2. **Move Your Cursor**: Your cursor position generates audio and visual effects
3. **Lock Cursor**: Press Space to lock your cursor position and enable LFO automation
4. **Audio Controls**: Use the panel on the right to adjust audio parameters
5. **LFO Controls**: When cursor is locked, use LFO controls to automate movement
6. **Viewer Mode**: Toggle viewer mode to observe without contributing to the audio

### Controls

- **Space**: Lock/unlock cursor position
- **L**: Toggle LFO automation (when cursor is locked)
- **Audio Panel**: Adjust volume, envelope, filter, and reverb settings

## 🛠️ Technology Stack

- **Frontend**: React 19.1+ with TypeScript
- **Build Tool**: Vite with SWC plugin for fast refresh
- **Backend**: Supabase (real-time database and broadcasting)
- **Graphics**: WebGL for visual effects
- **Audio**: Web Audio API for generative audio synthesis
- **Styling**: CSS with responsive design

## 🏗️ Architecture

### Core Components

- **App.tsx**: Main application with WebGL rendering and Supabase client setup
- **AudioControls.tsx**: Audio parameter controls and status display
- **RoomSelector.tsx**: Room joining/creation interface
- **useAudio.ts**: Audio synthesis and Web Audio API management
- **useCursor.ts**: Cursor tracking, LFO automation, and interaction handling
- **useRoom.ts**: Supabase realtime room management

### Real-time Features

- Uses Supabase Realtime channels with broadcast configuration
- Broadcasts cursor positions at ~20Hz for smooth real-time updates
- Supports up to 10 simultaneous participants per room
- Automatic participant/viewer distinction

## 🔧 Configuration

The project uses a multi-config TypeScript setup:
- `tsconfig.json` - Root configuration with project references
- `tsconfig.app.json` - Application-specific config with strict typing
- `tsconfig.node.json` - Node.js/build tooling configuration

ESLint is configured with modern flat config supporting TypeScript, React Hooks, and React Refresh.

## 🎵 Audio Engine

The audio engine generates sound using bytecode formulas based on user cursor positions:

```javascript
// Example bytecode formula
const formula = (t * x) & (t >> (y + (x % 32)));
```

Where `t` is time, and `x`, `y` are cursor coordinates. Multiple users create polyphonic textures.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to ensure code quality
5. Submit a pull request

## 📝 License

This project is experimental and provided as-is for educational and creative purposes.
