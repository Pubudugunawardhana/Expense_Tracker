import { useEffect, useState } from 'react';

const STAR_OPTIONS = [1, 2, 3, 4, 5];
const FEEDBACK_STORAGE_KEY = 'feedback';
const LEGACY_FEEDBACK_STORAGE_KEY = 'expense-tracker-feedback';

const createFeedbackEntry = (rating, text) => ({
  rating,
  text,
  date: new Date().toISOString(),
});

const normalizeFeedbackEntry = (entry) => {
  const numericRating = Number(entry?.rating);
  const trimmedText = typeof entry?.text === 'string'
    ? entry.text.trim()
    : typeof entry?.feedback === 'string'
      ? entry.feedback.trim()
      : '';
  const savedDate = typeof entry?.date === 'string'
    ? entry.date
    : typeof entry?.submittedAt === 'string'
      ? entry.submittedAt
      : '';

  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return null;
  }

  if (!trimmedText) {
    return null;
  }

  return {
    rating: numericRating,
    text: trimmedText,
    date: savedDate,
  };
};

const getInitialFeedbackEntries = () => {
  try {
    const savedFeedback = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const legacyFeedback = localStorage.getItem(LEGACY_FEEDBACK_STORAGE_KEY);
    const source = savedFeedback ?? legacyFeedback;
    const parsedFeedback = source ? JSON.parse(source) : [];

    if (!Array.isArray(parsedFeedback)) {
      return [];
    }

    return parsedFeedback.map(normalizeFeedbackEntry).filter(Boolean);
  } catch (storageError) {
    console.error('Failed to load feedback from localStorage.', storageError);
    return [];
  }
};

const formatFeedbackDate = (dateValue) => {
  if (!dateValue) {
    return 'Date unavailable';
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toISOString().slice(0, 10);
};

function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submittedRating, setSubmittedRating] = useState(null);
  const [feedbackEntries, setFeedbackEntries] = useState(getInitialFeedbackEntries);

  useEffect(() => {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackEntries));
    } catch (storageError) {
      console.error('Failed to save feedback to localStorage.', storageError);
    }
  }, [feedbackEntries]);

  const activeRating = hoveredRating || rating;
  const ratingMessage = hoveredRating
    ? `Previewing ${hoveredRating} out of 5 stars`
    : rating > 0
      ? `${rating} out of 5 stars selected`
      : 'Choose a rating from 1 to 5 stars.';
  const averageRating = feedbackEntries.length > 0
    ? (
        feedbackEntries.reduce((total, entry) => total + entry.rating, 0) /
        feedbackEntries.length
      ).toFixed(1)
    : '0.0';

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedFeedback = feedback.trim();

    if (!rating) {
      setError('Please choose a star rating before submitting.');
      return;
    }

    if (!trimmedFeedback) {
      setError('Please share a few words of feedback before submitting.');
      return;
    }

    try {
      setFeedbackEntries((currentEntries) => [
        ...currentEntries,
        createFeedbackEntry(rating, trimmedFeedback),
      ]);
    } catch (storageError) {
      console.error('Failed to save feedback to localStorage.', storageError);
      setError('Unable to save your feedback right now. Please try again.');
      return;
    }

    setError('');
    setSubmittedRating(rating);
    setFeedback('');
    setHoveredRating(0);
    setRating(0);
  };

  const handleSelectRating = (nextRating) => {
    setRating(nextRating);
    setHoveredRating(0);
    setSubmittedRating(null);
    setError('');
  };

  return (
    <section className="page-panel">
      <div className="page-intro">
        <h2>Feedback</h2>
        <p>
          Share a quick rating and tell us what is working well or what could be
          improved next.
        </p>
      </div>

      <div className="feedback-average-card">
        <span>Average Rating</span>
        <strong>{averageRating} / 5</strong>
      </div>

      <form className="expense-form feedback-form" onSubmit={handleSubmit}>
        <div className="form-heading">
          <h2>Rate Your Experience</h2>
          <p>Your feedback helps shape the next improvements to the tracker.</p>
        </div>

        <div className="feedback-rating-panel">
          <span className="feedback-label">Star Rating</span>
          <div
            aria-describedby="feedback-rating-copy"
            aria-label="Star rating"
            className="feedback-star-group"
            role="group"
            onMouseLeave={() => setHoveredRating(0)}
          >
            {STAR_OPTIONS.map((value) => {
              const isHighlighted = value <= activeRating;
              const isSelected = value <= rating;
              const isPreviewing = hoveredRating > 0 && value <= hoveredRating;
              const className = [
                'feedback-star-button',
                isHighlighted ? 'feedback-star-button-highlighted' : '',
                isSelected ? 'feedback-star-button-selected' : '',
                isPreviewing ? 'feedback-star-button-preview' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={rating === value}
                  className={className}
                  type="button"
                  onBlur={() => setHoveredRating(0)}
                  onClick={() => handleSelectRating(value)}
                  onFocus={() => setHoveredRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                >
                  {'\u2605'}
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="feedback-rating-copy" id="feedback-rating-copy">
            {ratingMessage}
          </p>
        </div>

        <label className="form-field feedback-field" htmlFor="feedback-message">
          <span>Your Feedback</span>
          <textarea
            id="feedback-message"
            className="feedback-textarea"
            placeholder="Tell us what you like or what we should improve."
            rows="5"
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              setSubmittedRating(null);
              setError('');
            }}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        {submittedRating ? (
          <div className="feedback-success" role="status">
            <strong>Thanks for the feedback.</strong>
            <p>Your {submittedRating}-star response was received successfully.</p>
          </div>
        ) : null}

        <div className="form-actions">
          <button className="primary-button" type="submit">
            Submit Feedback
          </button>
        </div>
      </form>

      <section className="feedback-history">
        <div className="list-header">
          <h2>Previous Feedback</h2>
          <span>{feedbackEntries.length} entries</span>
        </div>

        {feedbackEntries.length > 0 ? (
          <div className="feedback-list">
            {feedbackEntries.map((entry, index) => (
              <article className="feedback-card" key={`${entry.date || 'feedback'}-${index}`}>
                <div className="feedback-card-header">
                  <strong className="feedback-card-rating">
                    {'\u2605'.repeat(entry.rating)}
                  </strong>
                  <span>{entry.rating}/5</span>
                </div>
                <p className="feedback-card-text">{entry.text}</p>
                <p className="feedback-card-date">Date: {formatFeedbackDate(entry.date)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No feedback yet</h2>
            <p>Submitted feedback will appear here once you share your first review.</p>
          </div>
        )}
      </section>
    </section>
  );
}

export default FeedbackPage;