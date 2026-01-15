import React from 'react';
import { FiAlertCircle, FiTrash2 } from 'react-icons/fi';

const DeleteConfirmDialog = ({ message, onConfirm, onCancel, isSender }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#202c33] rounded-2xl w-full max-w-sm mx-4 shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle size={24} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Delete Message?</h2>
                    <p className="text-sm text-gray-400">Choose how you want to delete this message</p>
                </div>

                {/* Options */}
                <div className="px-4 pb-4 space-y-2">
                    {/* Delete for Me */}
                    <button
                        onClick={() => onConfirm('FOR_ME')}
                        className="w-full p-4 bg-[#2a3942] hover:bg-gray-700 rounded-xl transition-all text-left group border border-gray-700 hover:border-gray-600"
                    >
                        <div className="flex items-start gap-3">
                            <FiTrash2 size={20} className="text-gray-400 group-hover:text-white transition-colors mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-white font-medium mb-1">Delete for me</h3>
                                <p className="text-xs text-gray-400">
                                    This message will be removed from your chat only
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Delete for Everyone - Only show if sender */}
                    {isSender && (
                        <button
                            onClick={() => onConfirm('FOR_EVERYONE')}
                            className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all text-left group border border-red-500/30 hover:border-red-500/50"
                        >
                            <div className="flex items-start gap-3">
                                <FiTrash2 size={20} className="text-red-500 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-white font-medium mb-1">Delete for everyone</h3>
                                    <p className="text-xs text-gray-400">
                                        This message will be removed for all participants
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Cancel Button */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={onCancel}
                        className="w-full py-2.5 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmDialog;
