// lib/auth.ts
import pb from './pocketbase';

export async function loginUser(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
     // includes token and user info
      } catch {
    throw new Error('Login failed');
  }
}