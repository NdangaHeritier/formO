import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

async function checkInterest(uid){

    if (!uid) {
        // router.push("/login");
        return "/login";
    }
    const userInterestRef = collection(db, "user_preferences");
    const userInterestQuery = query(userInterestRef, where("userId", "==", uid));
    const userInterestSnapshot = await getDocs(userInterestQuery);
    if (userInterestSnapshot.empty) {
        // router.push("/signup/select-interest"); // go to set interst if not set...
        return "/signup/select-interest"; //exit
    }
    const userInterestData = userInterestSnapshot.docs[0].data(); // get first instance of user interest
    const interest = userInterestData.interest;
    if (interest === "developer") {
        // router.push("/developer");
        return "/developer";
    } else if (interest === "non-developer") {
        // router.push("/non-dev");
        return "/non-dev";
    } else {
        // fallback if interest is not recognized
        // router.push("/signup/select-interest");
        return "/signup/select-interest";
    }      
}
export default checkInterest;