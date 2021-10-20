// import {upload} from "./upload";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from "firebase/storage";

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



//--------------------

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (!bytes) {
        return '0 Byte'
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}

const element = (tag, classes = [], content) => {
    const node = document.createElement(tag)

    if (classes.length) {
        node.classList.add(...classes)
    }
    if (content) {
        node.textContent = content
    }

    return node
}

function noop() {}

export function upload(selector, options = {}) {
    let files = [];
    const onUpload = options.onUpload ?? noop;
    const input = document.querySelector(selector);
    const preview = element('div', ['preview'])
    const open = element('button', ['btn'], 'Открыть');
    const upload = element('button', ['btn', 'primary'], 'Загрузить')
    upload.style.display = 'none';

    if (options.multi) {
        input.setAttribute('multiple', true);
    }

    if (options.accept && Array.isArray(options.accept)) {
        input.setAttribute('accept', options.accept.join(','))
    }

    input.insertAdjacentElement('afterend', preview);
    input.insertAdjacentElement('afterend', upload);
    input.insertAdjacentElement('afterend', open);

    const triggeeInput = () => input.click();

    const changeHandler = event => {
        if (!event.target.files.length) {
            return
        }

        files = Array.from(event.target.files);
        preview.innerHTML = "";
        upload.style.display = 'inline';

        files.forEach(file => {
            if (!file.type.match('image')) {
                return
            }

            const reader = new FileReader()

            reader.onload = ev => {
                const src = ev.target.result;
                preview.insertAdjacentHTML('afterbegin', `
                    <div class="preview-image">
                    <div class="preview-remove" data-name="${file.name}">&times;</div>
                        <img src="${src}" alt="${file.name}"/>
                        <div class="preview-info">
                            <span>${file.name}</span>
                            ${bytesToSize(file.size)}
                        </div>
                    </div>
                `)
            }

            reader.readAsDataURL(file) // ассинхронная операция
        })
    }

    const removeHandler = event => {
        if (!event.target.dataset.name) {
            return
        }

        const {name} = event.target.dataset;
        files = files.filter(file => file.name !== name);

        if (!files.length) {
            upload.style.display = 'none';
        }

        const block = preview
            .querySelector(`[data-name="${name}"]`)
            .closest('.preview-image')

        block.classList.add('removing')
        setTimeout(() => block.remove(), 300)
    }

    const clearPreview = el => {
        el.style.bottom = '4px'
        el.innerHTML = '<div class="preview-info-progress"></div>'
    }

    const uploadHandler = () => {
        preview.querySelectorAll('.preview-remove').forEach(e => e.remove())
        const previewInfo = preview.querySelectorAll('.preview-info')
        previewInfo.forEach(clearPreview)
        onUpload(files, previewInfo);
    }

    open.addEventListener('click', triggeeInput);
    input.addEventListener('change', changeHandler);
    preview.addEventListener('click', removeHandler);
    upload.addEventListener('click', uploadHandler);
}