import React, { useState } from 'react';
import { Image, Tag, Smile, Send, FolderGit2, X } from 'lucide-react';

interface CreatePostProps {
  userAvatar: string;
  userName: string;
  onAddPost: (title: string, description: string, tags: string[], imageUrl?: string, imageUrls?: string[]) => Promise<void>;
}

export default function CreatePost({ userAvatar, userName, onAddPost }: CreatePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const cleanUrl = urlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
      setError('Please enter a valid URL starting with http://, https://, or /');
      return;
    }
    if (imageUrls.length >= 10) {
      setError('You can add up to 10 images.');
      return;
    }
    setImageUrls([...imageUrls, cleanUrl]);
    setUrlInput('');
    setError('');
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Project title and description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      // Parse tags separated by comma
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      let finalUrls = [...imageUrls];
      if (urlInput.trim()) {
        const cleanUrl = urlInput.trim();
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')) {
          if (!finalUrls.includes(cleanUrl)) {
            finalUrls.push(cleanUrl);
          }
        }
      }

      const firstImg = finalUrls.length > 0 ? finalUrls[0] : undefined;
      await onAddPost(title, description, tags, firstImg, finalUrls);

      // Reset
      setTitle('');
      setDescription('');
      setTagsInput('');
      setUrlInput('');
      setImageUrls([]);
      setIsExpanded(false);
    } catch (err) {
      console.error(err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow p-4 mb-4" id="fb-create-post">
      {/* Title / Header of Card */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-200 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <FolderGit2 className="w-4 h-4 text-blue-500" />
        <span>Create Portfolio Project Post</span>
      </div>

      {/* Main Composer Box */}
      <div className="flex gap-3">
        <img
          src={userAvatar}
          alt={userName}
          className="w-10 h-10 rounded-full object-cover shrink-0 z-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-grow">
          {/* Quick Trigger (if collapsed) */}
          {!isExpanded ? (
            <div
              onClick={() => setIsExpanded(true)}
              className="bg-gray-100 hover:bg-gray-200 rounded-full py-2.5 px-4 text-gray-500 text-sm cursor-pointer transition-colors font-sans"
            >
              What project have you built lately, {userName.split(' ')[0]}?
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Project Title Field */}
              <input
                type="text"
                placeholder="Project Title (e.g., Chess Engine, Dev Dashboard)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1877f2] focus:border-transparent text-sm font-sans text-gray-900 font-medium placeholder-gray-400"
                maxLength={80}
                required
              />

              {/* Project Description Field */}
              <textarea
                placeholder="What is this project about? Write a classic timeline update detailing challenges, successes, and architecture..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[90px] bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1877f2] focus:border-transparent text-sm font-sans text-gray-700 placeholder-gray-400 leading-relaxed resize-none"
                maxLength={1000}
                required
              />

              {/* Tags Field (Comma separated) */}
              <input
                type="text"
                placeholder="Tags (comma-separated: e.g. React, Node, TypeScript)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-205 rounded-lg py-2 px-3 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1877f2] focus:border-transparent text-xs font-sans text-gray-600 placeholder-gray-400"
              />

              {/* Multiple Image URL Input Group */}
              <div className="flex flex-col gap-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-150">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project Gallery ({imageUrls.length}/10 images)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Image URL (Unsplash link, /profile/melmar.jpg, etc.)..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    className="flex-grow bg-white border border-gray-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#1877f2] text-xs font-sans text-gray-600 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200 whitespace-nowrap"
                  >
                    + Add Image
                  </button>
                </div>

                {/* Horizontal scrollable preview strip */}
                {imageUrls.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto py-1 mt-1 scrollbar-thin scrollbar-thumb-gray-255">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-md border border-gray-200 overflow-hidden shrink-0 bg-gray-100 group">
                        <img src={url} alt={`Add Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveUrl(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors"
                          title="Remove Image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <span className="text-red-500 text-xs font-sans font-medium">{error}</span>}

              {/* Submit Dock */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-green-500" title="Photo/Video Link">
                    <Image className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-blue-500" title="Tags">
                    <Tag className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-yellow-500" title="Feeling/Activity">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsExpanded(false); setError(''); }}
                    className="px-3 py-1.5 hover:bg-gray-100 text-gray-500 text-xs font-semibold rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] disabled:bg-blue-300 text-white text-xs font-semibold rounded-md shadow flex items-center gap-1.5 transition-colors"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Project'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Auxiliary quick links */}
      {!isExpanded && (
        <div className="flex items-center justify-between border-t border-gray-200 mt-3 pt-3 text-xs sm:text-sm text-gray-500 font-semibold font-sans">
          <button onClick={() => setIsExpanded(true)} className="flex items-center justify-center gap-2 h-10 hover:bg-gray-50 rounded-lg flex-1 transition-colors text-red-500">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span>Live Portfolio Item</span>
          </button>
          <button onClick={() => setIsExpanded(true)} className="flex items-center justify-center gap-2 h-10 hover:bg-gray-50 rounded-lg flex-1 transition-colors text-green-500">
            <Image className="w-5 h-5" />
            <span>Project Media</span>
          </button>
          <button onClick={() => setIsExpanded(true)} className="flex items-center justify-center gap-2 h-10 hover:bg-gray-50 rounded-lg flex-1 transition-colors text-yellow-500">
            <Smile className="w-5 h-5" />
            <span>Developer Mood</span>
          </button>
        </div>
      )}
    </div>
  );
}
