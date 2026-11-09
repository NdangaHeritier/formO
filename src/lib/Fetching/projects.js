import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
export default async function fetch_all_projects () {
    const docRef = await getDocs(collection(db, "projects"));
    const projects = [];
    docRef.forEach((doc) => {
        projects.push({ ...doc.data(), id: doc.id });
    });
    return projects;
}

export async function fetch_project_by_id(id) {
    const docRef = doc(db, "projects", id);
    const project = await getDocs(docRef);
    if (project.exists()) {
        return { ...project.data(), id: project.id };
    }
}

export async function fetch_projects_by_user_id(userId) {
    const docRef = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));
    
    const projects = [];
    docRef.forEach((doc) => {
        projects.push({ ...doc.data(), id: doc.id });
    });
    return projects;
}
export async function fetch_projects_by_query(field, op, value) {
    const q = query(collection(db, "projects"), where(field, op, value));
    const querySnapshot = await getDocs(q);

    const projects = [];
    querySnapshot.forEach((doc) => {
        projects.push({ ...doc.data(), id: doc.id });
    });

    return projects;
}

export async function fetch_projects_count() {
    const docRef = await getDocs(collection(db, "projects"));
    const count = docRef.size;
    return count;
}

export async function fetch_projects_count_by_user_id(userId) {
    const docRef = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));
    const count = docRef.size;
    return count;
}