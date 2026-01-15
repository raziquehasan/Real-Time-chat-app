import React from 'react';
import { FiPhone, FiVideo, FiArrowDownLeft, FiArrowUpRight, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const CallHistory = ({ history, currentUser }) => {
    return (
        <div className="flex flex-col h-full bg-[#111b21]">
            <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl text-white font-semibold">Call History</h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <FiPhone size={48} className="mb-4 opacity-20" />
                        <p>No recent calls</p>
                    </div>
                ) : (
                    history.map((call) => {
                        const isOutbound = call.initiatorId === currentUser.id;
                        const statusColor = call.status === 'MISSED' ? 'text-red-500' : 'text-gray-400';

                        return (
                            <div key={call.id} className="p-4 hover:bg-[#202c33] cursor-pointer transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${call.status === 'MISSED' ? 'bg-red-500/10' : 'bg-gray-700'
                                        }`}>
                                        {call.callType === 'VIDEO' ? (
                                            <FiVideo className={statusColor} />
                                        ) : (
                                            <FiPhone className={statusColor} />
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">
                                            {call.groupCall ? `Group: ${call.groupId}` : (isOutbound ? 'Outgoing Call' : 'Incoming Call')}
                                        </span>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            {isOutbound ? <FiArrowUpRight className="text-green-500" /> : <FiArrowDownLeft className={call.status === 'MISSED' ? 'text-red-500' : 'text-blue-500'} />}
                                            <span>{formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                        <FiClock /> {call.endedAt ? `${Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000)}s` : 'N/A'}
                                    </span>
                                    <button className="text-[#00a884] opacity-0 group-hover:opacity-100 transition-opacity">
                                        Call Back
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CallHistory;
