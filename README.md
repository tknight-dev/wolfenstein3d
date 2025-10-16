# Wolfenstein3D

This project is a TypeScript re-write of the original MS-DOS version of _Id Software_'s _Wolfenstein3D_ (1992). I learned quite a bit about the old school raycaster techniques while coding this. I hope you find the code educational and the game fun. 😃

It features:

- A 2d raycast engine (no 3d / webgl here!)
- Multiplayer (supports upto 2 players)
- Multithreaded (WebWorkers)
- Powered by the [GamingCanvas](https://gaming-canvas.org) library

## Build

#### `Node.js` is required to build this app [nodejs.org](https://nodejs.org)

Output files from the build processes are stored in the `dist` directory

### All

- `npm i -g yarn` to download yarn
- `yarn install` to download the dependencies

### Dev

- `yarn dev` to watch for code changes and live-reload browser if changed

### Prod

- `yarn prod` to generate the optimized app
