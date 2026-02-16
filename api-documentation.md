# Task Manager API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"  // optional: admin, manager, member
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "member"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as Register

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

### Get Current User
```http
GET /auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

---

## Task Endpoints

### Get All Tasks
```http
GET /tasks?project=<projectId>&status=<status>&assignedTo=<userId>
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `project` - Filter by project ID
- `status` - Filter by status (todo, in-progress, review, completed)
- `assignedTo` - Filter by assigned user ID
- `priority` - Filter by priority (low, medium, high, urgent)

**Response:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "tasks": [
      {
        "_id": "...",
        "title": "Implement authentication",
        "description": "Add JWT authentication to API",
        "status": "in-progress",
        "priority": "high",
        "project": {
          "_id": "...",
          "name": "Backend API"
        },
        "assignedTo": {
          "_id": "...",
          "username": "johndoe"
        },
        "dueDate": "2026-02-15T00:00:00.000Z",
        "createdAt": "2026-02-07T10:00:00.000Z"
      }
    ]
  }
}
```

### Get Single Task
```http
GET /tasks/:id
```

### Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT authentication to API",
  "status": "todo",
  "priority": "high",
  "project": "project_id",
  "assignedTo": "user_id",
  "dueDate": "2026-02-15",
  "tags": ["backend", "security"]
}
```

### Update Task
```http
PUT /tasks/:id
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "status": "completed",
  "priority": "medium"
}
```

### Delete Task
```http
DELETE /tasks/:id
```

### Add Comment
```http
POST /tasks/:id/comments
```

**Request Body:**
```json
{
  "text": "Great work on this task!"
}
```

---

## Project Endpoints

### Get All Projects
```http
GET /projects
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "...",
        "name": "Backend API",
        "description": "REST API development",
        "status": "active",
        "owner": {...},
        "members": [...],
        "createdAt": "2026-02-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "name": "Backend API",
  "description": "REST API development",
  "status": "planning",
  "startDate": "2026-02-01",
  "color": "#3498db",
  "isPrivate": false
}
```

### Update Project
```http
PUT /projects/:id
```

### Delete Project
```http
DELETE /projects/:id
```

### Add Member to Project
```http
POST /projects/:id/members
```

**Request Body:**
```json
{
  "userId": "user_id",
  "role": "member"  // owner, admin, member, viewer
}
```

### Remove Member
```http
DELETE /projects/:id/members/:userId
```

---

## User Endpoints

### Search Users
```http
GET /users?search=<query>
```

**Query Parameters:**
- `search` - Search by username or email

### Get User by ID
```http
GET /users/:id
```

### Update Profile
```http
PUT /users/:id
```

**Request Body:**
```json
{
  "username": "newusername",
  "profilePicture": "https://..."
}
```

---

## WebSocket Events

### Client → Server

**Join Room:**
```javascript
socket.emit('join-room', roomId, userId);
```

**Task Created:**
```javascript
socket.emit('task-created', taskData);
```

**Task Updated:**
```javascript
socket.emit('task-updated', taskData);
```

**Task Deleted:**
```javascript
socket.emit('task-deleted', taskId);
```

### Server → Client

**User Joined:**
```javascript
socket.on('user-joined', ({ userId, socketId }) => {
  console.log(`User ${userId} joined`);
});
```

**New Task:**
```javascript
socket.on('new-task', (taskData) => {
  // Update UI with new task
});
```

**Task Update:**
```javascript
socket.on('task-update', (taskData) => {
  // Update UI with task changes
});
```

**Task Removed:**
```javascript
socket.on('task-removed', (taskId) => {
  // Remove task from UI
});
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided, authorization denied"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error message"
}
```

---

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes

---

## Example Usage (JavaScript)

```javascript
// Register
const register = async () => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  localStorage.setItem('accessToken', data.data.accessToken);
};

// Create Task
const createTask = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('http://localhost:5000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'New Task',
      project: 'project_id',
      priority: 'high'
    })
  });
  const data = await response.json();
  console.log(data);
};

// WebSocket Connection
import io from 'socket.io-client';
const socket = io('http://localhost:5000');

socket.emit('join-room', 'project_id', 'user_id');

socket.on('new-task', (task) => {
  console.log('New task created:', task);
});
```

---

## Postman Collection

Import this into Postman for easy testing:

[Download Postman Collection](link-to-collection.json)

---

*API Documentation v1.0.0*