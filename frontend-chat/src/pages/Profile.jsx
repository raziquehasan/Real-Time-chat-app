import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, filesAPI } from '../services/api';
import { FiUser, FiCamera, FiArrowLeft, FiSave, FiInfo, FiPhone } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name || '');
    const [about, setAbout] = useState(user?.about || 'I am using Chat App!');
    const [phone, setPhone] = useState(user?.phone || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const data = await filesAPI.upload(file);
            setAvatar(data.fileUrl);
            toast.success('Avatar uploaded! Click Save to apply changes.');
        } catch (error) {
            console.error('Avatar upload failed:', error);
            toast.error('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const updatedUser = await profileAPI.updateProfile({
                name,
                about,
                phone,
                avatar
            });

            // Update auth context
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profile updated successfully');
            navigate('/');
        } catch (error) {
            console.error('Profile update failed:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    >
                        <FiArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Your Profile</h1>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <FiUser size={64} className="text-gray-400" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white shadow-lg hover:bg-blue-600 transition-colors"
                            >
                                <FiCamera size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-400">Click to change photo</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-blue-400 font-medium ml-1">Full Name</label>
                            <div className="relative mt-1">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-blue-400 font-medium ml-1">About / Bio</label>
                            <div className="relative mt-1">
                                <FiInfo className="absolute left-3 top-4 text-gray-500" />
                                <textarea
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-blue-400 font-medium ml-1">Phone Number</label>
                            <div className="relative mt-1">
                                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Your phone number"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                            ) : (
                                <>
                                    <FiSave size={20} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
