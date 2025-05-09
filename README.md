# BookVerse

BookVerse is a book management application designed to provide users with an interactive platform to discover, rate, and manage their book collections. It offers a personalized experience by allowing users to engage with books across different genres, create their own personal libraries, and participate in book clubs.

## Features

- **User Authentication**: Secure registration and login system
- **Genre-based Book Clubs**: Browse and join different book genres acting as clubs
- **Book Rating System**: Rate books on a scale of 1 to 5 and view community feedback
- **Wishlist Management**: Save books to read later and easily remove them
- **Book Details**: View comprehensive information about each book
- **User Profiles**: Access personal information and manage account details

## Features and Screenshots

The application includes multiple screens:

### 1. User Authentication
- Registration page for new users
- Login page with email and password
- JWT-based authentication system
  <img width="341" alt="Picture 1" src="https://github.com/user-attachments/assets/b11f46f2-5cc0-4b84-b2e0-d4af415e3b9e" />

### 2. Dashboard
- Main interface showing available book clubs (genres)
- Navigation bar with links to Book Clubs, Wishlist, and Profile
  ![Picture 2](https://github.com/user-attachments/assets/51b0378d-de74-4550-ab05-ff3dd966fcbd)

### 3. Book Clubs (Genres)
- Display of all available genres
- Option to view books within each genre or join a club
<img width="468" alt="Picture 3" src="https://github.com/user-attachments/assets/8f2bcd76-bd9f-4fe9-ade0-4bee1f30dab5" />

### 4. Book Listings
- Books displayed by genre with cover images
- Options to view details or add to wishlist
![Picture 4](https://github.com/user-attachments/assets/865c3aad-960d-4865-94a2-f080450f2c71)

### 5. Book Details
- Comprehensive view of book information including:
  - Cover image
  - Title and author
  - Genre
  - Description
  - Rating system
  - Add to wishlist functionality
<img width="276" alt="Picture 5" src="https://github.com/user-attachments/assets/155df69f-e08c-4339-a99e-9b6eaf2dd900" />

### 6. Rating System
- Rate books on a scale of 1 to 5 stars
- View average ratings and number of ratings
- See individual user ratings
![Picture 6](https://github.com/user-attachments/assets/a7facfc4-8100-41a3-a17d-b971cde4651d)

### 7. Wishlist
- Add books to personal wishlist
- Remove books from wishlist
- View all saved books in one place
<img width="427" alt="Picture 9" src="https://github.com/user-attachments/assets/f9ddfdfe-20eb-4d63-828e-009d5603b75b" />

### 8. User Profile
- View personal account information
- Username and email display
<img width="468" alt="Picture 11" src="https://github.com/user-attachments/assets/796583f5-0ed6-4d43-8845-f92f073e9617" />

## Technology Stack

### Frontend
- **React**: JavaScript library for building the user interface
- **React Router**: For handling navigation between different components
- **CSS**: For styling components and making the UI responsive
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework (based on the tailwind.config.js file)

### Backend
- **Node.js**: JavaScript runtime for the server-side application
- **Express.js**: Web framework for handling HTTP requests and routing
- **MongoDB**: NoSQL database for storing application data
- **JWT**: For secure authentication
- **Mongoose**: MongoDB object modeling for Node.js

### Tools Used
- **Postman**: For API testing during development
- **MongoDB Compass**: GUI tool for interacting with the MongoDB database
- **ESLint**: For code linting and maintaining code quality

## Architecture

### Frontend Components
- **Club List**: Displays all books in a genre
- **Book Detail**: Shows detailed information about a book
- **User Profile**: Displays user-specific data
- **Wishlist**: Manages saved books

### Backend Collections
- **Books**: Stores details of each book (title, author, ratings, description, genre)
- **Users**: Manages user information and authentication
- **Genres**: Contains predefined book categories/clubs
- **Wishlists**: Tracks books saved by users

## API Endpoints

### User Routes
- `POST /api/signup` - Register a new user
- `POST /api/login` - Authenticate a user and get JWT token
- `GET /api/profile` - Get logged-in user profile data

### Genre Routes
- `GET /api/genres` - Get all available genres/book clubs
- `GET /api/genres/:id` - Get details of a specific genre with its books

### Book Routes
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get details of a specific book
- `POST /api/books/:id/rate` - Rate a book
- `POST /api/books/add` - Add a new book to a genre

### Wishlist Routes
- `GET /api/wishlist` - Get logged-in user's wishlist
- `POST /api/wishlist/add/:bookId` - Add a book to wishlist
- `DELETE /api/wishlist/remove/:bookId` - Remove a book from wishlist

## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running

### Project Structure

```
Semester Project WT/
├── client/               # Frontend (React)
│   └── src/
│       ├── assets/       # Static files
│       ├── components/   # React components
│       │   ├── Auth.jsx
│       │   ├── BookDetail.jsx
│       │   ├── Clubs.jsx
│       │   ├── Navbar.jsx
│       │   └── Wishlist.jsx
│       ├── App.jsx       # Main application component
│       └── main.jsx      # Entry point
│
├── server/               # Backend (Node.js/Express)
│   ├── Bookverse/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   └── routes/       # API routes
│   └── app.js            # Express application setup
│
└── database/             # Database JSON files
    ├── BOOKVERSE.books.json
    ├── BOOKVERSE.genres.json
    ├── BOOKVERSE.users.json
    └── BOOKVERSE.wishlists.json
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Romaisa-Munir/WebTechSemProject.git
   cd WebTechSemProject
   ```

2. Install dependencies for frontend
   ```
   cd client
   npm install
   ```

3. Install dependencies for backend
   ```
   cd ../server/Bookverse
   npm install
   ```

4. Set up environment variables
   - Create a `.env` file in the server/Bookverse directory
   - Add your MongoDB connection string and JWT secret:
     ```
     MONGODB_URI=mongodb://localhost:27017/bookverse
     # For a local MongoDB instance, use something like above
     
     JWT_SECRET=your_random_secret_string
     # This can be any string you choose, for example: "bookverse_secret_key_123"
     ```

5. Start the backend server
   ```
   cd ../server
   node app.js
   ```

6. Start the frontend development server (in a new terminal)
   ```
   cd client
   npm run dev # If using Vite
   # or
   npm start # If using create-react-app
   ```

7. Open your browser and navigate to `http://localhost:5173` (for Vite) or `http://localhost:3000` (for create-react-app)

## Contributors

- **Romaisa Munir** (@Romaisa-Munir): Client-side implementation, project structure
- **Warda Khan** ([@wardakhan0101](https://github.com/wardakhan0101)): Database and server implementation

## Acknowledgements

- Instructor: Sadia Maqbol
- This project was created as an End Semester Project

## License

This project is for educational purposes.

- [GitHub Repository](https://github.com/Romaisa-Munir/WebTechSemProject)
