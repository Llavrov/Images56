import {upload} from "./upload";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from "firebase/storage";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxtVrgTuB2tkFfTBRY06IHkUJmIdDeAqM",
    authDomain: "image-uploader-fe3b2.firebaseapp.com",
    projectId: "image-uploader-fe3b2",
    storageBucket: "image-uploader-fe3b2.appspot.com",
    messagingSenderId: "149472430228",
    appId: "1:149472430228:web:96b5095b4ddbe95bf38c81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const listRef = ref(storage, `images/`);
const ImgList = document.querySelector(".images-container");

listAll(listRef)
    .then((res) => {
        res.items.forEach((itemRef) => {
            console.log(itemRef);
            getDownloadURL(itemRef).then((downloadURL) => {
                ImgList.insertAdjacentHTML('afterbegin', `
                        <div class="preview-image">
                            <img src="${downloadURL}" alt="${itemRef?.name}"/>                       
                        </div>
                        `);
            });
        });
    }).catch((error) => {
    console.log(error);
});

upload('#file', {
    multi : true,
    accept: ['.png', '.jpg', '.jpeg', '.gif'],
    onUpload(files, blocks) {
        new Promise((resolve) => {
            resolve(
                files.map((file, index) => {
                    const ImgRef = ref(storage, `images/${file.name}`);

                    const uploadTask = uploadBytesResumable(ImgRef, file);

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
                            const block = blocks[index].querySelector('.preview-info-progress');
                            block.textContent = progress;
                            block.style.width = progress + "%";
                            // console.log('Upload is ' + progress + '% done');
                            switch (snapshot.state) {
                                case 'paused':
                                    console.log('Upload is paused');
                                    break;
                                case 'running':
                                    console.log('Upload is running');
                                    break;
                            }
                        },
                        (error) => {
                            console.log(error);
                        },
                        () => {
                            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                console.log('File available at', downloadURL);
                            });
                        }
                    );
                })
            )
        }).then(() => {
            console.log(blocks);
            ImgList.innerHTML = `${blocks.join('')}`;
            listAll(listRef)
                .then((res) => {
                    res.items.forEach((itemRef) => {
                        console.log(itemRef);
                        getDownloadURL(itemRef).then((downloadURL) => {
                            ImgList.insertAdjacentHTML('afterbegin', `
                            <div class="preview-image">
                                <img src="${downloadURL}" alt="${itemRef?.name}"/>                       
                            </div>
                            `);
                        });
                    });
                }).catch((error) => {
                console.log(error);
            });
        });
    }
});

