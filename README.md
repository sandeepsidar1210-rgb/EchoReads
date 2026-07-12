# EchoReads

A full-stack digital book platform featuring a curated collection of literary works, enabling users to browse, purchase, and manage their book collection across web and mobile platforms.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- **📚 Book Discovery**: Browse and search an extensive catalog of books with detailed information
- **🔐 User Authentication**: Secure sign-in and account management with JWT authentication
- **🛒 Shopping Cart**: Add books to cart and manage selections before checkout
- **💳 Purchase Management**: Track and access purchased books with purchase history
- **📱 Multi-Platform**: Available on web and mobile (iOS/Android)
- **🔊 Text-to-Speech**: Mobile app includes TTS functionality for enhanced accessibility
- **⚙️ Admin Dashboard**: Administrative tools for book management and catalog updates
- **📖 Book Import**: Automated import scripts for populating the database with book data

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Environment**: dotenv for configuration management

### Frontend
- **Markup**: HTML5
- **Styling**: CSS
- **Scripting**: Vanilla JavaScript
- **API Communication**: Fetch API

### Mobile
- **Framework**: Flutter
- **Platforms**: iOS and Android
- **Features**: Text-to-Speech, native platform integration

## Project Structure

```
EchoReads/
├── backend/                          # Node.js Express API server
│   ├── server.js                    # Main server entry point
│   ├── db.js                        # Database connection configuration
│   ├── package.json                 # Backend dependencies
│   ├── config/
│   │   └── db.js                    # MongoDB connection setup
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # User model
│   │   ├── Book.js                  # Book model
│   │   ├── CartItem.js              # Shopping cart item model
│   │   └── Purchase.js              # Purchase history model
│   ├── routes/                      # API route handlers
│   │   ├── auth.js                  # Authentication routes
│   │   ├── books.js                 # Book management routes
│   │   ├── cart.js                  # Shopping cart routes
│   │   ├── purchases.js             # Purchase history routes
│   │   └── novia.js                 # Additional routes
│   └── scripts/                     # Utility scripts
│       ├── seed.js                  # Database seeding script
│       ├── seed_real.js             # Real book data seeding
│       └── import_gutenberg.js      # Import from Project Gutenberg
│
├── frontend/                         # Web application
│   ├── index.html                   # Home page
│   ├── browse.html                  # Book browsing page
│   ├── search.html                  # Search results page
│   ├── genres.html                  # Genre listing page
│   ├── signin.html                  # User login page
│   ├── cart.html                    # Shopping cart page
│   ├── checkout.html                # Checkout page
│   ├── purchases.html               # Purchase history page
│   ├── admin.html                   # Admin dashboard
│   ├── about.html                   # About page
│   ├── features.html                # Features page
│   ├── help.html                    # Help page
│   ├── faq.html                     # FAQ page
│   ├── contact.html                 # Contact page
│   ├── privacy.html                 # Privacy policy
│   ├── terms.html                   # Terms of service
│   ├── security.html                # Security information
│   ├── careers.html                 # Careers page
│   ├── press.html                   # Press kit
│   ├── menu.html                    # Navigation menu
│   ├── js/
│   │   └── main.js                  # Main frontend JavaScript
│   └── external.html                # External resources page
│
├── echoreads_mobile/                 # Flutter mobile application
│   ├── pubspec.yaml                 # Flutter dependencies
│   ├── lib/
│   │   ├── main.dart                # App entry point
│   │   ├── models/                  # Data models
│   │   ├── screens/                 # App screens
│   │   ├── services/                # API and device services
│   │   ├── widgets/                 # Reusable UI components
│   │   └── config/                  # App configuration
│   ├── android/                     # Android-specific code
│   ├── ios/                         # iOS-specific code
│   ├── web/                         # Web build assets
│   ├── windows/                     # Windows build setup
│   ├── linux/                       # Linux build setup
│   ├── macos/                       # macOS build setup
│   └── test/                        # Test files
│
├── package.json                     # Root-level dependencies
├── README.md                        # This file
└── Notes/                           # Project documentation
    └── prompt.txt                   # Project prompts and notes
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.4 or higher) - local installation or MongoDB Atlas account
- **Flutter** (v3.0.0 or higher) - for mobile development
- **Git** (v2.0 or higher)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/EchoReads.git
cd EchoReads
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

The frontend is a static web application with no build process required. Simply serve the `frontend/` directory using any HTTP server.

### 4. Mobile Setup (Optional)

```bash
cd echoreads_mobile
flutter pub get
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/echoreads
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Alternatively, update `backend/config.json`:

```json
{
  "port": 5000,
  "mongoURI": "mongodb://localhost:27017/echoreads",
  "jwtSecret": "your_jwt_secret_key_here"
}
```

### Database Setup

Start MongoDB:

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas - update connection string in config
```

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The API server will start on `http://localhost:5000`

### 2. Seed the Database (Optional)

```bash
# Basic seed with sample data
npm run seed

# Seed with real book data
npm run seed:real

# Import books from Project Gutenberg
npm run import:gutenberg
```

### 3. Serve the Frontend

Use any HTTP server to serve the `frontend/` directory:

```bash
# Using Python 3
cd frontend
python -m http.server 3000

# Using Node.js (npm http-server)
cd frontend
npx http-server -p 3000

# Using Live Server extension in VS Code
# Right-click index.html and select "Open with Live Server"
```

Access the application at `http://localhost:3000`

### 4. Run the Mobile App (Flutter)

```bash
cd echoreads_mobile

# iOS
flutter run -d ios

# Android
flutter run -d android

# Web
flutter run -d web
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `GET /api/books/genre/:genre` - Get books by genre
- `POST /api/books` - Create new book (admin only)
- `PUT /api/books/:id` - Update book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/:itemId` - Remove item from cart
- `PUT /api/cart/:itemId` - Update cart item quantity

### Purchases
- `GET /api/purchases` - Get user's purchase history
- `POST /api/purchases` - Create new purchase
- `GET /api/purchases/:id` - Get purchase details

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code style
- Test your changes before submitting a PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@echoreads.com or open an issue on GitHub.

## Acknowledgments

- Project Gutenberg for providing access to public domain books
- Flutter community for excellent documentation
- MongoDB for robust database solutions

