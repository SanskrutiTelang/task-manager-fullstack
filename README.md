# 📋 Task Manager - Full-Stack Web Application

A modern, full-stack task management application with user authentication, real-time updates, and a beautiful responsive interface.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)

## ✨ Features

### 🔐 **Authentication & Security**
- User registration and login with JWT
- Password hashing with bcrypt
- Token-based authentication
- Protected API routes
- Secure session management

### 📝 **Task Management**
- Create, read, update, and delete tasks
- Task status tracking (To Do, In Progress, Done)
- Priority levels (Low, Medium, High)
- Task descriptions and details
- Real-time task updates

### 🎨 **User Interface**
- Beautiful, modern design
- Responsive layout (mobile-friendly)
- Intuitive navigation
- Color-coded status badges
- Interactive task cards
- Smooth animations

### 🚀 **Performance**
- RESTful API architecture
- MongoDB for fast data access
- Efficient data validation
- Optimized queries

## 🛠️ Tech Stack

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Socket.IO** - Real-time communication
- **Joi** - Data validation

### **Frontend**
- **HTML5** - Markup language
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Fetch API** - HTTP requests

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/MARAMPELLYAKHILESH/task-manager-fullstack.git
cd task-manager-fullstack
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/taskmanager

# JWT Secrets (Change these to random strings!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_too

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Optional: Redis (for caching)
REDIS_URL=redis://localhost:6379
```

4. **Start MongoDB**

**Local MongoDB:**
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string
- Update `MONGODB_URI` in `.env`

5. **Run the application**

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

6. **Open the web interface**

Open `task_manager_COMPLETE.html` in your browser.

## 🚀 Usage

### 1. **Register a New Account**
- Open the web interface
- Click "Register" tab
- Enter username, email, and password
- Click "Create Account"

### 2. **Login**
- Go to "Login" tab
- Enter your email and password
- Click "Login"
- You'll receive an authentication token

### 3. **Create Tasks**
- Click "Create Task" tab
- Fill in task details:
  - Title (required)
  - Description
  - Status (To Do, In Progress, Done)
  - Priority (Low, Medium, High)
- Click "Create Task"

### 4. **View Tasks**
- Click "View Tasks" tab
- Click "🔄 Refresh Tasks"
- See all your tasks in beautiful cards

### 5. **Manage Tasks**
- Update task status
- Edit task details
- Delete completed tasks

## 📊 Project Structure

```
task-manager/
├── models/
│   ├── User.js              # User schema and model
│   ├── Task.js              # Task schema and model
│   └── Project.js           # Project schema (optional feature)
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── tasks.js             # Task CRUD routes
│   ├── projects.js          # Project routes
│   └── users.js             # User management routes
├── middleware/
│   └── auth.js              # JWT verification middleware
├── server.js                # Main application entry point
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not in repo)
├── .gitignore               # Git ignore file
├── task_manager_COMPLETE.html  # Web interface
└── README.md                # This file
```

## 🔌 API Endpoints

### **Authentication**
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
POST   /api/auth/refresh     - Refresh access token
POST   /api/auth/logout      - Logout user
GET    /api/auth/me          - Get current user
```

### **Tasks**
```
GET    /api/tasks            - Get all tasks (with filters)
POST   /api/tasks            - Create new task
GET    /api/tasks/:id        - Get specific task
PATCH  /api/tasks/:id        - Update task
DELETE /api/tasks/:id        - Delete task
```

### **Projects** (Optional Feature)
```
GET    /api/projects         - Get all projects
POST   /api/projects         - Create project
GET    /api/projects/:id     - Get specific project
PATCH  /api/projects/:id     - Update project
DELETE /api/projects/:id     - Delete project
```

### **Users**
```
GET    /api/users            - Get all users (admin)
GET    /api/users/:id        - Get specific user
PATCH  /api/users/:id        - Update user profile
DELETE /api/users/:id        - Delete user account
```

## 📝 API Request Examples

### **Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### **Create Task**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive README",
    "status": "in-progress",
    "priority": "high"
  }'
```

### **Get All Tasks**
```bash
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

### **Manual Testing**
Use the included `task_manager_COMPLETE.html` interface for interactive testing.

### **API Testing with curl**
See API Request Examples above.

### **API Testing with Postman**
1. Import the API endpoints into Postman
2. Set up environment variables for `base_url` and `token`
3. Test each endpoint

## 🔐 Security Features

- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Protected Routes** - Middleware authentication
- ✅ **Input Validation** - Joi schema validation
- ✅ **CORS Configuration** - Controlled cross-origin access
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **Error Handling** - Secure error messages

## 🐛 Troubleshooting

### **MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB is running: `mongosh` (should connect)
- Check `MONGODB_URI` in `.env` file
- For Windows: `net start MongoDB`
- For Mac: `brew services start mongodb-community`

### **Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env file
```

### **JWT Token Expired**
```
Error: 401 Unauthorized - Token expired
```
**Solution:**
- Logout and login again to get a fresh token
- Adjust token expiration in `routes/auth.js` if needed

### **Module Not Found**
```
Error: Cannot find module 'express'
```
**Solution:**
```bash
npm install
```

## 🌐 Deployment

### **Deploy to Heroku**

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku app**
```bash
heroku create task-manager-app
```

4. **Add MongoDB Atlas**
- Use MongoDB Atlas (cloud database)
- Update `MONGODB_URI` config var

5. **Set environment variables**
```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_atlas_uri
```

6. **Deploy**
```bash
git push heroku main
```

### **Deploy to Railway**

1. Go to https://railway.app
2. Connect GitHub repository
3. Add environment variables
4. Deploy automatically

### **Deploy to Render**

1. Go to https://render.com
2. Create new Web Service
3. Connect repository
4. Add environment variables
5. Deploy

## 🔮 Future Enhancements

- [ ] Add task assignments to other users
- [ ] Email notifications for due dates
- [ ] File attachments for tasks
- [ ] Task comments and collaboration
- [ ] Calendar view for tasks
- [ ] Task search and advanced filters
- [ ] Due date reminders
- [ ] Task tags and categories
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] Analytics dashboard
- [ ] Export tasks (PDF, CSV)
- [ ] Integration with Google Calendar

## 📈 Performance Optimization

- MongoDB indexes on frequently queried fields
- Token refresh mechanism to reduce authentication overhead
- Efficient query patterns with Mongoose
- Connection pooling for database
- Caching with Redis (optional)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Marampelly_Akhilesh**
- GitHub: [@MARAMPELLYAKHILESH](https://github.com/MARAMPELLYAKHILESH)
- LinkedIn: [Marampelly Akhilesh](www.linkedin.com/in/marampelly-akhilesh-232593260)
- Email: marampelly.akhilesh001@gmail.com

## 🙏 Acknowledgments

- Express.js documentation
- MongoDB documentation
- JWT.io for token debugging
- Socket.IO community
- Node.js community

## 📞 Support

If you have any questions or issues:
- Open an issue on GitHub
- Email: marampelly.akhilesh001@gmail.com
- Check the [Troubleshooting](#-troubleshooting) section

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using Node.js, Express, and MongoDB**
