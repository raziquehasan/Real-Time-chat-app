import React, { useState, useEffect } from 'react';
import { FiX, FiBell, FiVolume2, FiVolumeX, FiMoon } from 'react-icons/fi';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const NotificationSettings = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await notificationAPI.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await notificationAPI.updateSettings(settings);
            toast.success('Settings saved successfully');
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-[#202c33] rounded-lg shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                            <FiBell size={20} />
                            Notification Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : settings ? (
                            <div className="space-y-6">
                                {/* Notification Types */}
                                <div>
                                    <h3 className="text-white font-medium mb-3">Notification Types</h3>
                                    <div className="space-y-3">
                                        <ToggleSwitch
                                            label="New Messages"
                                            checked={settings.enableMessageNotifications}
                                            onChange={(checked) => updateSetting('enableMessageNotifications', checked)}
                                        />
                                        <ToggleSwitch
                                            label="Mentions (@username)"
                                            checked={settings.enableMentionNotifications}
                                            onChange={(checked) => updateSetting('enableMentionNotifications', checked)}
                                        />
                                        <ToggleSwitch
                                            label="File Received"
                                            checked={settings.enableFileNotifications}
                                            onChange={(checked) => updateSetting('enableFileNotifications', checked)}
                                        />
                                        <ToggleSwitch
                                            label="Group Invites"
                                            checked={settings.enableGroupInviteNotifications}
                                            onChange={(checked) => updateSetting('enableGroupInviteNotifications', checked)}
                                        />
                                    </div>
                                </div>

                                {/* Sound */}
                                <div>
                                    <h3 className="text-white font-medium mb-3">Sound</h3>
                                    <ToggleSwitch
                                        label="Notification Sound"
                                        icon={settings.soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
                                        checked={settings.soundEnabled}
                                        onChange={(checked) => updateSetting('soundEnabled', checked)}
                                    />
                                </div>

                                {/* Do Not Disturb */}
                                <div>
                                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                                        <FiMoon size={16} />
                                        Do Not Disturb
                                    </h3>
                                    <ToggleSwitch
                                        label="Enable DND"
                                        checked={settings.dndEnabled}
                                        onChange={(checked) => updateSetting('dndEnabled', checked)}
                                    />
                                    {settings.dndEnabled && (
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-gray-400 text-sm mb-1 block">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={settings.dndStartTime || '22:00'}
                                                    onChange={(e) => updateSetting('dndStartTime', e.target.value)}
                                                    className="w-full bg-[#111b21] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-gray-400 text-sm mb-1 block">End Time</label>
                                                <input
                                                    type="time"
                                                    value={settings.dndEndTime || '08:00'}
                                                    onChange={(e) => updateSetting('dndEndTime', e.target.value)}
                                                    className="w-full bg-[#111b21] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const ToggleSwitch = ({ label, icon, checked, onChange }) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
                {icon}
                {label}
            </span>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#00a884]' : 'bg-gray-600'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
};

export default NotificationSettings;
