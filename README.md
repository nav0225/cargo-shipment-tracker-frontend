# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

```markdown
# Cargo Shipment Tracker - Frontend

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Redux](https://img.shields.io/badge/Redux-4.2.0-purple)
![Leaflet](https://img.shields.io/badge/Leaflet-1.8.0-green)
![Security](https://img.shields.io/badge/Security-AES--256-brightgreen)

A production-grade cargo shipment tracking system with real-time monitoring capabilities, built with modern web technologies and military-grade security.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Assumptions](#assumptions)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Real-Time Tracking**: Live shipment location updates with WebSocket integration
- **Interactive Maps**: Visualize routes with Leaflet.js and OpenStreetMap
- **Secure Dashboard**: Military-grade encrypted state management
- **Advanced Filtering**: Sort and filter shipments by status, location, and ETA
- **Responsive Design**: Optimized for desktop and mobile devices
- **Error Boundaries**: Graceful error handling and recovery

## Tech Stack
| Technology | Purpose |
|------------|---------|
| React 18 | Component-based UI |
| Redux Toolkit | State management |
| React Leaflet | Interactive maps |
| Formik & Yup | Form handling and validation |
| Axios | Secure API communication |
| WebSocket | Real-time updates |
| CryptoJS | Data encryption |
| Jest & React Testing Library | Testing framework |

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/nav0225/cargo-shipment-tracker-frontend.git
   cd cargo-shipment-tracker-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables (see Configuration section)

4. Start development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Configuration 🔧
Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# WebSocket Configuration
REACT_APP_WS_URL=ws://localhost:5000/ws/shipments  # wss:// in production
REACT_APP_WS_SECRET=77f855b184cc19dbfdca24d6fbfd968f61d3f61d8e067700132997b325451ee1

# Map Configuration
REACT_APP_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Security Configuration
REACT_APP_REDUX_SECRET=77f855b184cc19dbfdca24d6fbfd968f61d3f61d8e067700132997b325451ee1

# Development Flags
SKIP_PREFLIGHT_CHECK=true
```

## Development
### Running the Application
```bash
npm start
# or
yarn start
```

### Available Scripts
- `start`: Runs the app in development mode
- `build`: Creates a production build
- `test`: Runs all tests
- `lint`: Checks code quality with ESLint
- `format`: Formats code with Prettier

## Testing
Run the test suite:
```bash
npm test
# or
yarn test
```

Test coverage:
```bash
npm test -- --coverage
```

## Deployment
### Production Build
```bash
npm run build
# or
yarn build
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cargo-frontend .
docker run -p 3000:3000 cargo-frontend
```

## Security
### Implemented Features
- AES-256 encryption for persisted state
- XSS protection on all user inputs
- Content Security Policy (CSP) headers
- Secure WebSocket connections (wss://)
- Rate-limited API calls
- Input sanitization and validation

### Security Best Practices
- Environment variables for sensitive data
- Secure HTTP headers
- Error boundary components
- Encrypted local storage
- Regular dependency audits

## Assumptions
1. Backend API follows REST conventions
2. MongoDB is running locally on default port
3. WebSocket server is available at `/ws` endpoint
4. Basic authentication is sufficient for this scope
5. Leaflet map tiles are served from OpenStreetMap
6. All API responses follow a consistent structure

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request