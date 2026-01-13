import React, { useState, useRef } from 'react';
import { FiCamera, FiUser, FiX } from 'react-icons/fi';

const AvatarUpload = ({ onImageSelect, currentImage }) => {
    const [preview, setPreview] = useState(currentImage || null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            onImageSelect(file, reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFileSelect(file);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelect(null, null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar Upload Area */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative w-32 h-32 rounded-full cursor-pointer
          transition-all duration-300 group
          ${isDragging ? 'scale-110 ring-4 ring-blue-500' : 'hover:scale-105'}
        `}
            >
                {/* Avatar Preview or Placeholder */}
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 border-4 border-gray-700 group-hover:border-blue-500 transition-all duration-300">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                            <FiUser size={48} className="text-gray-500" />
                        </div>
                    )}
                </div>

                {/* Camera Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-blue-500 p-3 rounded-full">
                        <FiCamera size={24} className="text-white" />
                    </div>
                </div>

                {/* Remove Button */}
                {preview && (
                    <button
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-all duration-200 z-10"
                        type="button"
                    >
                        <FiX size={16} />
                    </button>
                )}

                {/* Glow Effect */}
                <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Upload Instructions */}
            <div className="text-center">
                <p className="text-sm text-gray-400">
                    {preview ? 'Click to change photo' : 'Click to upload photo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or GIF (max 5MB)
                </p>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};

export default AvatarUpload;
