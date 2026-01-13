import React from 'react';
import { MdImage, MdDescription, MdDownload, MdPictureAsPdf } from 'react-icons/md';
import { baseURL } from '../config/AxiosHelper';

const FileAttachment = ({ attachment }) => {
    if (!attachment) return null;

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'image':
                return <MdImage size={24} className="text-blue-400" />;
            case 'document':
                return <MdPictureAsPdf size={24} className="text-red-400" />;
            default:
                return <MdDescription size={24} className="text-gray-400" />;
        }
    };

    const handleDownload = () => {
        window.open(`${baseURL}${attachment.fileUrl}`, '_blank');
    };

    // Image attachment
    if (attachment.fileType === 'image') {
        return (
            <div className="mt-2 max-w-xs">
                <img
                    src={`${baseURL}${attachment.fileUrl}`}
                    alt={attachment.originalFileName}
                    className="rounded-lg cursor-pointer hover:opacity-90 transition w-full"
                    onClick={() => window.open(`${baseURL}${attachment.fileUrl}`, '_blank')}
                />
                <p className="text-xs text-gray-400 mt-1">{attachment.originalFileName}</p>
            </div>
        );
    }

    // Document/Other attachment
    return (
        <div className="mt-2 bg-gray-700 rounded-lg p-3 max-w-xs">
            <div className="flex items-center gap-3">
                {getFileIcon(attachment.fileType)}
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                        {attachment.originalFileName}
                    </p>
                    <p className="text-gray-400 text-xs">
                        {formatFileSize(attachment.fileSize)}
                    </p>
                </div>
                <button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
                    title="Download"
                >
                    <MdDownload size={18} />
                </button>
            </div>
        </div>
    );
};

export default FileAttachment;
