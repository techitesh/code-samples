import React from 'react'
import Dropzone from 'react-dropzone-uploader'
// import 'react-dropzone-uploader/dist/styles.css'

// import '../pages/articles/editor.css'
import '../assets/css/dropzone.css'

const ImageUploader = ({onSubmit, multiple}) => {
    return(
        <Dropzone accept="image/*" multiple={multiple} onChangeStatus={onSubmit} />
    )
}

export default ImageUploader

