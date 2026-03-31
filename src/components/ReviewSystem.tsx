'use client';

/**
 * ReviewSystem - نظام مراجعات وتقييمات متقدم
 * تصميم فاخر مع تفاصيل دقيقة
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ThumbsUp, ThumbsDown, MessageCircle, User,
  CheckCircle, Shield, Award, TrendingUp, Filter,
  ChevronDown, Image as ImageIcon, X, Send, Edit, Trash2
} from 'lucide-react';
import Image from 'next/image';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: string;
  pros?: string[];
  cons?: string[];
}

interface ReviewSystemProps {
  itemId: string;
  itemType: 'car' | 'part';
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  onSubmitReview?: (review: Partial<Review>) => void;
  onHelpful?: (reviewId: string) => void;
  onNotHelpful?: (reviewId: string) => void;
  canReview?: boolean;
}

export default function ReviewSystem({
  itemId,
  itemType,
  reviews,
  averageRating,
  totalReviews,
  onSubmitReview,
  onHelpful,
  onNotHelpful,
  canReview = true
}: ReviewSystemProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  // توزيع التقييمات
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  // تصفية وترتيب المراجعات
  let filteredReviews = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  filteredReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'helpful') return b.helpful - a.helpful;
    if (sortBy === 'rating') return b.rating - a.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8">
      {/* ملخص التقييمات */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-8 border border-white/10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* التقييم الإجمالي */}
          <div className="text-center lg:border-l lg:border-white/10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="inline-flex flex-col items-center"
            >
              <div className="text-6xl font-black text-gradient-red mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-sm">
                بناءً على {totalReviews} تقييم
              </p>
            </motion.div>
          </div>

          {/* توزيع التقييمات */}
          <div className="lg:col-span-2 space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }, idx) => (
              <motion.button
                key={rating}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                  filterRating === rating
                    ? 'bg-red-500/20 border border-red-500/50'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-bold text-white">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
                  />
                </div>
                
                <span className="text-sm text-gray-400 w-16 text-left">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* زر إضافة مراجعة */}
        {canReview && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowReviewForm(true)}
            className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all shadow-lg hover:shadow-red-500/50"
          >
            <MessageCircle className="w-5 h-5" />
            <span>اكتب مراجعتك</span>
          </motion.button>
        )}
      </motion.div>

      {/* أدوات التصفية والترتيب */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">ترتيب حسب:</span>
        </div>
        
        {['recent', 'helpful', 'rating'].map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              sortBy === sort
                ? 'bg-red-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {sort === 'recent' && 'الأحدث'}
            {sort === 'helpful' && 'الأكثر فائدة'}
            {sort === 'rating' && 'الأعلى تقييماً'}
          </button>
        ))}

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all"
          >
            <X className="w-4 h-4" />
            <span>إلغاء التصفية</span>
          </button>
        )}
      </div>

      {/* قائمة المراجعات */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReviews.map((review, idx) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={idx}
              onHelpful={onHelpful}
              onNotHelpful={onNotHelpful}
            />
          ))}
        </AnimatePresence>

        {filteredReviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد مراجعات بهذا التصفية</p>
          </motion.div>
        )}
      </div>

      {/* نموذج المراجعة */}
      <ReviewForm
        show={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSubmit={(review) => {
          onSubmitReview?.(review);
          setShowReviewForm(false);
        }}
      />
    </div>
  );
}

// مكون بطاقة المراجعة
function ReviewCard({
  review,
  index,
  onHelpful,
  onNotHelpful
}: {
  review: Review;
  index: number;
  onHelpful?: (id: string) => void;
  onNotHelpful?: (id: string) => void;
}) {
  const [showFullComment, setShowFullComment] = useState(false);
  const [showImages, setShowImages] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
    >
      {/* رأس المراجعة */}
      <div className="flex items-start gap-4 mb-4">
        {/* صورة المستخدم */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center overflow-hidden">
            {review.userAvatar ? (
              <Image src={review.userAvatar} alt={review.userName} fill className="object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          {review.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* معلومات المستخدم */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white">{review.userName}</h4>
            {review.verified && (
              <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                مشتري موثق
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString('ar-SA')}
            </span>
          </div>
        </div>
      </div>

      {/* عنوان المراجعة */}
      {review.title && (
        <h5 className="text-lg font-bold text-white mb-2">{review.title}</h5>
      )}

      {/* النص */}
      <p className={`text-gray-300 leading-relaxed mb-4 ${!showFullComment && 'line-clamp-3'}`}>
        {review.comment}
      </p>

      {review.comment.length > 200 && (
        <button
          onClick={() => setShowFullComment(!showFullComment)}
          className="text-sm text-red-400 hover:text-red-300 font-bold mb-4"
        >
          {showFullComment ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      )}

      {/* الإيجابيات والسلبيات */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && review.pros.length > 0 && (
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
              <p className="text-sm font-bold text-green-400 mb-2">الإيجابيات:</p>
              <ul className="space-y-1">
                {review.pros.map((pro, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.cons && review.cons.length > 0 && (
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <p className="text-sm font-bold text-red-400 mb-2">السلبيات:</p>
              <ul className="space-y-1">
                {review.cons.map((con, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* الصور */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {review.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setShowImages(true)}
              className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 hover:border-red-500/50 transition-all"
            >
              <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* أزرار التفاعل */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <button
          onClick={() => onHelpful?.(review.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/30 text-gray-400 hover:text-green-400 transition-all"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-bold">{review.helpful}</span>
        </button>

        <button
          onClick={() => onNotHelpful?.(review.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all"
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm font-bold">{review.notHelpful}</span>
        </button>

        <span className="text-sm text-gray-500 ml-auto">
          هل كانت هذه المراجعة مفيدة؟
        </span>
      </div>
    </motion.div>
  );
}

// نموذج إضافة مراجعة
function ReviewForm({
  show,
  onClose,
  onSubmit
}: {
  show: boolean;
  onClose: () => void;
  onSubmit: (review: Partial<Review>) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating,
      title,
      comment,
      pros: pros.filter(p => p.trim()),
      cons: cons.filter(c => c.trim()),
    });
    // إعادة تعيين النموذج
    setRating(0);
    setTitle('');
    setComment('');
    setPros(['']);
    setCons(['']);
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-8 border border-white/10"
      >
        {/* رأس النموذج */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-white">اكتب مراجعتك</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* التقييم */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              التقييم <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* العنوان */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              عنوان المراجعة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: سيارة رائعة وموثوقة"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-500/50 text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>

          {/* التعليق */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              تعليقك <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك تجربتك بالتفصيل..."
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-500/50 text-white placeholder-gray-500 outline-none transition-all resize-none"
            />
          </div>

          {/* أزرار الإرسال */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!rating || !title.trim() || !comment.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg hover:shadow-red-500/50"
            >
              نشر المراجعة
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
