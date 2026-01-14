import React, { useState, useRef } from 'react';
import { FiCamera, FiUser, FiX, FiCheck } from 'react-icons/fi';

const AvatarUpload = ({ onImageSelect, currentImage }) => {
    const [preview, setPreview] = useState(currentImage || null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success
    const [isRemoving, setIsRemoving] = useState(false);
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

        // Start upload animation
        setUploadState('uploading');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            onImageSelect(file, reader.result);

            // Show success animation
            setUploadState('success');

            // Reset to idle after success animation
            setTimeout(() => {
                setUploadState('idle');
            }, 1500);
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

        // Start removal animation
        setIsRemoving(true);

        // Clear preview after animation completes
        setTimeout(() => {
            setPreview(null);
            onImageSelect(null, null);
            setIsRemoving(false);
            setUploadState('idle');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }, 300);
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar Upload Area */}
            <div
                onClick={uploadState === 'uploading' ? undefined : handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative w-32 h-32 rounded-full cursor-pointer
          transition-all duration-300 group
          ${isDragging ? 'scale-110 ring-4 ring-blue-500' : 'hover:scale-105'}
          ${isRemoving ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}
        `}
                style={{ transition: 'transform 300ms ease-out, opacity 300ms ease-out' }}
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

                {/* Circular Loader Ring (during upload) */}
                {uploadState === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                            <circle
                                cx="64"
                                cy="64"
                                r="60"
                                fill="none"
                                stroke="rgba(59, 130, 246, 0.2)"
                                strokeWidth="4"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="60"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeDasharray="377"
                                strokeDashoffset="94"
                                strokeLinecap="round"
                                className="animate-spin"
                                style={{
                                    transformOrigin: 'center',
                                    animation: 'spin 1s linear infinite'
                                }}
                            />
                        </svg>
                    </div>
                )}

                {/* Success Tick Animation */}
                {uploadState === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full animate-fadeIn">
                        <div className="bg-green-500 rounded-full p-3 animate-scaleIn">
                            <FiCheck size={32} className="text-white" strokeWidth={3} />
                        </div>
                    </div>
                )}

                {/* Camera Icon Overlay (only when not uploading/success) */}
                {uploadState === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-blue-500 p-3 rounded-full transform group-hover:scale-110 transition-transform duration-200">
                            <FiCamera size={24} className="text-white" />
                        </div>
                    </div>
                )}

                {/* Remove Button */}
                {preview && uploadState !== 'uploading' && (
                    <button
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-all duration-200 z-10"
                        type="button"
                    >
                        <FiX size={16} />
                    </button>
                )}

                {/* Enhanced Glow Effect */}
                <div
                    className="absolute inset-0 -z-10 rounded-full blur-xl transition-opacity duration-300"
                    style={{
                        background: uploadState === 'success'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : 'rgba(59, 130, 246, 0.2)',
                        opacity: uploadState === 'success' || (uploadState === 'idle' && preview) ? 1 : 0
                    }}
                />

                {/* Hover Glow (only when idle) */}
                {uploadState === 'idle' && (
                    <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
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
