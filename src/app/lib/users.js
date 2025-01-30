import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'users.json');

export function getUsers() {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  const users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return users;
}
import { v4 as uuidv4 } from 'uuid';

export function saveUser({ username, password }) {
  const users = getUsers();
  const newUser = {
    id: uuidv4(),
    username,
    password,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  return newUser;
}

export function findUser(username) {
  const users = getUsers();
  return users.find(user => user.username === username);
}

export function validateUser(username, password) {
  const users = getUsers();
  return users.find(user => user.username === username && user.password === password);
}
