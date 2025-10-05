import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ImageListContainer from "../../components/ListContainer/ImageListContainer";
import { getAuth } from "firebase/auth";
import { addDoc, collection, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import { add } from "./scene/operations/modifiers";
import { defaults } from "./scene/operations/component";
import type { ImageComponent } from "./types";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { api, handleGeneric } from "../../util/api";

const storage = getStorage();
const db = getFirestore();

interface Image {
    fileName: string;
    id: string;
    uid: string;
    uploadedAt: string;
    url: string;
}


function addExistingImage(image: Image | null) {
    if (!image?.url) {
        console.error("invalid image object:", image);
        return;
    }

    const newImage = structuredClone(defaults.image) as Partial<ImageComponent>;
    newImage.href = image.url;
    add(newImage);
}

// NOTE: this should be handled in the backend instead, and asynchronously (uploaded on save)

async function addNewImage(fileObject: File) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `uploads/${fileObject.name}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, fileObject);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save image URL and metadata in Firestore
    const uploadedAt = new Date().toISOString();
    const docRef = await addDoc(collection(db, "uploadedImages"), {
        url: downloadURL,
        uploadedAt,
        fileName: fileObject.name,
        uid: user.uid,
    });
    await setDoc(docRef, { id: docRef.id }, { merge: true });

    // Notify your backend using centralized axios client (auth handled)
    await api.post(user, "/api/image", {
        images: [{
            id: docRef.id,
            url: downloadURL,
            fileName: fileObject.name,
            uploadedAt,
        }]
    });

    const newImage = structuredClone(defaults.image) as Partial<ImageComponent>;
    newImage.href = downloadURL;
    add(newImage);
}

async function fetchImages() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const q = query(
        collection(db, "uploadedImages"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    return result;
};

const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) addNewImage(file).catch(handleGeneric);
};


function ImageCreateMenu() {
    const { scenarioId } = useParams();
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const imagesQuery = useQuery({
        queryFn: fetchImages,
        queryKey: ["images", scenarioId],
        enabled: !!scenarioId
    });

    const showFilePicker = () => {
        fileInputRef.current?.click();
    };

    function showModal() {
        dialogRef.current?.showModal();
    }

    function handleSubmit() {
        addExistingImage(selectedImage)
    }

    return <>
        <div className="dropdown">
            <li><a tabIndex={0}><ImageIcon size={16} /></a></li>
            <ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm top-[38px]">
                <li><a onClick={showFilePicker}>Upload Image</a></li>
                <li><a onClick={showModal}>Choose Image</a></li>
            </ul>
        </div>

        <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
        />

        <dialog id="image-picker" className="modal" ref={dialogRef}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">Select Image</h3>
                <div className="py-2"></div>
                <ImageListContainer
                    data={imagesQuery.data}
                    selectedId={selectedImage?.id}
                    onItemSelected={setSelectedImage}
                />
                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                        <button className="btn" onClick={handleSubmit}>Add</button>
                    </form>
                </div>
            </div>
        </dialog>
    </>;
}

export default ImageCreateMenu;
