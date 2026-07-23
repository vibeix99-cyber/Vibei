import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StarRating from './StarRating';

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    base44.entities.Review.filter({ product_id: productId }, '-created_date').then((r) => {
      setReviews(r);
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [productId]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating) {
      setError('Please choose a star rating.');
      return;
    }
    setSubmitting(true);
    await base44.entities.Review.create({
      product_id: productId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      author_name: user?.full_name || 'Anonymous',
    });
    setRating(0);
    setTitle('');
    setComment('');
    setSubmitting(false);
    load();
  };

  return (
    <div className="mt-20 border-t border-border pt-10">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-heading font-bold text-2xl text-terracotta">Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={avg} size={18} />
            <span className="text-sm text-muted-foreground">
              {avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Write a review */}
        <div className="lg:col-span-5">
          <div className="bg-offwhite border border-border rounded-lg p-6">
            <h3 className="font-heading font-bold text-lg text-charcoal">Leave your feedback</h3>
            {user ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-charcoal block mb-1.5">Your rating</label>
                  <StarRating value={rating} size={26} onChange={setRating} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal block mb-1.5">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sum it up"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal block mb-1.5">Your review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Tell others what you loved about it"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm py-3 rounded-full hover:bg-terracotta transition-colors disabled:opacity-40"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-charcoal/80">Please sign in to leave a review.</p>
                <button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="mt-3 bg-forest text-parchment font-semibold uppercase tracking-wider text-sm px-6 py-2.5 rounded-full hover:bg-terracotta transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Existing reviews */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-4 border-border border-t-terracotta rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-charcoal/70 py-8">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <StarRating value={r.rating} size={15} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.title && <h4 className="font-heading font-semibold text-charcoal mt-2">{r.title}</h4>}
                  {r.comment && <p className="text-sm text-charcoal/85 mt-1 leading-relaxed">{r.comment}</p>}
                  <p className="text-xs uppercase tracking-wide text-amber-clay font-medium mt-2">— {r.author_name || 'Anonymous'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}