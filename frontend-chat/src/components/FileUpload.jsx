import React, { useState } from 'react';
import { MdClose, MdUpload, MdImage, MdDescription } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseURL } from '../config/AxiosHelper';

const FileUpload = ({ roomId, sender, onFileUploaded, onCancel }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('roomId', roomId);
        formData.append('sender', sender);

        try {
            const response = await axios.post(
                `${baseURL}/api/v1/files/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    },
                }
            );

            console.log('📎 File uploaded:', response.data);
            toast.success('File uploaded successfully!');

            // Pass file metadata to parent
            onFileUploaded(response.data);

            // Reset
            setSelectedFile(null);
            setPreview(null);
            setUploadProgress(0);

        } catch (error) {
            console.error('❌ File upload error:', error);
            toast.error('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg">Upload File</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            id="file-input"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <label
                            htmlFor="file-input"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            <MdUpload size={48} className="text-gray-400 mb-2" />
                            <p className="text-white mb-1">Click to select file</p>
                            <p className="text-gray-400 text-sm">Max size: 10MB</p>
                            <p className="text-gray-400 text-xs mt-2">
                                Images, PDF, Documents
                            </p>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {preview ? (
                            <div className="relative">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <MdImage className="absolute top-2 left-2 text-white bg-black bg-opacity-50 rounded p-1" size={32} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-gray-700 p-4 rounded-lg">
                                <MdDescription size={40} className="text-blue-400" />
                                <div className="flex-1">
                                    <p className="text-white text-sm truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {uploading && (
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setPreview(null);
                                }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                                disabled={uploading}
                            >
                                Change
                            </button>
                            <button
                                onClick={handleUpload}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                                disabled={uploading}
                            >
                                {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
