# Interval Timer

A web-based interval timer application designed for workout sessions with customizable sets, work/rest periods, and audio cues.

## Features

- **Customizable Sets**: Create multiple exercise sets with different work times, rest times, and repetitions
- **Visual Timer**: Large, clear countdown display with phase indicators
- **Audio Cues**: Beeps to signal phase transitions (work/rest)
- **Progress Tracking**: Shows current rep and set progression
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes during intense workouts

## Usage

1. **Setup Your Workout**
   - Configure sets with work time, rest time, and number of repetitions
   - Add multiple sets for complex workout routines
   - Click "Add Set" to create additional exercise intervals

2. **Start Timer**
   - Click "Start Timer" to begin your workout
   - 5-second countdown prepares you for the first interval
   - Follow the visual and audio cues for work/rest phases

3. **Workout Phases**
   - **GET READY**: 5-second preparation countdown
   - **WORK**: Exercise period (red indicator)
   - **REST**: Recovery period (green indicator)

4. **Completion**
   - View completion screen when all sets are finished
   - Click "Start Over" to begin a new session

## Technical Details

- **Pure JavaScript**: No dependencies, runs in any modern browser
- **Web Audio API**: Generates audio cues without external files
- **CSS Variables**: Easy theme customization
- **Responsive Layout**: Flexbox-based design for all screen sizes

## File Structure

```
├── index.html    # Main application interface
├── script.js     # Timer logic and state management
├── style.css     # Styling and responsive design
└── README.md     # This file
```

## Browser Support

Requires a modern browser with support for:
- ES6 JavaScript
- CSS Grid/Flexbox
- Web Audio API

## Getting Started

1. Clone or download the repository
2. Open `index.html` in your web browser
3. No installation required - runs locally

## Customization

Easily modify colors by editing CSS variables in `style.css`:
- `--work-color`: Work phase indicator
- `--rest-color`: Rest phase indicator  
- `--ready-color`: Preparation phase color
- `--bg-color`: Background color