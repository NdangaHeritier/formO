// lib/pocketbase.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090'); 
// I will change it if i will be using remote.

export default pb;