// lib/auth.ts
import pb from './pocketbase';

export async function loginUser(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData; // includes token and user info
  } catch (err: any) {
    throw new Error(err.message || 'Login failed');
  }
}