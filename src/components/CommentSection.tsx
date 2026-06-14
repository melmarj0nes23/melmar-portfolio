import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Comment } from '../types';

interface CommentSectionProps {
  comments: Comment[];
  isSubmitting: boolean;
  onAddComment: (text: string, authorName: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  visitorAvatar: string;
  isOwner?: boolean;
}

export default function CommentSection({ comments, isSubmitting, onAddComment, onDeleteComment, visitorAvatar, isOwner = false }: CommentSectionProps) {
  const [inputText, setInputText] = useState('');
  const [visitorName, setVisitorName] = useState(() => {
    return localStorage.getItem('fb_portfolio_commenter_name') || '';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !visitorName.trim() || isSubmitting) return;

    try {
      await onAddComment(inputText.trim(), visitorName.trim());
      setInputText('');
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  // Human-readable simple timestamp formatter
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 rounded-b-lg font-sans">
      {/* List of Comments */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 items-start text-xs group" id={`comment-${comment.id}`}>
              {/* Commenter circular Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#1877f2] text-white font-bold flex items-center justify-center shrink-0 uppercase select-none text-[11px] shadow-sm">
                {comment.author.charAt(0)}
              </div>
              
              {/* Comment Bubble Wrap */}
              <div className="flex flex-col max-w-[85%]">
                <div className="bg-gray-200 rounded-2xl px-3 py-2 text-gray-900 shadow-sm relative">
                  <span className="font-bold text-gray-800 hover:underline block cursor-pointer">
                    {comment.author}
                  </span>
                  <p className="text-[12.5px] mt-0.5 leading-normal text-gray-750 break-words font-normal">
                    {comment.text}
                  </p>
                </div>
                {/* Meta details below comment bubble */}
                <div className="flex items-center gap-2 pl-3 mt-1 text-[10px] text-gray-400">
                  <button className="hover:underline hover:text-gray-600 font-bold">Like</button>
                  <span>•</span>
                  <button className="hover:underline hover:text-gray-600 font-bold">Reply</button>
                  <span>•</span>
                  <span>{formatTime(comment.createdAt)}</span>
                  {(() => {
                    const commenterName = localStorage.getItem('fb_portfolio_commenter_name') || '';
                    const canDelete = isOwner || (comment.author && commenterName && comment.author.trim().toLowerCase() === commenterName.trim().toLowerCase());
                    if (canDelete && onDeleteComment) {
                      return (
                        <>
                          <span>•</span>
                          <button 
                            onClick={() => onDeleteComment(comment.id)}
                            className="hover:underline hover:text-red-500 font-semibold text-gray-400 inline-flex items-center gap-0.5 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            Delete
                          </button>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write a Comment Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-gray-150 pt-3 mt-3">
        {/* Name input row */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Your Name:</label>
          <input
            type="text"
            placeholder="Type your name (required)..."
            value={visitorName}
            onChange={(e) => {
              const val = e.target.value;
              setVisitorName(val);
              localStorage.setItem('fb_portfolio_commenter_name', val);
            }}
            required
            className="bg-white border border-gray-300 rounded-md py-1 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1877f2] font-semibold text-gray-850 w-full sm:max-w-[180px]"
            maxLength={25}
          />
        </div>

        {/* Comment Input bubble-row */}
        <div className="flex gap-2.5 items-center">
          {/* Visitor initial Avatar badge */}
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs select-none uppercase shadow-sm">
            {visitorName.trim() ? visitorName.trim().charAt(0) : 'V'}
          </div>
          
          {/* Bubble styled comment input */}
          <div className="flex-grow relative flex items-center">
            <input
              type="text"
              placeholder={visitorName.trim() ? "Write a public comment..." : "Type your name first to comment..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSubmitting || !visitorName.trim()}
              className="w-full bg-gray-200 focus:bg-white text-[13px] text-gray-800 placeholder-gray-500 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-[#1877f2] border border-transparent focus:border-transparent transition-all"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !visitorName.trim() || isSubmitting}
              className={`absolute right-2.5 p-1 rounded-full text-blue-500 transition-all ${
                inputText.trim() && visitorName.trim() ? 'hover:bg-blue-50 scale-100 opacity-100' : 'scale-75 opacity-40 cursor-default'
              }`}
              title="Post Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
